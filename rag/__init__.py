"""
RouteZero RAG (Retrieval-Augmented Generation) Package.

Implements BM25-based document retrieval over IPCC AR6, NLP 2022,
and BEE-ICM guidelines, with Gemini 1.5 Pro for grounded responses.

Modules:
    api_server: FastAPI application with all REST endpoints.
    retriever: BM25 document retrieval over policy corpus.
    gemini_client: Google Gemini 1.5 Pro LLM integration.
    fleet_reader: JSONL fleet state reader from Pathway output.
    green_ai: High-level RAG orchestration for fleet risk queries.
"""

__version__ = "2.0.0"
