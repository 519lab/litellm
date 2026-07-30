"""Regression tests for litellm.proxy.hooks.local_embeddings_server.

All tests stub out SentenceTransformer so sentence-transformers does not need
to be installed.
"""
from __future__ import annotations

import sys
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from fastapi.testclient import TestClient

import litellm.proxy.hooks.local_embeddings_server as server
from litellm.proxy.hooks.local_embeddings_server import _MODEL_NAME, _model_lock, app

client = TestClient(app)

_FAKE_VECTORS = np.zeros((1, 3), dtype=np.float32)


def _fake_model() -> MagicMock:
    m = MagicMock()
    m.encode.return_value = _FAKE_VECTORS
    return m


# ---------------------------------------------------------------------------
# BLOCKER 1 regression: validation order
# ---------------------------------------------------------------------------

def test_empty_input_list_returns_422_not_503():
    """Empty input list must return 422 before _get_model() is called.

    Regression: when sentence-transformers was absent and input=[] was sent,
    the endpoint called _get_model() first and returned 503 instead of 422.
    """
    with patch.object(server, "_model", None):
        with patch.dict(sys.modules, {"sentence_transformers": None}):
            response = client.post("/v1/embeddings", json={"input": []})
    assert response.status_code == 422, (
        f"Expected 422 for empty input, got {response.status_code}; "
        "validation order bug: _get_model() ran before the empty-input guard"
    )


# ---------------------------------------------------------------------------
# BLOCKER 2 regression: lock not held during encode
# ---------------------------------------------------------------------------

def test_lock_not_held_during_encode():
    """_model_lock must NOT be held when model.encode() is called.

    Regression: the lock was held around encode(), serializing all concurrent
    requests despite the loaded model being read-only after initialization.
    """
    lock_held: list[bool] = []
    fake = _fake_model()

    def encode_spy(texts: list[str], **kwargs: object) -> np.ndarray:
        lock_held.append(_model_lock.locked())
        return _FAKE_VECTORS

    fake.encode.side_effect = encode_spy

    with patch.object(server, "_model", fake):
        response = client.post("/v1/embeddings", json={"input": "hello"})

    assert response.status_code == 200
    assert lock_held == [False], (
        f"Expected _model_lock.locked()=False inside encode(), got {lock_held}; "
        "lock-during-encode bug: lock was still held when encode() was called"
    )


# ---------------------------------------------------------------------------
# Happy-path and other validation tests
# ---------------------------------------------------------------------------

def test_valid_string_input_returns_embedding():
    fake = _fake_model()
    fake.encode.return_value = np.array([[0.1, 0.2, 0.3]], dtype=np.float32)
    with patch.object(server, "_model", fake):
        response = client.post("/v1/embeddings", json={"input": "hello world"})
    assert response.status_code == 200
    body = response.json()
    assert body["object"] == "list"
    assert len(body["data"]) == 1
    assert body["data"][0]["embedding"] == pytest.approx([0.1, 0.2, 0.3])


def test_valid_list_input_returns_multiple_embeddings():
    fake = MagicMock()
    fake.encode.return_value = np.zeros((2, 3), dtype=np.float32)
    with patch.object(server, "_model", fake):
        response = client.post("/v1/embeddings", json={"input": ["a", "b"]})
    assert response.status_code == 200
    assert len(response.json()["data"]) == 2


def test_wrong_model_name_returns_422():
    response = client.post("/v1/embeddings", json={"input": "hi", "model": "gpt-4"})
    assert response.status_code == 422


def test_unsupported_encoding_format_returns_422():
    response = client.post(
        "/v1/embeddings", json={"input": "hi", "encoding_format": "base64"}
    )
    assert response.status_code == 422


def test_missing_sentence_transformers_returns_503():
    with patch.object(server, "_model", None):
        with patch.dict(sys.modules, {"sentence_transformers": None}):
            response = client.post("/v1/embeddings", json={"input": "hello"})
    assert response.status_code == 503


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
