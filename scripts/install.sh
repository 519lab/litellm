#!/usr/bin/env bash
set -euo pipefail

UV_VERSION="0.11.7"
PYTHON_VERSION="3.12"
DEFAULT_EXTRAS="proxy,proxy-runtime,extra_proxy,semantic-router"
FORK_URL="${LITELLM_FORK_URL:-https://github.com/519lab/litellm.git}"
UV_DOWNLOAD_BASE="${LITELLM_UV_DOWNLOAD_BASE:-https://github.com/astral-sh/uv/releases/download}"
INSTALL_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/litellm-install"
STABLE_TAG='^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'

usage() {
  cat <<EOF
Usage: install.sh [--ref REF] [--dir PATH] [--venv PATH] [--extras LIST] [--dry-run]

Installs a 519lab/litellm release the way the production image does: a git checkout
of the release plus a virtualenv synced exactly to its uv.lock, with litellm and the
workspace packages installed editable from the checkout. Running it again with a newer
--ref upgrades in place. It never restarts anything; restart services that use the venv.

  --ref REF      release tag (vX.Y.Z), branch or commit to install (default: latest release)
  --dir PATH     git checkout to create or update (default: ~/litellm)
  --venv PATH    virtualenv to sync (default: <dir>/.venv)
  --extras LIST  comma-separated pyproject extras (default: $DEFAULT_EXTRAS)
  --dry-run      print what uv sync would change and stop
EOF
}

say() { printf '==> %s\n' "$*"; }
die() {
  printf 'install.sh: %s\n' "$*" >&2
  exit 1
}

absolute() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s/%s\n' "$PWD" "$1" ;;
  esac
}

parse_args() {
  REF="latest"
  DIR="$HOME/litellm"
  VENV=""
  EXTRAS="$DEFAULT_EXTRAS"
  DRY_RUN=false
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --ref | --dir | --venv | --extras)
        [ "$#" -ge 2 ] && [ -n "$2" ] || die "$1 needs a value (see --help)"
        case "$1" in
          --ref) REF="$2" ;;
          --dir) DIR="$2" ;;
          --venv) VENV="$2" ;;
          --extras) EXTRAS="$2" ;;
        esac
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *) die "unknown argument: $1 (see --help)" ;;
    esac
  done
  DIR="$(absolute "$DIR")"
  VENV="$(absolute "${VENV:-$DIR/.venv}")"
}

latest_release() {
  local tag
  tag="$(git ls-remote --tags --refs "$FORK_URL" 'v*' \
    | sed 's#.*refs/tags/##' \
    | { grep -E "$STABLE_TAG" || true; } \
    | sort -V \
    | tail -n 1)"
  [ -n "$tag" ] || die "no vX.Y.Z release tag found at $FORK_URL"
  printf '%s\n' "$tag"
}

resolve_ref() {
  if [ "$1" = latest ]; then
    latest_release
  else
    printf '%s\n' "$1"
  fi
}

uv_platform() {
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) echo x86_64-unknown-linux-gnu ;;
    Linux-aarch64 | Linux-arm64) echo aarch64-unknown-linux-gnu ;;
    Darwin-x86_64) echo x86_64-apple-darwin ;;
    Darwin-arm64) echo aarch64-apple-darwin ;;
    *) die "no uv build for $(uname -s) $(uname -m)" ;;
  esac
}

verify_sha256() {
  if command -v sha256sum > /dev/null 2>&1; then
    sha256sum --check --status "$1"
  else
    shasum -a 256 --check --status "$1"
  fi
}

ensure_uv() {
  local on_path dest platform asset tmp
  on_path="$(command -v uv || true)"
  if [ -n "$on_path" ] && [ "$("$on_path" --version 2> /dev/null | awk '{print $2}')" = "$UV_VERSION" ]; then
    UV="$on_path"
    return
  fi
  dest="$INSTALL_HOME/uv-$UV_VERSION"
  if [ -x "$dest/uv" ]; then
    UV="$dest/uv"
    return
  fi
  platform="$(uv_platform)"
  asset="uv-$platform.tar.gz"
  tmp="$(mktemp -d)"
  say "Downloading uv $UV_VERSION ($platform)"
  if ! curl -fsSL -o "$tmp/$asset" "$UV_DOWNLOAD_BASE/$UV_VERSION/$asset" \
    || ! curl -fsSL -o "$tmp/$asset.sha256" "$UV_DOWNLOAD_BASE/$UV_VERSION/$asset.sha256"; then
    rm -rf "$tmp"
    die "could not download uv $UV_VERSION from $UV_DOWNLOAD_BASE"
  fi
  if ! (cd "$tmp" && verify_sha256 "$asset.sha256"); then
    rm -rf "$tmp"
    die "uv $UV_VERSION failed its SHA-256 check; nothing was installed"
  fi
  tar -xzf "$tmp/$asset" -C "$tmp"
  mkdir -p "$dest"
  mv "$tmp/uv-$platform/uv" "$tmp/uv-$platform/uvx" "$dest/"
  rm -rf "$tmp"
  UV="$dest/uv"
}

fetch_ref() {
  if [[ $1 =~ $STABLE_TAG ]]; then
    git -C "$DIR" fetch --quiet "$FORK_URL" "+refs/tags/$1:refs/tags/$1"
    git -C "$DIR" rev-parse "refs/tags/$1^{commit}"
  else
    git -C "$DIR" fetch --quiet "$FORK_URL" "$1"
    git -C "$DIR" rev-parse "FETCH_HEAD^{commit}"
  fi
}

prepare_checkout() {
  local ref="$1" branch
  if [ ! -e "$DIR" ]; then
    say "Cloning $FORK_URL into $DIR"
    git clone --quiet --no-checkout "$FORK_URL" "$DIR"
    TARGET="$(fetch_ref "$ref")"
    git -C "$DIR" checkout --quiet --detach "$TARGET"
    return
  fi
  git -C "$DIR" rev-parse --is-inside-work-tree > /dev/null 2>&1 || die "$DIR exists but is not a git checkout"
  [ -z "$(git -C "$DIR" status --porcelain --untracked-files=no)" ] \
    || die "$DIR has uncommitted changes; commit or stash them first"
  TARGET="$(fetch_ref "$ref")"
  branch="$(git -C "$DIR" symbolic-ref --quiet --short HEAD || true)"
  if [ -n "$branch" ] && ! git -C "$DIR" merge-base --is-ancestor HEAD "$TARGET"; then
    die "branch $branch in $DIR has commits that $ref does not; check out $ref by hand or use a clean checkout"
  fi
}

move_checkout() {
  if [ -n "$(git -C "$DIR" symbolic-ref --quiet --short HEAD || true)" ]; then
    git -C "$DIR" merge --quiet --ff-only "$TARGET"
  else
    git -C "$DIR" checkout --quiet --detach "$TARGET"
  fi
}

ensure_cargo() {
  PATH="$HOME/.cargo/bin:$PATH"
  command -v cargo > /dev/null 2>&1 \
    || die "cargo not found; install the Rust toolchain (https://rustup.rs), which builds litellm's native extension"
}

sync_args() {
  local extra
  local -a extras
  SYNC_ARGS=(sync --frozen --no-default-groups --managed-python --python "$PYTHON_VERSION")
  IFS=, read -ra extras <<< "$EXTRAS"
  for extra in "${extras[@]}"; do
    if [ -n "$extra" ]; then
      SYNC_ARGS+=(--extra "$extra")
    fi
  done
}

sync_venv() {
  sync_args
  say "Syncing $VENV to uv.lock (extras: $EXTRAS)"
  (cd "$DIR" && UV_PROJECT_ENVIRONMENT="$VENV" "$UV" "${SYNC_ARGS[@]}")
}

preview_sync() {
  local tree status=0
  sync_args
  tree="$(mktemp -d)"
  git -C "$DIR" worktree add --quiet --detach "$tree/litellm" "$TARGET"
  say "Dry run: packages syncing $VENV to $(git -C "$tree/litellm" rev-parse --short HEAD) would change"
  (cd "$tree/litellm" && UV_PROJECT_ENVIRONMENT="$VENV" "$UV" "${SYNC_ARGS[@]}" --dry-run) > "$tree/plan" 2>&1 \
    || status=$?
  grep -vE '^ [-+] litellm(-enterprise|-proxy-extras)?( |==|$)|^Would (install|uninstall) [0-9]+ package' "$tree/plan" \
    || true
  say "litellm, litellm-enterprise and litellm-proxy-extras are always rebuilt from the checkout"
  git -C "$DIR" worktree remove --force "$tree/litellm"
  rm -rf "$tree"
  return "$status"
}

generate_prisma_client() {
  [ -x "$VENV/bin/prisma" ] || return 0
  say "Generating the Prisma client"
  (cd "$DIR" && PATH="$VENV/bin:$PATH" prisma generate --schema=./schema.prisma > /dev/null)
}

report() {
  say "Installed $(git -C "$DIR" describe --tags --always) ($(git -C "$DIR" rev-parse --short HEAD)) into $VENV"
  "$VENV/bin/python" - << 'PY'
import importlib.metadata

import litellm
from litellm.rust_bridge import native_bridge_available

print(f"    litellm {importlib.metadata.version('litellm')} from {litellm.__file__}")
print(f"    native extension loaded: {native_bridge_available()}")
PY
  say "Restart any service that runs from $VENV to pick this up"
}

main() {
  parse_args "$@"
  local ref
  ref="$(resolve_ref "$REF")"
  say "Installing 519lab/litellm $ref"
  if [ "$DRY_RUN" = true ] && [ ! -e "$DIR" ]; then
    die "--dry-run previews an upgrade of an existing install, and $DIR does not exist"
  fi
  ensure_uv
  prepare_checkout "$ref"
  if [ "$DRY_RUN" = true ]; then
    preview_sync
    say "Dry run: neither $DIR nor $VENV was changed"
    return
  fi
  ensure_cargo
  move_checkout
  sync_venv
  generate_prisma_client
  report
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  main "$@"
fi
