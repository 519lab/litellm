"""
Standalone local embeddings server for semantic cache.

Exposes POST /v1/embeddings with an OpenAI-compatible response so LiteLLM
can route `local/minilm` embeddings here instead of calling an external API.

Model: all-MiniLM-L6-v2 (22 MB, runs on CPU, ~50 ms per batch after warmup).

Usage:
    python -m litellm.proxy.hooks.local_embeddings_server
    # or:
    python litellm/proxy/hooks/local_embeddings_server.py
"""

from __future__ import annotations

import threading
from typing import Union

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Local Embeddings", version="1.0.0")

_MODEL_NAME = "all-MiniLM-L6-v2"
_model_lock = threading.Lock()
_model = None  # mutable-ok: lazy singleton, guarded by _model_lock


def _get_model():
    global _model
    with _model_lock:
        if _model is None:
            try:
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer(_MODEL_NAME)
            except ImportError:
                raise
    return _model


class EmbeddingRequest(BaseModel):
    input: Union[str, list[str]]
    model: str = _MODEL_NAME
    encoding_format: str = "float"


@app.post("/v1/embeddings")
def create_embeddings(request: EmbeddingRequest) -> dict:
    if request.model != _MODEL_NAME:
        raise HTTPException(
            status_code=422,
            detail=f"model must be '{_MODEL_NAME}', got '{request.model}'",
        )
    if request.encoding_format != "float":
        raise HTTPException(
            status_code=422,
            detail=f"encoding_format '{request.encoding_format}' is not supported; use 'float'",
        )

    texts = [request.input] if isinstance(request.input, str) else request.input
    if not texts:
        raise HTTPException(status_code=422, detail="input must be a non-empty string or list")

    try:
        model = _get_model()
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="sentence-transformers not installed. Run: pip install sentence-transformers",
        )

    vectors = model.encode(texts, convert_to_numpy=True)

    data = [
        {"object": "embedding", "embedding": vec.tolist(), "index": i}
        for i, vec in enumerate(vectors)
    ]

    total_tokens = max(1, int(sum(len(t.split()) * 1.3 for t in texts)))

    return {
        "object": "list",
        "data": data,
        "model": _MODEL_NAME,
        "usage": {"prompt_tokens": total_tokens, "total_tokens": total_tokens},
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": _MODEL_NAME, "model_loaded": _model is not None}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8890)
