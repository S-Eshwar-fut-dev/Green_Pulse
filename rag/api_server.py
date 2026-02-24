import os
import json
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import DEMO_SPIKE_PATH
from rag.document_store import load_documents, retrieve
from rag.llm_assistant import answer_query

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_documents()
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("[WARNING] GEMINI_API_KEY not set - falling back to cached demo answers.")
    yield


app = FastAPI(title="GreenPulse API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str


class SpikeRequest(BaseModel):
    vehicle_id: str


@app.post("/query")
async def query_endpoint(req: QueryRequest) -> dict:
    """Accept a natural language question, retrieve relevant docs, and return a grounded LLM answer."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    docs = retrieve(req.question)
    result = answer_query(req.question, docs)
    return result


@app.post("/spike")
async def spike_endpoint(req: SpikeRequest) -> dict:
    """Write a spike flag so the pipeline emits 10x fuel for that vehicle."""
    payload = {"vehicle_id": req.vehicle_id, "ts": time.time()}
    try:
        with open(DEMO_SPIKE_PATH, "w") as f:
            json.dump(payload, f)
        return {"status": "spike_set", "vehicle_id": req.vehicle_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not write spike flag: {e}")


@app.get("/health")
async def health() -> dict:
    from rag.document_store import _CHUNKS
    return {"status": "ok", "docs_loaded": len(_CHUNKS)}
