# Demo — innovation/llamacpp-plugin

## What this branch does

Moves `llamacpp_hook.py` from `$HOME/.config/litellm/llamacpp_hook.py` (a
filesystem path outside the repo) into `litellm/proxy/hooks/llamacpp/` as a first-class
module. The hook logic is identical; only the location and import path change.

## What works

- `LlamaCppPatternStripper` is importable as
  `litellm.proxy.hooks.llamacpp.proxy_handler_instance`
- All five known llama.cpp grammar failure modes covered by 10 passing unit tests
- Drop-in replacement — behaviour is exactly the same

## To cut over

1. In `$HOME/.config/litellm/config.yaml`, change:
   ```yaml
   callbacks:
     - llamacpp_hook.proxy_handler_instance
   ```
   to:
   ```yaml
   callbacks:
     - litellm.proxy.hooks.llamacpp.proxy_handler_instance
   ```
2. Install the fork in editable mode (once you're ready to cut over from pip):
   ```bash
   pip install -e /path/to/litellm-fork
   sudo systemctl restart litellm
   ```
3. Delete `$HOME/.config/litellm/llamacpp_hook.py`.

## What's stubbed / next

Nothing stubbed. `LLAMACPP_API_BASE` is already read from the environment (with
`http://127.0.0.1:56669` as the default), so the hook works on any deployment without
modification.
