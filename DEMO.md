# Innovation branch demos

Each section covers one feature branch merged into this fork.

---

## memory-ui — promote Memory as a first-class feature

Removes the upstream deprecation warning from the Memory dashboard page. The full
Memory UI (`MemoryView`) was already implemented; the only thing hiding it was a
banner saying it might be removed. In this fork Memory is a supported feature.

What works: `/ui/memory` shows a searchable, paginated table of all `/v1/memory`
entries; create, edit, and delete work via the modal and delete-confirmation dialog;
the detail drawer shows full value + metadata + timestamps; admins see all entries
with user/team columns, users see only their own scope.

To try it: after installing the fork and running `npm run build`, navigate to
`/ui/?page=memory` (or click Memory in the Agents sidebar group) and create an
entry with "New memory".

Next: the value/metadata display in the detail drawer uses hardcoded `#fafafa`
background that doesn't respect dark mode; the next increment is converting those
inline styles to `bg-muted` Tailwind classes.

---

## llamacpp-plugin — package llamacpp hook as a versioned module

Moves `llamacpp_hook.py` from `$HOME/.config/litellm/llamacpp_hook.py` (outside
the repo) into `litellm/proxy/hooks/llamacpp/` as a first-class module. The hook
logic is identical; only the location and import path change.

What works: `LlamaCppPatternStripper` is importable as
`litellm.proxy.hooks.llamacpp.proxy_handler_instance`; all five known llama.cpp
grammar failure modes covered by tests.

To cut over: in `$HOME/.config/litellm/config.yaml`, change:

    callbacks:
      - llamacpp_hook.proxy_handler_instance

to:

    callbacks:
      - litellm.proxy.hooks.llamacpp.proxy_handler_instance

Then install the fork (`pip install -e /path/to/litellm-fork`), restart the proxy,
and delete `$HOME/.config/litellm/llamacpp_hook.py`.

`LLAMACPP_API_BASE` is already read from the environment (default
`http://127.0.0.1:56669`).

---

## otlp-tracing — OTLP span tracing with llama.cpp decode and prompt-cache metrics

Adds `litellm/proxy/hooks/otlp_tracer.py`, a `CustomLogger` hook that emits an
OpenTelemetry span per LLM call with `llm.model`, token counts,
`llm.cached_prompt_tokens`, `llm.ttft_ms`, decode-window `llm.tpot_ms` / `llm.tps`,
`cache.hit` and `error`. For non-streaming llama.cpp responses it also records
`llamacpp.prompt_tps`, `llamacpp.decode_tps`, `llamacpp.tpot_ms`, `llamacpp.cache_n`
and, when speculative decoding ran, `llamacpp.speculative_acceptance_rate`, all read
from the `timings` object llama-server puts in the response body. llama-server sends
no performance headers, and streamed responses keep only the usage fields, so for
streams the decode speed comes from the proxy's own first-token and end timestamps.

Fixed in #4: the first version read invented `x-llamacpp-*` headers, was registered
through a `make_hook` factory the config loader never calls (every non-streaming
chat completion then failed with a 400), and misnamed the `cache` pre-call argument
(every request failed with a 500 once the hook loaded). It had never produced a span.

To enable: set `OTLP_ENDPOINT=http://localhost:4317` (or your collector address)
and add to `config.yaml`:

    callbacks:
      - litellm.proxy.hooks.otlp_tracer.proxy_handler_instance

The exporter is built on the first traced request, so importing the module opens
no connection.

To verify locally: `docker run -d --rm -p 4317:4317 -p 16686:16686
jaegertracing/all-in-one:1.62.0`, send one streaming and one non-streaming chat
completion through the proxy, then `curl -s
"localhost:16686/api/traces?service=litellm-proxy&limit=10"`.

---

## semantic-cache — valkey semantic cache with local embedding server

Adds a local embedding server (`litellm/proxy/hooks/local_embeddings_server.py`)
serving `POST /v1/embeddings` using `all-MiniLM-L6-v2` on port 8890, a Compose
file (`deployment/valkey-compose-with-search.yaml`) using the `valkey-search` image
that loads the search module, and a config example
(`config_examples/semantic-cache.yaml`).

What works: the embedding server is a standalone FastAPI app that can be run
separately; the compose file brings up valkey with the search module loaded; the
config snippet wires everything to LiteLLM's `valkey-semantic` cache type.

To try it: bring up valkey-search with
`docker compose -f deployment/valkey-compose-with-search.yaml up -d`, start the
embedding server with `uvicorn litellm.proxy.hooks.local_embeddings_server:app
--port 8890`, and merge the `config_examples/semantic-cache.yaml` snippet into
your main config.

---

## playground-history — persistent playground run history

Adds persistent playground run history backed by localStorage (max 50 entries):
`usePlaygroundHistory` hook, `PlaygroundHistoryPanel` (collapsible right-side
panel), `SaveRunDialog`, and `RunDetailDialog`. No ChatUI modification.

What works: saving a run with a custom label, browsing/searching history,
re-loading a past run into the playground, deleting entries.

To try it: open the Playground page; after a successful chat, click "Save run" in
the history panel on the right side of the screen.

---

## request-replay — replay spend-log requests in the Playground

Adds a Replay button to the spend logs table. Clicking it serializes the model and
messages from the log entry into sessionStorage, navigates to the Playground, and
pre-fills the chat — the `initialMessages` prop is written before navigation so it
is available when ChatUI mounts (avoiding the sessionStorage/useEffect timing race).

What works: completion and acompletion log rows show a play icon; clicking it
pre-fills the Playground with the exact model and message history; a dismissible
banner confirms the replay source.

To try it: go to `/ui/?page=logs`, find a completion row, click the play icon on
the right side of the row.
