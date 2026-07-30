# Demo — innovation/otlp-tracing

## What this branch does

Adds `litellm/proxy/hooks/otlp_tracer.py` — a CustomLogger hook that wraps every LLM
request in an OpenTelemetry span and exports it to any OTLP/gRPC receiver.

## What each span contains

| Attribute | Description |
|---|---|
| `llm.model` | Model name |
| `llm.prompt_tokens` | Input token count |
| `llm.completion_tokens` | Output token count |
| `llm.total_tokens` | Total tokens |
| `llm.duration_ms` | Full round-trip in ms |
| `llm.tpot_ms` | Time-per-output-token (ms/token) |
| `llm.tps` | Tokens per second (computed from above) |
| `llamacpp.tps` | TPS from `x-llamacpp-tokens-per-second` header (llama.cpp only) |
| `llamacpp.speculative_acceptance_rate` | From `x-llamacpp-draft-n-accepted` header |
| `cache.hit` | True if served from Valkey cache |
| `error` | True if the request failed |

## What's stubbed / notes

- TTFT (time-to-first-token) is not yet measured because LiteLLM's CustomLogger API
  doesn't expose the first-chunk timestamp directly. The next increment is to add a
  streaming hook that records the monotonic time of the first `async_log_stream_event`
  call, then subtract the pre-call `t0` to get true TTFT.
- The hook is passive: if the OTLP endpoint is unreachable, spans are silently dropped
  and the request proceeds normally.

## To enable

1. Install dependencies (already done if you're on this fork's editable install):
   ```bash
   pip install opentelemetry-sdk opentelemetry-exporter-otlp-proto-grpc
   ```

2. Set the endpoint env var (optional, defaults to `http://localhost:4317`):
   ```bash
   OTLP_ENDPOINT=http://localhost:4317
   ```

3. Add to `config.yaml`:
   ```yaml
   litellm_settings:
     callbacks:
       - litellm.proxy.hooks.otlp_tracer.make_hook
   ```

4. Start a local OTLP receiver. The easiest option for a single machine:
   ```bash
   docker run --rm -p 4317:4317 -p 16686:16686 \
     jaegertracing/all-in-one:latest
   # Then open http://localhost:16686
   ```

5. Send a request and look for "litellm-proxy" service in Jaeger.

## Running the tests

```bash
pytest tests/test_litellm/proxy/hooks/test_otlp_tracer.py -v
# 12 passed
```
