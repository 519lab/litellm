"""
Tests for the local embeddings server (innovation/semantic-cache).

sentence-transformers is an optional dependency; all tests are skipped if it
is not installed so CI doesn't hard-fail on a missing package.
"""

import pytest

sentence_transformers = pytest.importorskip(
    "sentence_transformers",
    reason="sentence-transformers not installed; skipping embedding server tests",
)

from fastapi.testclient import TestClient
from litellm.proxy.hooks.local_embeddings_server import app

@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_single_string_returns_200(client):
    resp = client.post("/v1/embeddings", json={"input": "hello world"})
    assert resp.status_code == 200


def test_single_string_response_shape(client):
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


def test_list_input_returns_one_embedding_per_string(client):
    texts = ["first sentence", "second sentence", "third"]
    resp = client.post("/v1/embeddings", json={"input": texts})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["data"]) == len(texts)
    for i, item in enumerate(body["data"]):
        assert item["index"] == i
        assert len(item["embedding"]) > 0


def test_embedding_dimension_consistent(client):
    r1 = client.post("/v1/embeddings", json={"input": "foo"}).json()
    r2 = client.post("/v1/embeddings", json={"input": "bar"}).json()
    assert len(r1["data"][0]["embedding"]) == len(r2["data"][0]["embedding"])


def test_usage_total_tokens_positive(client):
    resp = client.post("/v1/embeddings", json={"input": "hello world, this is a test"})
    body = resp.json()
    assert body["usage"]["total_tokens"] > 0
    assert body["usage"]["prompt_tokens"] == body["usage"]["total_tokens"]


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
