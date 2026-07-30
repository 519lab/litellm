"""
Tests for the local embeddings server (innovation/semantic-cache).

Error-path tests (ImportError 503, empty input 422, field validation 422) run
on every CI machine regardless of whether sentence-transformers is installed.
Embedding tests that need the real model are skipped when it is absent.
"""

from __future__ import annotations

import sys
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import litellm.proxy.hooks.local_embeddings_server as server_module
from litellm.proxy.hooks.local_embeddings_server import app, _MODEL_NAME


def _st_available() -> bool:
    try:
        import sentence_transformers  # noqa: F401
        return True
    except ImportError:
        return False


requires_st = pytest.mark.skipif(not _st_available(), reason="sentence-transformers not installed")


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_model():
    original = server_module._model
    yield
    server_module._model = original


class TestImportErrorPath:
    def test_503_when_sentence_transformers_missing(self, client):
        with patch.dict(sys.modules, {"sentence_transformers": None}):
            server_module._model = None
            resp = client.post("/v1/embeddings", json={"input": "hello"})
        assert resp.status_code == 503
        assert "sentence-transformers" in resp.json()["detail"]


class TestValidation:
    def test_empty_list_input_returns_422(self, client):
        resp = client.post("/v1/embeddings", json={"input": []})
        assert resp.status_code == 422

    def test_wrong_model_name_returns_422(self, client):
        resp = client.post("/v1/embeddings", json={"input": "hi", "model": "text-embedding-3-small"})
        assert resp.status_code == 422
        assert _MODEL_NAME in resp.json()["detail"]

    def test_unsupported_encoding_format_returns_422(self, client):
        resp = client.post("/v1/embeddings", json={"input": "hi", "encoding_format": "base64"})
        assert resp.status_code == 422


class TestHealth:
    def test_health_returns_model_name(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["model"] == _MODEL_NAME

    def test_health_reflects_unloaded_state(self, client):
        server_module._model = None
        resp = client.get("/health")
        assert resp.json()["model_loaded"] is False

    @requires_st
    def test_health_reflects_loaded_state(self, client):
        server_module._get_model()
        resp = client.get("/health")
        assert resp.json()["model_loaded"] is True


@requires_st
class TestEmbeddings:
    def test_single_string_returns_200(self, client):
        resp = client.post("/v1/embeddings", json={"input": "hello world"})
        assert resp.status_code == 200

    def test_single_string_response_shape(self, client):
        resp = client.post("/v1/embeddings", json={"input": "hello world"})
        body = resp.json()
        assert body["object"] == "list"
        assert len(body["data"]) == 1
        item = body["data"][0]
        assert item["object"] == "embedding"
        assert item["index"] == 0
        assert isinstance(item["embedding"], list)
        assert len(item["embedding"]) > 0
        assert all(isinstance(v, float) for v in item["embedding"])

    def test_model_name_in_response(self, client):
        body = client.post("/v1/embeddings", json={"input": "hello"}).json()
        assert body["model"] == _MODEL_NAME

    def test_list_input_returns_one_embedding_per_string(self, client):
        texts = ["first sentence", "second sentence", "third"]
        resp = client.post("/v1/embeddings", json={"input": texts})
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == len(texts)
        for i, item in enumerate(body["data"]):
            assert item["index"] == i
            assert len(item["embedding"]) > 0

    def test_embedding_dimension_consistent(self, client):
        r1 = client.post("/v1/embeddings", json={"input": "foo"}).json()
        r2 = client.post("/v1/embeddings", json={"input": "bar"}).json()
        assert len(r1["data"][0]["embedding"]) == len(r2["data"][0]["embedding"])

    def test_usage_total_tokens_positive(self, client):
        resp = client.post("/v1/embeddings", json={"input": "hello world, this is a test"})
        body = resp.json()
        assert body["usage"]["total_tokens"] > 0
        assert body["usage"]["prompt_tokens"] == body["usage"]["total_tokens"]
