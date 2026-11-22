#!/usr/bin/env bash
set -euo pipefail

exec "$(dirname "${BASH_SOURCE[0]}")/install.sh" \
  --extras cli \
  --venv "${XDG_DATA_HOME:-$HOME/.local/share}/litellm-cli-venv" \
  "$@"
