# Demo — innovation/semantic-cache

## What this branch adds

Enables Valkey semantic caching: instead of exact-match key lookups, LiteLLM
embeds each incoming prompt and finds cached responses whose embedding is within
a configurable cosine-similarity threshold (0.92). Repeated-intent queries
("write a Python function to sort a list" / "Python function that sorts a list")
hit the cache even when phrased differently.

Three new files:

| File | Purpose |
|---|---|
| `deployment/valkey-compose-with-search.yaml` | Valkey with `valkey-search` module pre-loaded |
| `litellm/proxy/hooks/local_embeddings_server.py` | FastAPI server: `POST /v1/embeddings` via `all-MiniLM-L6-v2` |
| `deployment/litellm-embeddings.service` | systemd unit for the embedding server |
| `config_examples/semantic-cache.yaml` | Config snippet to merge into the live config |

## Cut-over steps

### Step 1 — install sentence-transformers
```bash
"$HOME/.local/share/litellm-venv/bin/pip" install sentence-transformers
```
First run downloads `all-MiniLM-L6-v2` (~22 MB) to `~/.cache/huggingface/`.

### Step 2 — switch to valkey-search image
```bash
cd "$HOME/valkey"
# Back up the live compose:
cp redis-valkey-compose.yaml redis-valkey-compose.yaml.bak
# Replace with the search-enabled version:
cp "$HOME/litellm-fork/deployment/valkey-compose-with-search.yaml" redis-valkey-compose.yaml
docker compose -f redis-valkey-compose.yaml down
docker compose -f redis-valkey-compose.yaml up -d
# Verify module is loaded:
docker exec redis-valkey valkey-cli MODULE LIST
# Should include: name "search" ver ...
```

### Step 3 — install and start the embedding service
```bash
sudo cp "$HOME/litellm-fork/deployment/litellm-embeddings.service" \
    /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now litellm-embeddings
# Test it:
curl -s http://localhost:8890/health
curl -s -X POST http://localhost:8890/v1/embeddings \
    -H "Content-Type: application/json" \
    -d '{"input": "hello world"}' | python3 -m json.tool | head -10
```

### Step 4 — update the live config
Merge the relevant sections from `config_examples/semantic-cache.yaml` into
`~/.config/litellm/config.yaml`:
- Add the `local/minilm` entry under `model_list`
- Replace the `cache_params` block (change `type` to `valkey-semantic`, add
  `valkey_semantic_cache_embedding_model`, `redis_semantic_cache_similarity_threshold`,
  change `mode` to `default_on`)

```bash
sudo systemctl restart litellm
```

## Expected latency

| Operation | Time |
|---|---|
| Embedding server cold start (model load) | ~2 s |
| Per-request embedding (CPU, single sentence) | < 50 ms |
| Valkey KNN query | < 5 ms |
| Cache miss overhead vs. exact-match cache | ~55 ms |
| Cache hit (semantic) | ~60 ms total vs. 2–30 s for the LLM |

## What's stubbed / not included

- The similarity threshold (0.92) is a starting point. Lower it if you're seeing
  too many misses; raise it if you're seeing false hits (wrong answers returned).
- The embedding server has no auth. It binds to `127.0.0.1`.
- The `valkey-search:8.0.1-ubuntu` image is larger than `valkey:8.0.1-alpine`. The
  existing volume (`redis-data`) is reused, so existing cached data persists.

## Running the tests

```bash
# Tests skip automatically if sentence-transformers is absent:
pytest tests/test_litellm/proxy/hooks/test_local_embeddings_server.py -v

# After installing sentence-transformers, all 6 tests run and pass.
```
