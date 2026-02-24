import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_CHUNKS: list[dict] = []  # {text: str, source: str}


def load_documents() -> None:
    """Load and chunk all /data .txt files into memory."""
    global _CHUNKS
    _CHUNKS = []
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.endswith(".txt"):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        source = fname.replace(".txt", "").replace("_", " ").title()
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        # Split into 500-char overlapping chunks
        size, overlap = 500, 100
        for i in range(0, len(content), size - overlap):
            chunk = content[i:i + size].strip()
            if len(chunk) > 80:
                _CHUNKS.append({"text": chunk, "source": source})


def retrieve(question: str, top_k: int = 5) -> list[dict]:
    """BM25-style keyword retrieval over loaded chunks."""
    if not _CHUNKS:
        load_documents()
    q_words = set(question.lower().split())
    scored = []
    for chunk in _CHUNKS:
        score = sum(1 for w in q_words if w in chunk["text"].lower())
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [c for _, c in scored[:top_k]]
    return results if results else _CHUNKS[:top_k]
