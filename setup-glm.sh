#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.claude-code-router"
BIN_DIR="$HOME/.local/bin"
KEYS_FILE="$CONFIG_DIR/keys.env"
ZSHRC="${HOME}/.zshrc"

GLM_KEY="${GLM_API_KEY:-}"
SKIP_INSTALL=0
NONINTERACTIVE=0

usage() {
  cat <<'USAGE'
Usage: ./setup-glm.sh [--key <GLM_API_KEY>] [--skip-install] [--non-interactive]

Installs/updates CCR (if missing), writes GLM-only config,
creates ~/.claude-code-router/keys.env, and installs a single
command: glm (plus aliases ccc and claude-glm).

Options:
  --key <GLM_API_KEY>   Provide GLM key non-interactively
  --skip-install        Do not install ccr if missing
  --non-interactive     Fail instead of prompting for key
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key)
      GLM_KEY="${2:-}"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --non-interactive)
      NONINTERACTIVE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

ensure_ccr() {
  if command -v ccr >/dev/null 2>&1; then
    return 0
  fi
  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    echo "ccr not found. Install it and rerun this script." >&2
    exit 1
  fi
  if [[ "$(uname -s)" == "Darwin" ]] && command -v brew >/dev/null 2>&1; then
    echo "Installing ccr via Homebrew..."
    brew install halilertekin/tap/claude-code-router-config
    return 0
  fi
  if command -v pnpm >/dev/null 2>&1; then
    echo "Installing ccr via pnpm..."
    pnpm add -g @halilertekin/claude-code-router-config
    return 0
  fi
  if command -v npm >/dev/null 2>&1; then
    echo "Installing ccr via npm..."
    npm i -g @halilertekin/claude-code-router-config
    return 0
  fi
  echo "Could not install ccr (brew/pnpm/npm missing)." >&2
  exit 1
}

backup_file() {
  local src="$1"
  if [[ -f "$src" ]]; then
    local ts
    ts="$(date +"%Y%m%d%H%M%S")"
    cp "$src" "${src}.${ts}.bak"
  fi
}

write_keys() {
  if [[ -z "${GLM_KEY}" ]]; then
    if [[ "$NONINTERACTIVE" -eq 1 ]]; then
      echo "GLM_API_KEY not provided. Use --key or set GLM_API_KEY env." >&2
      exit 1
    fi
    read -r -s -p "Enter GLM_API_KEY: " GLM_KEY
    echo ""
  fi

  mkdir -p "$CONFIG_DIR"
  local tmp
  tmp="$(mktemp)"
  if [[ -f "$KEYS_FILE" ]]; then
    grep -v '^GLM_API_KEY=' "$KEYS_FILE" | grep -v '^export GLM_API_KEY=' > "$tmp" || true
  fi
  echo "export GLM_API_KEY=\"${GLM_KEY}\"" >> "$tmp"
  mv "$tmp" "$KEYS_FILE"
  chmod 600 "$KEYS_FILE"
}

install_wrapper() {
  mkdir -p "$BIN_DIR"
  cat > "$BIN_DIR/ccr-glm" <<'EOS'
#!/usr/bin/env bash
set -euo pipefail

ROUTER_DIR="$HOME/.claude-code-router"
KEYS_FILE="$ROUTER_DIR/keys.env"

load_keys() {
  if [[ -f "$KEYS_FILE" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%$'\r'}"
      line="${line%%#*}"
      line="$(echo "$line" | sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//')"
      [[ -z "$line" ]] && continue
      if [[ "$line" =~ ^(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        key="${BASH_REMATCH[2]}"
        val="${BASH_REMATCH[3]}"
        val="$(echo "$val" | sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//')"
        if [[ ${#val} -ge 2 ]]; then
          if [[ "${val:0:1}" == "\"" && "${val: -1}" == "\"" ]]; then
            val="${val:1:-1}"
          elif [[ "${val:0:1}" == "'" && "${val: -1}" == "'" ]]; then
            val="${val:1:-1}"
          fi
        fi
        val="${val%$'\r'}"
        if [[ -n "$val" ]]; then
          export "$key=$val"
        fi
      fi
    done < "$KEYS_FILE"
  fi
}

port_open() {
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 3456 >/dev/null 2>&1
    return $?
  fi
  python3 - <<'PY' >/dev/null 2>&1
import socket
s=socket.socket()
try:
    s.connect(("127.0.0.1", 3456))
    s.close()
    raise SystemExit(0)
except Exception:
    raise SystemExit(1)
PY
}

load_keys

if [[ -z "${GLM_API_KEY:-}" ]]; then
  echo "GLM_API_KEY not set. Add it to ~/.claude-code-router/keys.env" >&2
  exit 1
fi

if ! port_open; then
  if ! command -v ccr >/dev/null 2>&1; then
    echo "ccr not found in PATH." >&2
    exit 1
  fi
  (ccr start >/dev/null 2>&1 & disown) || true
  for _ in {1..20}; do
    if port_open; then
      break
    fi
    sleep 0.5
  done
fi

if ! port_open; then
  echo "CCR failed to start (port 3456 not listening)." >&2
  exit 1
fi

eval "$(ccr activate)"

export ANTHROPIC_MODEL="glm,glm-4.7"
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm,glm-4.7"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm,glm-4.7"
export ANTHROPIC_DEFAULT_OPUS_MODEL="glm,glm-4.7"
export CLAUDE_CODE_SUBAGENT_MODEL="glm,glm-4.7"
export ANTHROPIC_SMALL_FAST_MODEL="glm,glm-4.7"

CLAUDE_BIN="$HOME/.claude/local/claude"
if [[ ! -x "$CLAUDE_BIN" ]]; then
  CLAUDE_BIN="$(command -v claude || true)"
fi
if [[ -z "${CLAUDE_BIN:-}" ]]; then
  echo "claude binary not found. Install Claude Code first." >&2
  exit 1
fi

"$CLAUDE_BIN" "$@"
EOS
  chmod +x "$BIN_DIR/ccr-glm"
  ln -sf "$BIN_DIR/ccr-glm" "$BIN_DIR/glm"
  ln -sf "$BIN_DIR/ccr-glm" "$BIN_DIR/ccc"
  ln -sf "$BIN_DIR/ccr-glm" "$BIN_DIR/claude-glm"
}

ensure_path() {
  if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    if [[ ! -f "$ZSHRC" ]]; then
      touch "$ZSHRC"
    fi
    if ! grep -q "CCR GLM PATH" "$ZSHRC" 2>/dev/null; then
      cat >> "$ZSHRC" <<'EOF'
# >>> CCR GLM PATH >>>
export PATH="$HOME/.local/bin:$PATH"
# <<< CCR GLM PATH <<<
EOF
    fi
  fi
}

ensure_ccr
mkdir -p "$CONFIG_DIR"
backup_file "$CONFIG_DIR/config.json"
cp "$SCRIPT_DIR/config/glm-only.json" "$CONFIG_DIR/config.json"
backup_file "$CONFIG_DIR/intent-router-glm.js"
cp "$SCRIPT_DIR/config/intent-router-glm.js" "$CONFIG_DIR/intent-router-glm.js"
python - <<'PY'
import json
import os

config_path = os.path.join(os.environ["HOME"], ".claude-code-router", "config.json")
with open(config_path, "r", encoding="utf-8") as handle:
    data = json.load(handle)
data["CUSTOM_ROUTER_PATH"] = "$HOME/.claude-code-router/intent-router-glm.js"
with open(config_path, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent=2)
PY
write_keys
install_wrapper
ensure_path

echo ""
echo "GLM setup complete."
echo "Run: source ~/.zshrc"
echo "Then: glm"
