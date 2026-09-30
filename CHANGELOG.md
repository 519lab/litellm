# Changelog

Changes to this fork (`ggrace519/litellm`) on top of upstream LiteLLM. Entries accumulate
under Unreleased on `develop` and move under a dated version heading when `develop` is
promoted to `main` and tagged.

## [Unreleased]

### Added

- Context-window overflows now reach agent clients in the shape they recover from. Claude Code gets Anthropic's `prompt is too long: N tokens > M maximum` error and compacts and continues the session instead of exiting, and streaming Codex requests get `response.failed` with `context_length_exceeded` instead of an opaque invalid-request error. Applies to every model behind the proxy (branch `litellm_compaction_native_overflow`).

### Fixed

- `/v1/messages/count_tokens` under-counted agent conversations on OpenAI-compatible deployments, including the llama.cpp Qwen deployment, because it dropped tool definitions and tool_use / tool_result turns. A Claude Code request was reported as 2928 tokens instead of 4463, and a short tool conversation as 526 instead of 4981. Counts now match the backend exactly (#1).
- The Anthropic guardrail round trip rewrote hosted Anthropic tools (code_execution, web_fetch, memory, tool_search) into custom tools the Anthropic API rejects. Bridged requests to llama.cpp and OpenAI keep wrapping those tools as functions, which those backends need (#2).
- `/v1/messages` responses bridged through the Responses API (every `openai/` deployment, including llama.cpp) dropped prompt-cache hits, reporting cached tokens as fresh input and never setting `cache_read_input_tokens`. Claude Code's context meter and cache stats were wrong as a result (#3).
- The OTLP tracing hook never produced a span: its documented `make_hook` config path failed every non-streaming chat request with a 400, loading it as an instance failed every request with a 500, and its llama.cpp metrics read response headers llama.cpp never sends. Spans now carry llama.cpp's real prompt/decode rates, prompt-cache reuse and draft acceptance. Configs must reference `litellm.proxy.hooks.otlp_tracer.proxy_handler_instance` (#4).

### Docs

- INNOVATIONS.md gains a round-2 section of ranked proposals built from measurements against a real llama.cpp, with round-1 ship status. CLAUDE.md now documents lint and the git identity setup for plain GitHub clones. DEMO.md has verification steps for the tracer and the overflow handling.
