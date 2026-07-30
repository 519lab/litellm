# Innovation #8: Request Replay from Spend Logs

## What it does

Adds a replay button to every chat-completion row in the spend logs table. Clicking it loads the
original model and messages into the Playground with one click, so you can inspect, tweak, and
re-run any past request without copy-pasting.

## How to try it

1. Start the proxy and the UI dev server:

```
cd /home/ggrace/litellm-fork
python litellm/proxy/proxy_cli.py --config litellm/proxy/dev_config.yaml --detailed_debug 2>&1 | tee litellm.log
```

```
cd ui/litellm-dashboard && npm run dev
```

2. Make a few chat requests through the proxy (any model).

3. Open http://localhost:3000/logs and find a chat completion row (call_type = completion or acompletion).

4. Click the play button (triangle icon) in the rightmost column of that row.

5. The browser navigates to the Playground. The original model is pre-selected in the model
   dropdown, the original messages are loaded in the chat thread, and a blue banner at the top
   names the request being replayed. Dismiss the banner with the X.

6. Edit the messages or switch models, then send to compare results.

## Implementation notes

- Replay payload (model + messages + request_id) is stored in `sessionStorage["playground_replay"]`
  for the single page-load handoff. It is removed immediately on arrival so a hard refresh starts
  clean.
- Chat messages are also written to `sessionStorage["chatHistory"]` (the key `useChatHistory` reads
  on mount) so the existing persistence mechanism picks them up with no hook changes.
- The Replay column only renders for `completion` and `acompletion` call types; agent, MCP, and
  embedding rows do not show it.
- `ChatUI` gained a single optional `initialModel` prop used to pre-select the model from the replay
  payload. No other behavior is affected.
