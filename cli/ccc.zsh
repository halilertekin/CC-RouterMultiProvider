#!/bin/zsh

# Claude Code Router (Modern replacement for ccm/ccc)
# Source this file in your .zshrc: source ~/code/claude-code-router-config/cli/ccc.zsh

ccc() {
  local model_alias="${1:-claude}"
  shift 1 2>/dev/null
  local extra_args=("$@")

  load_env_file() {
    local env_file="$1"
    [[ -f "$env_file" ]] || return 0
    local line key val
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%$'\r'}"
      line="${line%%#*}"
      line="${line#"${line%%[![:space:]]*}"}"
      line="${line%"${line##*[![:space:]]}"}"
      [[ -z "$line" ]] && continue
      line="${line#export }"
      [[ "$line" == *"="* ]] || continue
      key="${line%%=*}"
      val="${line#*=}"
      key="${key#"${key%%[![:space:]]*}"}"
      key="${key%"${key##*[![:space:]]}"}"
      val="${val#"${val%%[![:space:]]*}"}"
      val="${val%"${val##*[![:space:]]}"}"
      if [[ ${#val} -ge 2 ]]; then
        if [[ "$val" == \"*\" && "$val" == *\" ]]; then
          val="${val:1:-1}"
        elif [[ "$val" == \'*\' && "$val" == *\' ]]; then
          val="${val:1:-1}"
        fi
      fi
      if [[ "$key" == [A-Za-z_][A-Za-z0-9_]* ]]; then
        export "$key=$val"
      fi
    done < "$env_file"
  }

  # Load keys from multiple sources for redundancy (safe parser)
  load_env_file "$HOME/.ccm_config"
  load_env_file "$HOME/.env"
  load_env_file "$HOME/.claude-code-router/keys.env"

  # 1. CLEANUP: Remove all env vars that might interfere with Claude Pro
  unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_AUTH_TOKEN API_TIMEOUT_MS
  unset ANTHROPIC_DEFAULT_SONNET_MODEL ANTHROPIC_DEFAULT_OPUS_MODEL ANTHROPIC_DEFAULT_HAIKU_MODEL

  # 2. CONFIGURATION based on alias
  case "$model_alias" in
    glm)
      # z.ai / GLM Coding Plan endpoint (Anthropic-compatible)
      export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
      export ANTHROPIC_API_KEY="${GLM_API_KEY:-${PPINFRA_API_KEY:-$GLM_KEY}}"
      export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
      export API_TIMEOUT_MS=3000000
      
      # Model mappings - GLM-5 for Coding Plan (manual override required per docs)
      export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.7"
      export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.7"
      export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"
      export ANTHROPIC_SMALL_FAST_MODEL="glm-4.5-air"
      export CLAUDE_CODE_SUBAGENT_MODEL="glm-4.7"
      # For GLM-5 specifically, also set the default model
      export ANTHROPIC_MODEL="glm-4.7"

      if [[ -z "$ANTHROPIC_API_KEY" ]]; then
        echo "GLM_API_KEY not set. Add it to ~/.env or ~/.claude-code-router/keys.env" >&2
        return 1
      fi
      
      echo "🔄 Provider: z.ai (GLM Coding Plan)"
      ;;
      
    glm5)
      # z.ai / GLM-5 specifically (requires manual model setting per docs)
      export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
      export ANTHROPIC_API_KEY="${GLM_API_KEY:-${PPINFRA_API_KEY:-$GLM_KEY}}"
      export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
      export API_TIMEOUT_MS=3000000
      
      # Model mappings for GLM-5
      export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-5"
      export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-5"
      export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"
      export ANTHROPIC_SMALL_FAST_MODEL="glm-4.5-air"
      export CLAUDE_CODE_SUBAGENT_MODEL="glm-5"
      export ANTHROPIC_MODEL="glm-5"

      if [[ -z "$ANTHROPIC_API_KEY" ]]; then
        echo "GLM_API_KEY not set. Add it to ~/.env or ~/.claude-code-router/keys.env" >&2
        return 1
      fi
      
      echo "🔄 Provider: z.ai (GLM-5)"
      ;;
      
    glmapi)
      # z.ai / GLM API Credits - direct to z.ai API (no CCR needed)
      # Uses Anthropic-compatible endpoint with GLM-5
      export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
      export ANTHROPIC_API_KEY="${GLM_API_KEY:-${PPINFRA_API_KEY:-$GLM_KEY}}"
      export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
      export API_TIMEOUT_MS=3000000
      
      export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-5"
      export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-5"
      export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"
      export ANTHROPIC_SMALL_FAST_MODEL="glm-4.5-air"
      export CLAUDE_CODE_SUBAGENT_MODEL="glm-5"
      export ANTHROPIC_MODEL="glm-5"

      if [[ -z "$ANTHROPIC_API_KEY" ]]; then
        echo "GLM_API_KEY not set. Add it to ~/.env or ~/.claude-code-router/keys.env" >&2
        return 1
      fi
      
      echo "🔄 Provider: z.ai (GLM-5 API Credits)"
      ;;
      
    ds|deepseek)
      # Deepseek configuration
      export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
      export ANTHROPIC_API_KEY="${DEEPSEEK_API_KEY:-$DS_KEY}"
      export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
      export ANTHROPIC_MODEL="deepseek-chat"
      export API_TIMEOUT_MS=600000
      
      echo "🔄 Provider: DeepSeek"
      ;;
      
    claude)
      # Official Claude (Pro Subscription)
      export ANTHROPIC_MODEL="claude-sonnet-4-5-20250929"
      echo "🔄 Provider: Official Anthropic (Claude Pro)"
      ;;
      
    mm|minimax)
      # MiniMax configuration
      export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
      export ANTHROPIC_API_KEY="${MINIMAX_API_KEY}"
      export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
      export ANTHROPIC_MODEL="MiniMax-M2.5"
      export API_TIMEOUT_MS=3000000
      
      export ANTHROPIC_DEFAULT_SONNET_MODEL="MiniMax-M2.5"
      export ANTHROPIC_DEFAULT_OPUS_MODEL="MiniMax-M2.5"
      export ANTHROPIC_DEFAULT_HAIKU_MODEL="MiniMax-M2"
      export CLAUDE_CODE_SUBAGENT_MODEL="MiniMax-M2.5"

      if [[ -z "$ANTHROPIC_API_KEY" ]]; then
        echo "MINIMAX_API_KEY not set. Add it to ~/.env" >&2
        return 1
      fi
      
      echo "🔄 Provider: MiniMax (M2.5)"
      ;;
      
    *)
      echo "Unknown model alias: $model_alias"
      echo "Available: glm (coding plan), glmapi (kredi), ds, claude, mm"
      return 1
      ;;
  esac

  echo "🚀 Launching Claude Code..."
  [[ -n "$ANTHROPIC_BASE_URL" ]] && echo "🌐 Base URL: $ANTHROPIC_BASE_URL"

  if [[ ${#extra_args[@]} -eq 0 ]]; then
    claude
  else
    claude "${extra_args[@]}"
  fi
}

# Shortcuts
alias glm="ccc glm"
alias glm5="ccc glm5"
alias glmapi="ccc glmapi"
alias deepseek="ccc ds"
alias claude-pro="ccc claude"
alias minimax="ccc mm"
alias mm="ccc mm"
