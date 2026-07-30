# Innovation Proposals — litellm-fork
*Generated 2026-07-29 · based on commit 5ac7ad1*

## How this codebase stands today

A self-hosted LiteLLM fork acting as an AI gateway for a single local llama.cpp inference
node running Qwen3.6-35B (quantized GGUF). The proxy handles virtual keys, spend tracking,
teams, guardrails, and MCP server routing — all the table-stakes gateway work. The
enterprise license gates have been removed, and a custom hook (`llamacpp_hook.py`) strips
JSON Schema keywords that llama.cpp's grammar engine can't handle. Valkey and PostgreSQL
are both running. The UI is a Next.js app with shadcn/ui and Tailwind v4, migrated away
from Tremor (one legacy TabGroup remains in the playground). What's ordinary: caching is
exact-match only and almost always bypassed (`mode: default_off`); there is no
token-latency instrumentation; the memory subsystem (`/v1/memory`) is fully implemented in
the backend but has no UI at all; and the llamacpp hook lives outside the repo as a config
path hack. The identity is generic LiteLLM gray-blue.

## What the best in this space are doing

**Semantic caching.** Domain-specific embeddings now outperform general-purpose models
(text-embedding-ada-002) for cache hit quality on repeated-intent queries. MVR-cache
([arXiv 2025](https://arxiv.org/abs/2504.02268)) adds multi-vector retrieval. LiteLLM
already has `ValkeySemanticCache` coded in `litellm/caching/valkey_semantic_cache.py` —
it is simply never enabled here.

**Token-level latency as a first-class metric.** Helicone and Phoenix now surface TTFT
(time-to-first-token) and TPOT (time-per-output-token) as standard metrics. The LiteLLM
spend-log table records total latency but nothing finer.

**Speculative decode instrumentation.** Qwen3's MTP (multi-token prediction) heads are
built for speculative decoding. A proxy that logs acceptance rate per request helps tune
draft parameters and verify that MTP is actually helping.

**Gateway-level prompt compression.** Studies show −31% input / −74% output tokens on
coding workloads with extractive compression at the proxy layer (LLMLingua-2). Entirely
transparent to clients.

**Trace-level observability.** Langfuse and Phoenix emit nested OpenTelemetry spans for
every request — including per-hop latency in agent chains. Braintrust adds an LLM-as-judge
pipeline that scores completions against a fixed golden set continuously.

**Playground with history.** Braintrust's standout UX: every playground run is auto-logged
and diffable against prior runs. LiteLLM's playground exists but is completely isolated
from the logs view.

## Proposals (ranked)

---

### 1. Enable Valkey semantic cache with a local embedding model

**Category:** performance
**Impact 5 · Novelty 4 · Effort 4 · Fit 5**

**The idea.** Switch the cache from exact-match Redis to `valkey-semantic`, which already
exists in `litellm/caching/valkey_semantic_cache.py`. Use a tiny local embedding model
(e.g. `nomic-embed-text` or `all-MiniLM-L6-v2` via sentence-transformers) so embeddings
are free and local. Set a similarity threshold of 0.92. Repeated-intent queries — "write
me a Python function to…" phrased differently — hit the cache instead of burning GPU time.
**Inspired by.** MVR-cache paper (arXiv 2025); LiteLLM's own `ValkeySemanticCache`
implementation; the Valkey instance already running.
**Implementation sketch.**
1. `pip install sentence-transformers` in the venv.
2. Create `litellm/proxy/hooks/local_embedding_provider.py` that wraps
   `SentenceTransformer("all-MiniLM-L6-v2")` as a drop-in embedding provider litellm
   can point to (override `LITELLM_EMBEDDING_MODEL` env or add a tiny embedding route
   at `/v1/embeddings/local` via a new FastAPI router).
3. In `config.yaml`, change `type: redis` → `type: valkey-semantic`, add
   `redis_semantic_cache_similarity_threshold: 0.92` and point
   `redis_semantic_cache_embedding_model` at the local provider.
4. Switch `mode: default_on` — semantic cache is safe to enable broadly because the
   similarity gate prevents false hits that exact-match is vulnerable to (near-identical
   prompts get different keys; with semantic cache they converge).
**Effort.** 4–6 hours. Main risk: the valkey-search module must be enabled in the Valkey
container (add `--loadmodule /path/to/libvalkey_search.so` to the compose file). Check
with `redis-cli MODULE LIST` first.
**First step.** `docker exec redis-valkey redis-cli MODULE LIST` — if valkey-search is
absent, add it to the compose file and `docker compose up -d`.

---

### 2. OTLP span tracing hook — TTFT, TPOT, speculative decode acceptance rate

**Category:** ops / observability
**Impact 5 · Novelty 5 · Effort 3 · Fit 5**

**The idea.** A custom logger hook that emits OpenTelemetry spans with two metrics that
are completely absent today: TTFT (time from request start to first streaming chunk) and
TPOT (average time per output token). For llama.cpp responses, also parse the
`x-llamacpp-tokens-per-second` response header (or the `usage.completion_tokens` +
elapsed time fallback) to add a `tps` attribute. If speculative decoding is active,
`x-llamacpp-draft-n-accepted` gives the acceptance rate — log that too. Spans are exported
to any OTLP receiver (Grafana Alloy → Tempo, Jaeger, Phoenix) — one hook, any backend.
This transforms the ops story from "we have spend logs" to "we have distributed traces."
**Inspired by.** Helicone's TTFT/TPOT metrics; Phoenix's OpenTelemetry-native approach;
Qwen3 MTP heads that make speculative decoding practical on this exact model.
**Implementation sketch.**
```python
# litellm/proxy/hooks/otlp_tracer.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from litellm.integrations.custom_logger import CustomLogger
import time

class OTLPTracerHook(CustomLogger):
    def __init__(self, otlp_endpoint: str = "http://localhost:4317"):
        provider = TracerProvider()
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint)))
        trace.set_tracer_provider(provider)
        self._tracer = trace.get_tracer("litellm-fork")
        self._spans: dict[str, Any] = {}

    async def async_pre_call_hook(self, kwargs, cache_hit=False, **kw):
        span = self._tracer.start_span(kwargs.get("model", "unknown"))
        span.set_attribute("cache.hit", cache_hit)
        self._spans[kwargs.get("litellm_call_id", "")] = (span, time.monotonic())
        return kwargs

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time, **kw):
        call_id = kwargs.get("litellm_call_id", "")
        entry = self._spans.pop(call_id, None)
        if not entry:
            return
        span, t0 = entry
        usage = getattr(response_obj, "usage", None)
        ct = getattr(usage, "completion_tokens", 0) or 1
        elapsed = time.monotonic() - t0
        span.set_attribute("llm.tpot_ms", round(elapsed * 1000 / ct, 2))
        span.set_attribute("llm.completion_tokens", ct)
        # llama.cpp header forwarded by LiteLLM in _response_headers
        hdrs = kwargs.get("_response_headers", {})
        if tps := hdrs.get("x-llamacpp-tokens-per-second"):
            span.set_attribute("llamacpp.tps", float(tps))
        if acc := hdrs.get("x-llamacpp-draft-n-accepted"):
            span.set_attribute("llamacpp.speculative_acceptance_rate", float(acc))
        span.end()
```
Add `pip install opentelemetry-sdk opentelemetry-exporter-otlp` to the venv and register
in `config.yaml` callbacks. Add a lightweight TPS sparkline widget to the dashboard header
that polls `/health/readiness` + a new `/metrics/tps` endpoint that returns the rolling
5-minute average.
**Effort.** 1 day (hook: 3 h; dashboard widget: 3 h; OTLP receiver setup: 1 h).
**First step.** Write the hook, register it in config, run a request, verify spans appear
in the LiteLLM verbose log before wiring any OTLP receiver.

---

### 3. Move llamacpp_hook into the fork as a first-class plugin

**Category:** architecture / DX
**Impact 3 · Novelty 3 · Effort 5 · Fit 5**

**The idea.** `llamacpp_hook.py` currently lives in `/home/ggrace/.config/litellm/` and is
referenced by filesystem path in `config.yaml`. It can't be versioned with the fork,
tested independently, or discovered without reading the config. Move it to
`litellm/proxy/hooks/llamacpp/`, register it as a first-class module, and wire it up so
the config just references `litellm.proxy.hooks.llamacpp.proxy_handler_instance`. The
schema-sanitization logic improves naturally when it's in the same repo as the hook test
suite.
**Inspired by.** The existing `litellm/proxy/hooks/` structure (prompt_injection_detection,
max_budget_limiter, etc.); the fork's own CLAUDE.md asking for dependency injection over
config-path hacks.
**Implementation sketch.**
- Create `litellm/proxy/hooks/llamacpp/__init__.py` exporting `proxy_handler_instance`.
- Move the sanitization logic verbatim; add a unit test
  `tests/test_litellm/proxy/hooks/test_llamacpp_hook.py` covering the five failure modes.
- Update `config.yaml`: `callbacks: [litellm.proxy.hooks.llamacpp.proxy_handler_instance]`
- Delete the external file from `/home/ggrace/.config/litellm/`.
**Effort.** 3 hours. Risk: none — pure move, same logic.
**First step.** `mkdir -p litellm/proxy/hooks/llamacpp && cp ~/.config/litellm/llamacpp_hook.py litellm/proxy/hooks/llamacpp/main.py`

---

### 4. Memory browser UI

**Category:** feature / UX
**Impact 4 · Novelty 3 · Effort 4 · Fit 5**

**The idea.** The `/v1/memory` CRUD API is fully implemented (create, list, get, upsert,
delete) with user/team scoping and admin visibility. There is zero UI for it. Build a
dashboard page at `/memory` that shows a searchable table of memory entries with inline
edit/delete and a "New Memory" form. Admins see all entries with user/team columns; regular
users see only their own. The memory feature is one of the most distinctive things about
this proxy — it should be visible.
**Inspired by.** The existing `/v1/memory` implementation; the general pattern of the
`/api-keys` and `/teams` pages which follow the exact same CRUD structure.
**Implementation sketch.**
- New route: `src/app/(dashboard)/memory/page.tsx` (the route already appears in the
  `(dashboard)` directory listing — `memory/` — but the page is a stub).
- Read `src/app/(dashboard)/api-keys/` as the template; the data-fetching and table
  patterns are identical.
- Add a sidebar nav entry under a "Workspace" group between Prompts and Models.
- Backend: no changes needed — all endpoints are live.
**Effort.** 4–5 hours. Risk: none — purely additive UI over existing API.
**First step.** Read the existing `memory/page.tsx` to confirm it's a stub, then scaffold
the data-fetching hook.

---

### 5. Prompt compression pre-call hook

**Category:** performance
**Impact 4 · Novelty 4 · Effort 3 · Fit 4**

**The idea.** A pre-call hook that compresses the user message(s) in any request where the
total input token count exceeds a configurable threshold (e.g. 2 000 tokens). Uses
`llmlingua` (LLMLingua-2 or `llmlingua.PromptCompressor`) to extractively compress the
prompt. Studies report −31% input / −74% output tokens on coding tasks. For a 35B
quantized model where context length is precious and TTFT scales linearly with input
tokens, this is a free latency improvement. The hook is transparent to callers — they see
the same response; the compressed prompt is logged internally.
**Inspired by.** [awesome-llm-token-optimization](https://github.com/pleasedodisturb/awesome-llm-token-optimization);
LLMLingua-2 paper; the existing `llamacpp_hook.py` pattern of pre-call transformation.
**Implementation sketch.**
```python
# litellm/proxy/hooks/prompt_compressor.py
from llmlingua import PromptCompressor
from litellm.integrations.custom_logger import CustomLogger

_compressor = PromptCompressor("microsoft/llmlingua-2-xlm-roberta-large-meetingbank")

class PromptCompressionHook(CustomLogger):
    def __init__(self, token_threshold: int = 2000, ratio: float = 0.7):
        self.token_threshold = token_threshold
        self.ratio = ratio

    async def async_pre_call_hook(self, kwargs, **kw):
        messages = kwargs.get("messages", [])
        total = sum(len(m.get("content", "").split()) * 1.3 for m in messages)
        if total < self.token_threshold:
            return None
        user_msgs = [m for m in messages if m.get("role") == "user"]
        if not user_msgs:
            return None
        compressed = _compressor.compress_prompt(
            [m["content"] for m in user_msgs],
            rate=self.ratio,
        )
        for m, c in zip(user_msgs, compressed["compressed_prompt"].split("\n---\n")):
            m["content"] = c
        return kwargs
```
Register as a callback. Add `pip install llmlingua` to the venv.
**Effort.** 4–6 hours (including model download ~500 MB). Risk: LLMLingua-2 is a separate
model that runs on CPU — adds ~200–400 ms on first compression call; subsequent calls are
fast (model stays loaded). Disable for short prompts via threshold.
**First step.** `pip install llmlingua` and run a single compression test before wiring
into the hook.

---

### 6. Playground with auto-history and diff

**Category:** DX / wow
**Impact 4 · Novelty 4 · Effort 3 · Fit 5**

**The idea.** Every run in the playground is already a spend-log entry, but there is no way
to compare this run to the previous one. Add auto-logging of playground runs into a
session-local history (localStorage or the existing `/v1/memory` endpoint per user), and
a "Diff vs. previous" toggle that renders the old and new responses side-by-side with
token count and latency deltas. This makes iterative prompt work — the actual daily use
case of the playground — dramatically faster. The Braintrust pattern.
**Inspired by.** Braintrust "playground with history"; Langfuse's prompt diff view.
**Implementation sketch.**
- In `src/app/(dashboard)/playground/`, add a `usePlaygroundHistory` hook that writes
  each completion (model, messages, response, token count, latency) to localStorage under
  a `playground_history` key, keeping the last 50 runs.
- Add a collapsible "History" drawer on the right side of the playground that lists recent
  runs with model + token count + date.
- Clicking a history entry loads it into the editor; a "Diff" button activates a split
  view using the existing `react-diff-viewer` or a simple character-diff over the response
  text (the library already handles markdown rendering).
- No backend changes required — purely client-side.
**Effort.** 6–8 hours. Risk: none — additive, client-side only.
**First step.** Write the `usePlaygroundHistory` hook and verify localStorage round-trips
cleanly.

---

### 7. Cache analytics panel

**Category:** ops / visibility
**Impact 3 · Novelty 3 · Effort 4 · Fit 5**

**The idea.** The proxy has Redis caching and spend logs, but the UI has no cache hit/miss
visibility at all. Add a tab on the existing `/caching` page (which is a stub today)
showing: cache hit rate over time, estimated tokens saved, estimated compute time saved,
and a breakdown by model. Data source: the spend logs table already records `cache_hit`
boolean per request.
**Inspired by.** The existing `/caching` route (`src/app/(dashboard)/caching/`) which
renders a cache health widget but no analytics; Helicone's real-time cost counter.
**Implementation sketch.**
- Add a new spend-log aggregate endpoint `GET /spend/cache_stats` that returns
  `{hit_count, miss_count, tokens_saved, period}` — one SQL query on the existing
  `LiteLLM_SpendLogs` table grouped by `cache_hit`.
- Build `CacheAnalyticsPanel.tsx` with a Recharts `AreaChart` for hit rate over time and
  stat tiles for tokens saved and time period.
- Mount it in `src/app/(dashboard)/caching/page.tsx` alongside the existing health widget.
**Effort.** 5–6 hours. Risk: none.
**First step.** Query the spend logs table directly to verify `cache_hit` is populated.

---

### 8. Request replay from logs

**Category:** DX
**Impact 4 · Novelty 3 · Effort 4 · Fit 5**

**The idea.** Add a "Replay" button to each row in the spend logs table. Clicking it opens
the playground pre-populated with the exact model, messages, and parameters from that
request. This collapses the loop between "something went wrong" and "reproduce and fix" to
a single click. Particularly useful for debugging guardrail blocks, prompt injection false
positives, and unexpected model outputs — all of which currently require manually
reconstructing the request.
**Inspired by.** `store_prompts_in_spend_logs: true` already stores the full prompt in the
DB; the playground already accepts pre-populated model/messages via URL params (or could).
**Implementation sketch.**
- In `src/components/view_logs` (the spend logs table), add an action column with a
  "Replay in Playground" button.
- Serialize the request as a URL-safe base64 blob: `{model, messages, parameters}`, then
  push `router.push(\`/ui/playground?replay=<blob>\`)`.
- In the playground's `ChatUI`, on mount, check for `?replay=`, decode it, and
  pre-populate the model selector and message composer.
- No backend changes needed — all data is already in the spend log row.
**Effort.** 4–5 hours. Risk: very long prompts may exceed URL length limits — fall back to
sessionStorage keyed by a UUID if the serialized blob exceeds 2 KB.
**First step.** Check that `store_prompts_in_spend_logs: true` actually populates the
`messages` field in the DB.

---

### 9. Runtime branding layer via `theme.json`

**Category:** identity / UX
**Impact 3 · Novelty 2 · Effort 4 · Fit 5**

**The idea.** Replace every hardcoded "LiteLLM" string, logo path, and the generic
gray-blue color palette with values loaded from a single `theme.json` file served at
`/ui/theme.json`. The Next.js app fetches it on mount and applies CSS custom property
overrides. No rebuild required to rebrand. This makes the fork feel like a product rather
than a vendored dependency.
**Inspired by.** The existing `LITELLM_UI_PATH` override mechanism — a small file outside
the bundle is the right place to put site identity; the Portkey pattern of per-instance
branded gateways.
**Implementation sketch.**
```json
{
  "name": "Studio Gateway",
  "primary": "oklch(0.55 0.2 280)",
  "sidebar": "oklch(0.10 0.03 280)",
  "logoUrl": "/ui/logo.svg"
}
```
In `src/contexts/ThemeContext.tsx`, fetch `/ui/theme.json` and call
`document.documentElement.style.setProperty("--primary", theme.primary)` etc. on mount.
Serve the file by placing it in the `out/` directory (it persists across rebuilds since
`out/` is managed separately).
**Effort.** 4 hours. Risk: some colors are duplicated across Tremor compat classes — test
both light and dark themes.
**First step.** Write the `ThemeContext` fetch and manually test with a single override
(`--primary`) before wiring up the full token set.

---

## Killed ideas (and why)

- **Split `proxy_server.py` into microservices** — it's 16 000 lines but it works; breaking it is a multi-week rewrite that risks the running system for no user-visible gain at this scale.
- **Add OAuth/SSO** — already implemented via `litellm_enterprise/sso/`; removing the enterprise gate (done) is sufficient.
- **Port to Rust for performance** — the bottleneck is llama.cpp inference, not the Python gateway layer. Switching languages would not move any metric the user cares about.
- **Add LLM-as-judge eval pipeline** — real benefit, but requires a second model or an API key; this system has exactly one model and no external API dependencies by design.
- **Add a second llama.cpp node for failover** — premature. One node is the current design; Olla's routing model is worth studying when a second GPU is added.

## Suggested order of attack

**Start with #3 (llamacpp_hook → plugin):** it is a pre-requisite for cleanly adding #1
and #5 (both hooks live in the same `hooks/` tree) and costs only 3 hours. **Then #1
(semantic cache):** the biggest impact-per-hour improvement — repeated queries are free
after this. **Then #4 (Memory UI):** surfaces a finished feature at zero backend cost.
Build #2 (OTLP tracing) after the cache is stable; tracing benefits from having a working
cache so you can observe hit vs. miss latency deltas side-by-side. #6 and #8 (playground
history + replay) can be built in parallel since they're purely frontend.
