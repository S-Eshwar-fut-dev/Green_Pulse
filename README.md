# 🌿 GreenPulse — Real-Time Carbon Intelligence for Indian Logistics

> **Hack For Green Bharat** — Built on [Pathway](https://pathway.com) · Gemini 1.5 Pro · Next.js 14

---

## The Problem

India's logistics sector contributes **13.5% of national GHG emissions**. Road transport accounts for 88% of those, with trucks alone emitting 38% of all transport CO₂. There is no real-time, AI-powered system tracking and optimising carbon output from Indian logistics operations — until now.

## Architecture

```
GPS/Fuel Stream (10 trucks × 3 routes)
        │
        ▼
Pathway Pipeline  ─────────────────────────────────────────
   CO₂ UDF (2.68 kg/L)                                    │
   5-min tumbling windows (per-vehicle CO₂, efficiency)    │
   30-min sliding window (anomaly detection)               │
   Haversine route checker                                 │
        │                                                  │
        ▼                                                  │
/tmp/greenPulse/fleet_summary.jsonl  ◄── bridge ──────────┘
        │
        ▼
FastAPI :8000 (/query, /spike)
   Gemini 1.5 Pro + Pathway RAG
        │
        ▼
Next.js :3000 Dashboard
   FleetMap  │  MetricsPanel  │  RollingChart  │  ChatBox  │  AnomalyLog
```

---

## Quick Start (Local)

### 1. Prerequisites
```
Python 3.11+   Node.js 20+   A Gemini API key
```

### 2. Clone & configure
```bash
git clone https://github.com/S-Eshwar-fut-dev/Green_Pulse.git
cd Green_Pulse
cp .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here
```

### 3. Python environment
```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 4. Run all three services (3 terminals)

**Terminal 1 — Pathway Pipeline:**
```bash
python main_pipeline.py
```

**Terminal 2 — FastAPI Server:**
```bash
uvicorn rag.api_server:app --port 8000 --reload
```

**Terminal 3 — Next.js Dashboard:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🚀

---

## Demo Questions (Ask GreenAI)

| # | Question |
|---|---------|
| 1 | Which truck has emitted the most CO₂ in the last hour? |
| 2 | How much carbon has our fleet saved vs baseline today? |
| 3 | Are there any active anomalies right now? |
| 4 | What is the most fuel-efficient route in our fleet today? |
| 5 | Does our current emission rate comply with the National Logistics Policy targets? |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Streaming engine | Pathway 0.29.0 |
| LLM | Gemini 1.5 Pro via google-generativeai |
| RAG | Pathway Document Store + BM25 |
| API | FastAPI 0.110.0 + Uvicorn |
| Frontend | Next.js 14.2.3, React-Leaflet, Recharts |
| Styling | Tailwind CSS 3.4.3 |

---

## Carbon Formula

`CO₂ (kg) = Fuel consumed (L) × 2.68` — IPCC AR6 diesel emission factor

Anomaly fires when: `5-min CO₂ > 2 × 30-min rolling average`
