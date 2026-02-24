import os
import json
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from rag.llm_assistant import answer_query

load_dotenv()

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMO_SPIKE_PATH = os.environ.get("DEMO_SPIKE_PATH",
    os.path.join(_BASE_DIR, "tmp", "demo_spike.json"))
# ensure tmp dir exists
os.makedirs(os.path.dirname(DEMO_SPIKE_PATH), exist_ok=True)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_SIMPLE_STORE: list[str] = []


def _load_simple_store() -> None:
    for fname in os.listdir(DATA_DIR):
        fpath = os.path.join(DATA_DIR, fname)
        if os.path.isfile(fpath) and fname.endswith(".txt"):
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            chunks = [content[i:i+600] for i in range(0, len(content), 600)]
            _SIMPLE_STORE.extend(chunks)


def _retrieve_docs(question: str, top_k: int = 5) -> list[str]:
    if not _SIMPLE_STORE:
        return []
    q_lower = question.lower()
    scored = []
    for chunk in _SIMPLE_STORE:
        score = sum(1 for word in q_lower.split() if word in chunk.lower())
        scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k] if _ > 0] or _SIMPLE_STORE[:top_k]


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_simple_store()
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("[WARNING] GEMINI_API_KEY not set — falling back to cached demo answers.")
    yield


app = FastAPI(title="GreenPulse API", version="1.0.0", lifespan=lifespan)


class QueryRequest(BaseModel):
    question: str


class SpikeRequest(BaseModel):
    vehicle_id: str


@app.post("/query")
async def query_endpoint(req: QueryRequest) -> dict:
    """Accept a natural language question, retrieve relevant docs, and return a grounded LLM answer."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    docs = _retrieve_docs(req.question)
    result = answer_query(req.question, docs)
    return result


@app.post("/spike")
async def spike_endpoint(req: SpikeRequest) -> dict:
    """Write a spike flag to /tmp/demo_spike.json so gps_fuel_stream.py emits 10x fuel for that vehicle."""
    payload = {"vehicle_id": req.vehicle_id, "ts": time.time()}
    try:
        with open(DEMO_SPIKE_PATH, "w") as f:
            json.dump(payload, f)
        return {"status": "spike_set", "vehicle_id": req.vehicle_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not write spike flag: {e}")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "docs_loaded": len(_SIMPLE_STORE)}
