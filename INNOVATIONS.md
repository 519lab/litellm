# Innovation Proposals — litellm-fork (round 2)
*Generated 2026-09-29 · based on commit 2fca54f · round 1 (2026-07-29) is kept below with ship status*

## How this codebase stands today

A LiteLLM fork that fronts one self-hosted llama.cpp server running Qwen3.6-35B-A3B. The traffic that matters is agentic: Claude Code on
`/v1/messages`, Codex CLI on `/v1/responses`, opencode and n8n on `/v1/chat/completions`. The
fork has a strong record of surgical protocol fixes on those bridges (about 40 since July), a
clean dashboard rebuild, and a Prometheus scrape feeding a Grafana dashboard. Where it is
ordinary, and in places broken, is the seam between the gateway and llama.cpp itself.
Verified this session against llama.cpp b11243 through a live dev proxy:
`/v1/messages/count_tokens` under-counted real agent conversations by up to 89% (526 vs 4981
tokens). The Responses bridge dropped every prompt-cache hit from Anthropic usage. The round-1
OTLP tracer had never produced a span. Context overflows reached Claude Code and Codex in a
shape neither client recovers from. The llamacpp hook strips `pattern` and `minimum`
constraints that current llama.cpp enforces, and it never fires on the Responses or Messages
routes at all. The round-1 features were built from assumptions about llama.cpp (performance
headers, grammar failures) that its source code and a real server contradict. Round 2
starts from measurements instead

## What the best in this space are doing

**Agent clients recover only from native error shapes.** Claude Code compacts and retries
only on Anthropic's `prompt is too long` wording. Its gateway guide names reworded errors
such as `ContextWindowExceededError` as unrecognized
([llm-gateway-connect](https://code.claude.com/docs/en/llm-gateway-connect),
[#57296](https://github.com/anthropics/claude-code/issues/57296)). Codex maps only a streamed
`response.failed` with `context_length_exceeded` to `ContextWindowExceeded`
(`codex-rs/codex-api/src/sse/responses_error.rs`, read this session). A synchronous 400 makes it
resend the same request ([openai/codex#48870](https://github.com/openai/codex/issues/48870),
filed 2026-09-28)

**Prefix reuse dominates agent latency.** llm-d's precise prefix-cache-aware scheduler reports
0.54 s P90 TTFT against 92 s cache-blind
([llm-d blog](https://llm-d.ai/blog/kvcache-wins-you-can-see)). The Gateway API Inference
Extension and vLLM production-stack both route on prefix affinity
([GIE](https://gateway-api-inference-extension.sigs.k8s.io/),
[vLLM prefix-aware routing](https://docs.vllm.ai/projects/production-stack/en/latest/use_cases/prefix-aware-routing.html)).
Manus reports about 100:1 input to output tokens for agents
([Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)).
Qwen3.5 and 3.6 are hybrid Gated-DeltaNet models: when the prompt prefix changes before a
context checkpoint, llama.cpp re-processes the whole prompt
([#20003](https://github.com/ggml-org/llama.cpp/issues/20003),
[#21831](https://github.com/ggml-org/llama.cpp/issues/21831)). Anything that perturbs the
prefix costs a full re-prefill

**Healing instead of failing.** OpenRouter's Response Healing lifted Qwen3 235B from 88.02% to
99.98% valid JSON
([OpenRouter](https://openrouter.ai/blog/announcements/response-healing-reduce-json-defects-by-80percent/)).
llama.cpp still has open Qwen tool-call leaks into `content` (#26987, #20837), and a stream-abort
bug hit about 1 in 128 requests before PR #24839
([#24807](https://github.com/ggml-org/llama.cpp/issues/24807)).
[json-repair](https://github.com/mangiucugna/json_repair) 0.63.5 now does schema-guided repair

**Evaluate with your own traffic.** TensorZero runs adaptive A/B tests in the gateway
([TensorZero](https://www.tensorzero.com/blog/bandits-in-your-llm-gateway/)). Upstream
LiteLLM has `silent_model` mirroring
([traffic mirroring](https://docs.litellm.ai/docs/traffic_mirroring)), but only on chat
completions; PR #40701 for Responses and Messages is still open. Qwen3.8-27B (open weights,
with an MTP head supported by llama.cpp `--spec-type draft-mtp`) is the obvious upgrade
candidate for this rig

Full notes: `~/.claude/research/llamacpp-server-gateway-integration.md` and
`~/.claude/research/ai-gateway-state-of-the-art-2026.md`

## Defects found and fixed this round

These are fixes, not innovations. Each has a tracking issue and its own branch.

| Issue | Defect | Branch | Proof |
|---|---|---|---|
| [#1](https://github.com/519lab/litellm/issues/1) | `/v1/messages/count_tokens` drops Anthropic tools, `tool_use` and `tool_result` for `openai/` deployments | `litellm_count_tokens_anthropic_tools` | 2928→4463 and 526→4981, both now equal to llama.cpp's own count |
| [#2](https://github.com/519lab/litellm/issues/2) | The guardrail round trip to an Anthropic backend re-wrapped hosted tools (code_execution, web_fetch, memory, tool_search) as custom tools; the bridge's narrow native set is correct for llama.cpp and OpenAI and is kept, while the guardrail now injects the full hosted set | `litellm_anthropic_native_tool_regression` | guardrail round-trip test red on develop, green on branch; bridge still wraps those tools for non-Anthropic backends |
| [#3](https://github.com/519lab/litellm/issues/3) | Responses bridge drops `cached_tokens` from `/v1/messages` usage | `litellm_responses_bridge_cached_tokens` | `{input_tokens: 23}` → `{input_tokens: 1, cache_read_input_tokens: 22}` |
| [#4](https://github.com/519lab/litellm/issues/4) | OTLP tracer: phantom headers, `make_hook` breaks every non-stream request with a 400, `cache_obj` kwarg makes every request fail with a 500 | `litellm_otlp_tracer_real_llamacpp_metrics` | spans with real `timings` in Jaeger |

Upstream, not ours: llama.cpp's `/v1/responses` reports `status: completed` when generation
stops at `max_output_tokens`, so the default `openai/` route returns `stop_reason: end_turn`
for truncated turns. Its native `/v1/messages` gets `max_tokens` right. Proposal 3 routes
around it. A llama.cpp issue is worth filing (draft below, not filed)

## Proposals (ranked)

### 1. Surface context overflow in the shape each agent client compacts on
**Category:** feature · **Impact 5 · Novelty 5 · Effort 4 · Fit 5** · **Built:** `litellm_compaction_native_overflow`

**The idea.** When llama.cpp rejects a prompt that no longer fits the slot, turn the error into
the exact shape each client recovers from. `/v1/messages` gets Anthropic's 400
`invalid_request_error` `prompt is too long: N tokens > M maximum`. A streaming `/v1/responses`
gets an HTTP 200 stream ending in `response.failed` with `context_length_exceeded`. A local
model then degrades the way a frontier API does, by compacting, instead of killing the session.
**Inspired by.** Claude Code's gateway troubleshooting table, Codex's `responses_error.rs`,
and openai/codex#48870.
**Implementation sketch.** `litellm/proxy/common_utils/context_overflow.py` detects overflow
when the error is a `ContextWindowExceededError` or a 400 whose text carries prompt and
window token counts (llama.cpp, OpenAI or Anthropic wording), extracts N and M, and renders
the per-surface payload. Review showed the looser substring list would rewrite unrelated
errors, such as oversized-string parameters or guardrail messages, into compaction triggers. It is wired into the generic exception paths of
`anthropic_endpoints/endpoints.py` and `response_api_endpoints/endpoints.py` after the
failure hooks run, so logging and spend tracking are unchanged.
**Effort.** Built in about half a day. Main risk: Claude Code's matcher is not published, so the
body copies the canonical API response verbatim.
**Result.** A/B with real clients on llama.cpp: a Claude Code session with 28k tokens of
history against a 16k window exited 1 on develop. On the branch it wrote a `compact_boundary`
(trigger `auto`, preTokens 28081), re-sent 2.4k tokens and answered. Codex now reports
`ContextWindowExceeded` instead of an opaque invalid request, but `codex exec` still stops
there rather than compacting, which is why proposal 6 matters for Codex.
**First step.** Merge the branch, then shrink a test slot and run one Claude Code turn against the inference host.

### 2. Stop stripping constraints llama.cpp now enforces
**Category:** performance / correctness · **Impact 4 · Novelty 4 · Effort 5 · Fit 5**

**The idea.** The llamacpp hook deletes `pattern`, `minimum`, `maximum`, `exclusive*` and
`multipleOf`, and clamps `maxLength`, because older llama.cpp builds returned 400 on them. On
b11243 none of these fail, and the grammar enforces them. Asked for quantity 2 and zip 90210
under `minimum: 5` and `pattern: ^Z[0-9]{3}$`, the model returned `{"zip":"Z902","qty":5}`
three times out of three. Stripping now removes guarantees that clients asked for. The hook
also only reads chat-completions tool shapes, so it never runs on the Responses (`tools[].parameters`
flat) or Messages (`input_schema`) routes, which carry most of the agent traffic.
**Inspired by.** Original, from a direct probe of b11243 in this session.
**Implementation sketch.** Replace the static strip with a capability probe. On first use per
`api_base`, send one `max_tokens: 1` request whose `response_format` carries each keyword. Cache
which keywords are accepted, and strip only those that fail. When nothing needs stripping the hook
is a no-op. Extend `_sanitize_schema` dispatch to the flat Responses tool shape and `input_schema`.
If the live build already passes every probe, delete the hook outright; that is simpler still.
**Effort.** 3 to 4 hours. Risk: the probe adds one tiny request per process start.
**First step.** Run `curl -s 127.0.0.1:56669/props | jq .build_info` on the inference host. If the
build is at or near b11243, delete the hook.

### 3. Serve Claude Code through llama.cpp's native Anthropic endpoint
**Category:** architecture · **Impact 4 · Novelty 3 · Effort 5 · Fit 5**

**The idea.** llama-server implements `/v1/messages` natively, including
`cache_read_input_tokens` and a correct `stop_reason: max_tokens`. The fork already has the
opt-in (`model_info.supported_endpoints: ["/v1/messages"]`), but the live deployment goes through
the Responses bridge. That bridge inherits llama.cpp's truncation-status bug and translates every
request twice. Turning on native pass-through for the llama.cpp deployment removes a whole class
of bridge bugs for Claude Code traffic.
**Inspired by.** llama.cpp `tools/server` source and a side-by-side run this session: native
`/v1/messages` returned `max_tokens` where the bridge returned `end_turn`.
**Implementation sketch.** Config only: add `supported_endpoints: ["/v1/messages",
"/v1/chat/completions", "/v1/responses"]` to the Qwen deployment's `model_info`. A count_tokens
forwarder was considered and dropped: after fix #1 the default path already matches llama.cpp's
own count exactly (4463 and 4981).
**Effort.** 1 hour including a replay. Risk: native `/v1/messages` bypasses the fork's bridge
fixes (thinking blocks, tool_result shapes), so replay a recorded Claude Code session first.
**First step.** Add the opt-in to the dev config and replay one Claude Code session end to end.

### 4. Prefix-cache hit ratio per key and session on the existing dashboard
**Category:** ops · **Impact 3 · Novelty 3 · Effort 5 · Fit 5**

**The idea.** Prompt-cache reuse is the single biggest latency lever for agent traffic on a
hybrid model, and nobody is looking at it. `litellm_input_cached_tokens_metric` and
`litellm_input_tokens_metric` are already scraped, so a Grafana panel showing
`rate(cached)/rate(input)` by `api_key_alias` and `requested_model` turns it into a number. With
the fixed tracer, per-request `llm.cached_prompt_tokens` and `llamacpp.cache_n` exist too.
**Inspired by.** llm-d's cache-hit dashboards and the Manus KV-cache guidance.
**Implementation sketch.** One panel in the `litellm-proxy` dashboard (uid `litellm-proxy`) plus
the DR snapshot in the monitoring role. No proxy code.
**Effort.** 30 minutes. Risk: none.
**First step.** Add the PromQL panel on logbox and look at a week of data before building proposal 5.

### 5. Session-to-slot affinity with llama.cpp `id_slot`
**Category:** performance · **Impact 5 · Novelty 5 · Effort 2 · Fit 4**

**The idea.** llama-server picks a slot by longest common prefix, then least recently used.
When concurrent agent sessions (Claude Code main thread, its sub-agents, Codex, n8n) outnumber
slots, a session's KV state gets evicted. On Qwen3.6 that means a full re-prefill of 30k to 60k
tokens. The gateway knows the session (`x-claude-code-session-id`, Codex `session_id`,
`previous_response_id`); llama.cpp accepts `id_slot`. Map sessions to slots, and pin only when
the target slot is idle (`GET /slots`) so pinning never causes head-of-line blocking.
**Inspired by.** llm-d precise prefix-cache-aware scheduling and vLLM production-stack session
affinity, scaled down from pods to slots. Nothing in LiteLLM targets `id_slot` (its
`DeploymentAffinityCheck` picks between deployments).
**Implementation sketch.** A `CustomLogger` pre-call deployment hook in
`litellm/proxy/hooks/llamacpp/` keeps a small LRU `session -> slot` map sized to `total_slots`
from `/props`. It reads `/slots` (cached for about 200 ms) to check idleness and injects
`id_slot` through `extra_body`. Measure with proposal 4's hit ratio before and after.
**Effort.** 2 to 3 days including measurement. Risk: `--cache-ram` (8 GiB by default) already
softens eviction, so the gain may be small; proposal 4 answers that first.
**First step.** Proposal 4. Build this only if the hit ratio sits well below what one-session
reuse would give.

### 6. Advertise the real window to clients
**Category:** DX · **Impact 4 · Novelty 3 · Effort 4 · Fit 5**

**The idea.** Clients compact proactively only if they know the window. Claude Code assumes 200k
for unknown names, and Codex falls back to generic metadata ("Model metadata for `qwen-local`
not found"). Auto-discover `n_ctx` per slot from llama.cpp `/props`, put it in the deployment's
`model_info` (so `/model/info`, `/v1/models` and LiteLLM's own pre-call context checks use it),
and publish a generated snippet per client: `CLAUDE_CODE_MAX_CONTEXT_TOKENS` and
`CLAUDE_CODE_AUTO_COMPACT_WINDOW`, Codex `model_context_window` and
`model_auto_compact_token_limit`, and the opencode `limit` block.
**Inspired by.** opencode's `.well-known/opencode` remote config and the Claude Code and Codex
config references.
**Implementation sketch.** A startup task beside the llamacpp hook fetches `/props` for each
llama.cpp `api_base` and merges `max_input_tokens` into the router's model info. A read-only
`GET /llamacpp/client-config` returns the snippets.
**Effort.** 1 day. Risk: slot context changes when the inference host is reconfigured, so refresh on
health checks.
**First step.** Set Codex `model_context_window` by hand on one machine and confirm it
compacts before the overflow that proposal 1 now reports cleanly.

### 7. Response healing for structured output and leaked tool calls
**Category:** feature · **Impact 4 · Novelty 4 · Effort 3 · Fit 4**

**The idea.** On paths where grammar does not apply (tool arguments on Responses and Messages,
`json_object` mode), repair malformed JSON with json-repair and validate it against the schema
the client sent. When a Qwen tool call leaks into `content` or `reasoning_content` as
`<tool_call>` or `<function=...>` text, lift it into a real `tool_calls` entry. Record every
heal as a span attribute and a Prometheus counter, so healing stays visible and never silently
hides model regressions.
**Inspired by.** OpenRouter Response Healing and llama.cpp #26987 and #20837.
**Implementation sketch.** A post-call success hook in `litellm/proxy/hooks/llamacpp/` built on
`json_repair.repair_json(..., schema=...)`. The leaked-call parser reuses llama.cpp's Qwen3-Coder
XML grammar shape. Streaming needs the final-chunk path, so ship non-stream first.
**Effort.** 2 days. Risk: over-healing masks real failures, so heal only on parse failure and
count every heal.
**First step.** Grep a week of spend logs for `<tool_call>` in assistant content to size the problem.

### 8. Shadow-evaluate Qwen3.8-27B on real agent traffic
**Category:** wow · **Impact 4 · Novelty 4 · Effort 2 · Fit 4**

**The idea.** Before swapping the inference host's model, mirror a sample of real Claude Code, Codex and
n8n requests to a candidate llama.cpp (Qwen3.8-27B with MTP on a second, smaller host or a second slot group).
Score the paired outputs on tool-call schema validity, JSON validity, prefill and decode rates
(from the fixed tracer), and whether both picked the same tool. The upgrade decision is then
backed by your own workload instead of benchmarks.
**Inspired by.** LiteLLM `silent_model` mirroring, upstream PR #40701 (Responses and Messages
mirroring, open), and TensorZero adaptive experiments.
**Implementation sketch.** Port the idea of #40701 to the fork's `aresponses` and
`anthropic_messages` router paths, tag mirrored calls with `shadow=true` metadata, and add a small
comparison job over spend logs. The dashboard gets one table.
**Effort.** 3 to 5 days. Risk: the candidate competes for GPU memory if colocated, so run it on
separate hardware.
**First step.** Stand up Qwen3.8-27B on the smaller host and point a single n8n workflow at it through a
second deployment.

## Killed ideas (and why)

- **Prompt compression (round-1 #5).** Any rewrite of the prefix forces a full re-prefill on
  hybrid Qwen models, and llama.cpp's 8 GiB prompt cache already makes repeated prefixes nearly
  free. Kong's LLMLingua plugin optimizes per-token API billing, which this rig does not have.
- **More semantic caching.** Agent turns almost never repeat, and the gateway-side KV prompt
  cache (proposal 4) is the cache that matters.
- **KV-aware multi-endpoint routing (llm-d / GIE style).** There is one server. Proposal 5 is the
  single-server version.
- **Gateway priority admission control.** Plausible for n8n batches competing with interactive
  agents, but not provable without contention data. Revisit after proposal 4.
- **Runtime branding (round-1 #9).** Cosmetic, and the dashboard rebuild already happened.
- **Cache analytics panel (round-1 #7).** Superseded by proposal 4, because semantic cache is
  not the relevant cache.

## Suggested order of attack

Merge the four defect branches and proposal 1 first; they are independent of each other and
each is proven against a real llama.cpp. Then do the two cheap checks that gate everything else:
the inference host's llama.cpp build version (proposal 2) and the cache-hit panel (proposal 4). Proposal 3 and
proposal 6 are the next highest value per hour. Proposal 5 only if proposal 4 shows eviction.
Proposals 7 and 8 are the ambitious pair once the plumbing is honest.

### Draft llama.cpp issue (not filed)

`/v1/responses` reports `status: "completed"` and no `incomplete_details` when generation stops
because `max_output_tokens` was reached. On b11243, a request with `max_output_tokens: 40` and
a prompt asking for 300 words returns `status: completed` with `output_tokens: 40`, while
`/v1/chat/completions` on the same server returns `finish_reason: length` and `/v1/messages`
returns `stop_reason: max_tokens`. The OpenAI spec uses `status: "incomplete"` with
`incomplete_details.reason: "max_output_tokens"`

---

# Round 1: Innovation Proposals — litellm-fork
*Generated 2026-07-29 · based on commit 5ac7ad1*

**Round-1 status as of 2026-09-29.** #1 semantic cache: shipped (embedding server, valkey-search compose, config example). #2 OTLP tracing: shipped but never produced a span; fixed in round 2 (#4). #3 llamacpp plugin: shipped; now over-strips on current llama.cpp (round-2 proposal 2). #4 memory UI: shipped. #5 prompt compression: killed in round 2. #6 playground history: shipped. #7 cache analytics: superseded by round-2 proposal 4. #8 request replay: shipped. #9 branding: not built, killed

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

**The idea.** `llamacpp_hook.py` currently lives in `~/.config/litellm/` and is
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
- Delete the external file from `~/.config/litellm/`.
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
