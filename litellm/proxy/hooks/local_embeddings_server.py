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

from typing import Union

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Local Embeddings", version="1.0.0")

_model = None
_MODEL_NAME = "all-MiniLM-L6-v2"


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


class EmbeddingRequest(BaseModel):
    input: Union[str, list[str]]
    model: str = _MODEL_NAME
    encoding_format: str = "float"


@app.post("/v1/embeddings")
def create_embeddings(request: EmbeddingRequest):
    try:
        model = _get_model()
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="sentence-transformers not installed. Run: pip install sentence-transformers",
        )

    texts = [request.input] if isinstance(request.input, str) else request.input
    if not texts:
        raise HTTPException(status_code=422, detail="input must be a non-empty string or list")

    vectors = model.encode(texts, convert_to_numpy=True)

    data = [
        {"object": "embedding", "embedding": vec.tolist(), "index": i}
        for i, vec in enumerate(vectors)
    ]

    # Approximate token count: split on whitespace, 1.3 tokens per word.
    total_tokens = max(1, int(sum(len(t.split()) * 1.3 for t in texts)))

    return {
        "object": "list",
        "data": data,
        "model": _MODEL_NAME,
        "usage": {"prompt_tokens": total_tokens, "total_tokens": total_tokens},
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": _MODEL_NAME}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8890)
