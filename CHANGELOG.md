# Changelog

Changes to this fork (`ggrace519/litellm`) on top of upstream LiteLLM. Entries accumulate
under Unreleased on `develop` and move under a dated version heading when `develop` is
promoted to `main` and tagged.

## [Unreleased]

### Added

- Context-window overflows now reach agent clients in the shape they recover from. Claude Code gets Anthropic's `prompt is too long: N tokens > M maximum` error and compacts and continues the session instead of exiting, and streaming Codex requests get `response.failed` with `context_length_exceeded` instead of an opaque invalid-request error. Applies to every model behind the proxy (#9).

### Changed

- The dashboard toolchain now targets Node 22 (CI workflows, `.nvmrc`, `engines` and `@types/node` 22), which vitest 5 requires. Building the dashboard locally needs Node 22.12 or later (#29).

### Fixed

- A database model row with a null `model_info` crashed the proxy's model loading with `TypeError: 'NoneType' object does not support item assignment`, including the premium-only audit field copy that this fork always runs because the license gate is stripped. It is now treated as an empty `model_info`
- With `SPEND_LOG_QUEUE_POLL_INTERVAL=0` the spend log queue monitor never backed off (0 times 1.5 stays 0), so a failing database or lock made it spin in a tight loop logging a traceback on every pass. The poll interval now has a 0.1 second floor. The unit test for that loop had stopped exercising it after the monitor moved from `asyncio.sleep` to an event wait, and it ran away to roughly 25 GB of captured log output during a full proxy test run
- Responses API ids were only ownership-checked when they arrived in the proxy's encrypted form, so a raw id let another key retrieve, delete, list input items of, or continue someone else's conversation, including the bridged conversations kept in Redis. Non-admin keys addressing an id the proxy did not issue now get 403 unless `general_settings.allow_unmanaged_response_ids` is set, and streamed events no longer expose the raw id (413be2d005)
- Unclassified 5xx errors returned their raw exception text and a traceback to the client, exposing file paths, private hostnames and IPs and embedded credentials. Client-facing messages are now redacted while server logs keep full detail, and the proxy no longer sends a `Server` header (#18)
- Logging out of the Admin UI only cleared cookies, so the session key stayed valid until it expired. `POST /session/logout` now revokes it and the dashboard calls it on sign out and worker switch, and a password reset revokes the user's other UI sessions (#18)
- With `turn_off_message_logging` on, callbacks still received the prompt in the nested proxy request body and Anthropic thinking text in provider-specific fields, and `turn_off_message_logging`, `json_logs` and `log_raw_request_response` set in config.yaml were ignored by the raw request logging because they were read at import. JSON log lines also leaked dict and set extras and quoted AWS credentials (#19)
- The spend log request/response view now re-checks ownership after a custom logger returns a payload (#19)
- `/v1/messages/count_tokens` under-counted agent conversations on OpenAI-compatible deployments, including the llama.cpp Qwen deployment, because it dropped tool definitions and tool_use / tool_result turns. A Claude Code request was reported as 2928 tokens instead of 4463, and a short tool conversation as 526 instead of 4981. Counts now match the backend exactly (#1).
- The Anthropic guardrail round trip rewrote hosted Anthropic tools (code_execution, web_fetch, memory, tool_search) into custom tools the Anthropic API rejects. Bridged requests to llama.cpp and OpenAI keep wrapping those tools as functions, which those backends need (#2).
- `/v1/messages` responses bridged through the Responses API (every `openai/` deployment, including llama.cpp) dropped prompt-cache hits, reporting cached tokens as fresh input and never setting `cache_read_input_tokens`. Claude Code's context meter and cache stats were wrong as a result (#3).
- The OTLP tracing hook never produced a span: its documented `make_hook` config path failed every non-streaming chat request with a 400, loading it as an instance failed every request with a 500, and its llama.cpp metrics read response headers llama.cpp never sends. Spans now carry llama.cpp's real prompt/decode rates, prompt-cache reuse and draft acceptance. Configs must reference `litellm.proxy.hooks.otlp_tracer.proxy_handler_instance` (#4).

### Docs

- INNOVATIONS.md gains a round-2 section of ranked proposals built from measurements against a real llama.cpp, with round-1 ship status. CLAUDE.md now documents lint and the git identity setup for plain GitHub clones. DEMO.md has verification steps for the tracer and the overflow handling.
