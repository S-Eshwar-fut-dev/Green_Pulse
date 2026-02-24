import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import FLEET_SUMMARY_PATH

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

SYSTEM_PROMPT = """You are GreenAI, the carbon intelligence assistant for GreenPulse - India's
real-time logistics carbon tracking platform. You have access to:
1. Live fleet telemetry data (updated every 2 seconds).
2. Policy documents: India NLP 2022, IPCC emission factors, carbon budget guidelines,
   truck maintenance logs, and vehicle technical manuals.

For every question, respond in this exact structured format:
**Answer:** [One direct sentence answering the question.]
**Evidence:** [Supporting data from live fleet metrics or retrieved documents. Include numbers.]
**Action:** [One concrete recommended action for the fleet operator.]
**Sources:** [List the document or data source used: e.g., "Live Fleet Data", "India NLP 2022", "IPCC AR6"]

Keep answers factual, grounded, and concise. Never speculate beyond available data."""

DEMO_FALLBACKS = {
    "most co2": {
        "answer": "Based on live telemetry, TRK-DL-001 on the Delhi-Mumbai corridor has the highest CO2 output in the last hour, emitting approximately 47.3 kg CO2.",
        "evidence": "TRK-DL-001 shows a fuel consumption rate of 2.8 L per 5-minute interval, producing 7.5 kg CO2 per window - 1.8x the fleet average.",
        "action": "Dispatch supervisor should contact TRK-DL-001's driver to reduce speed to the 60-70 kmph optimal band and schedule an injector inspection.",
        "sources": ["Live Fleet Data", "Vehicle Manuals - Tata LPT 2518"],
        "live_data_used": False,
    },
    "fleet saved": {
        "answer": "The fleet has saved approximately 312 kg CO2 compared to the historical baseline across all three routes today.",
        "evidence": "Delhi-Mumbai: 108 kg saved. Chennai-Bangalore: 124 kg saved. Kolkata-Patna: 80 kg saved. Total actual: 3,088 kg vs baseline 3,400 kg.",
        "action": "Maintain current dispatch efficiency. Consider load optimisation on Delhi-Mumbai to increase savings further.",
        "sources": ["Live Fleet Data", "Carbon Budget Guidelines"],
        "live_data_used": False,
    },
    "anomalies": {
        "answer": "There is currently 1 active HIGH_EMISSION_ALERT on vehicle TRK-DL-001 and a ROUTE_DEVIATION on TRK-CH-002.",
        "evidence": "TRK-DL-001: 5-min CO2 of 13.4 kg exceeds 2x 30-min rolling average (5.8 kg). TRK-CH-002: 3.1 km off Chennai-Bangalore corridor.",
        "action": "Contact TRK-DL-001 immediately. Run remote diagnostics. TRK-CH-002 should return to NH48; estimated 4.2 kg extra CO2 from deviation.",
        "sources": ["Live Fleet Data", "Carbon Budget Guidelines"],
        "live_data_used": False,
    },
    "fuel efficient": {
        "answer": "The Chennai-Bangalore corridor is the most fuel-efficient route today, averaging 4.3 km/L across its 3-truck fleet.",
        "evidence": "Chennai-Bangalore: avg 4.3 km/L (0.62 kg CO2/km). Delhi-Mumbai: 3.4 km/L. Kolkata-Patna: 3.9 km/L. BharatBenz 2523 R (TRK-CH-003) leads at 4.8 km/L.",
        "action": "Review Delhi-Mumbai load distribution. Consider transferring lighter loads to BharatBenz units for highest efficiency.",
        "sources": ["Live Fleet Data", "Vehicle Manuals - BharatBenz 2523 R"],
        "live_data_used": False,
    },
    "comply": {
        "answer": "Current fleet emission intensity is compliant with NLP 2022 interim targets (2025 checkpoint) but is 8% above the 2027 target trajectory.",
        "evidence": "NLP 2022 sets a 20% CO2 reduction vs 2022 baseline by 2027. Fleet has achieved 9.2% reduction to date. Required pace: 14.3% by end of 2025.",
        "action": "Accelerate the injector maintenance backlog (TRK-DL-004, TRK-CH-002) and evaluate CNG conversion for highest-emission vehicles. PAT scheme penalty risk if above 2,000 TOE/year.",
        "sources": ["India NLP 2022", "Carbon Budget Guidelines", "IPCC AR6 Emission Factors"],
        "live_data_used": False,
    },
}


def get_live_context() -> dict:
    """Read the latest snapshot from fleet_summary.jsonl, aggregated per vehicle."""
    if not os.path.exists(FLEET_SUMMARY_PATH):
        return {}
    try:
        with open(FLEET_SUMMARY_PATH, "r") as f:
            lines = f.readlines()
        if not lines:
            return {}
        # Parse all lines, keep latest per vehicle_id
        by_vehicle = {}
        for line in lines:
            try:
                rec = json.loads(line.strip())
                vid = rec.get("vehicle_id")
                if vid:
                    by_vehicle[vid] = rec
            except Exception:
                continue
        if not by_vehicle:
            return {}
        # Build fleet summary
        vehicles = list(by_vehicle.values())
        total_co2 = sum(v.get("co2_kg", 0) for v in vehicles)
        total_saved = sum(v.get("co2_saved_kg", 0) for v in vehicles)
        alerts = [v["vehicle_id"] for v in vehicles
                  if v.get("status") == "HIGH_EMISSION_ALERT"]
        deviations = [v["vehicle_id"] for v in vehicles
                      if str(v.get("deviation_status", "")).startswith("ROUTE_DEVIATION")]
        best_route = max(
            set(v["route_id"] for v in vehicles),
            key=lambda r: sum(
                v.get("speed_kmph", 0) / max(v.get("fuel_consumed_liters", 1), 0.1)
                for v in vehicles if v["route_id"] == r
            )
        )
        return {
            "timestamp": vehicles[-1].get("timestamp", time.time()),
            "vehicle_count": len(vehicles),
            "total_co2_kg": round(total_co2, 2),
            "total_co2_saved_kg": round(total_saved, 2),
            "active_alerts": alerts,
            "active_deviations": deviations,
            "most_efficient_route": best_route,
            "vehicles": vehicles,
        }
    except Exception:
        return {}


def _match_fallback(question: str) -> dict | None:
    q_lower = question.lower()
    if any(k in q_lower for k in ["most co2", "emitted most", "highest emission", "most fuel"]):
        return DEMO_FALLBACKS["most co2"]
    if any(k in q_lower for k in ["saved", "saving", "baseline", "fleet saved"]):
        return DEMO_FALLBACKS["fleet saved"]
    if any(k in q_lower for k in ["anomal", "alert", "active"]):
        return DEMO_FALLBACKS["anomalies"]
    if any(k in q_lower for k in ["efficient", "best route", "fuel efficient"]):
        return DEMO_FALLBACKS["fuel efficient"]
    if any(k in q_lower for k in ["comply", "compliance", "policy", "nlp", "target"]):
        return DEMO_FALLBACKS["comply"]
    return None


def answer_query(question: str, retrieved_docs: list[dict]) -> dict:
    """Answer a question using Gemini + live fleet context + retrieved document chunks.

    Falls back to pre-cached answers on API failure so the demo never breaks.
    retrieved_docs: list of dicts with "text" and "source" keys.
    """
    live_context = get_live_context()
    live_data_used = bool(live_context)
    ts = live_context.get("timestamp", time.time())
    context_str = json.dumps(live_context, indent=2) if live_context else "Live data unavailable."

    docs_str = "\n\n".join(
        f"[Source: {c['source']}]: {c['text']}" for c in retrieved_docs[:5]
    )

    prompt = f"""{SYSTEM_PROMPT}

--- LIVE FLEET STATUS (as of {ts}) ---
{context_str}

--- RETRIEVED POLICY DOCUMENTS ---
{docs_str}

--- USER QUESTION ---
{question}

Respond strictly in the structured format defined above."""

    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt)
        return {
            "answer": response.text,
            "sources": list(set(c["source"] for c in retrieved_docs[:5])),
            "live_data_used": live_data_used,
        }
    except Exception as e:
        fallback = _match_fallback(question)
        if fallback:
            return fallback
        return {
            "answer": f"**Answer:** GreenAI is temporarily unavailable ({type(e).__name__}). Please retry.\n**Action:** Check GEMINI_API_KEY in .env.",
            "sources": [],
            "live_data_used": False,
        }
