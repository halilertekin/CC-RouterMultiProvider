#!/bin/zsh

# Claude Code Router (Modern replacement for ccm/ccc)
# Source this file in your .zshrc: source ~/code/claude-code-router-config/cli/ccc.zsh

ccc() {
  local model_alias="${1:-claude}"
  shift 1 2>/dev/null
  local extra_args=("$@")

  # Load keys from multiple sources for redundancy
  [[ -f ~/.ccm_config ]] && source ~/.ccm_config 2>/dev/null
  [[ -f ~/.env ]] && source ~/.env 2>/dev/null

  # 1. CLEANUP: Remove all env vars that might interfere with Claude Pro
  unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_AUTH_TOKEN API_TIMEOUT_MS
  unset ANTHROPIC_DEFAULT_SONNET_MODEL ANTHROPIC_DEFAULT_OPUS_MODEL ANTHROPIC_DEFAULT_HAIKU_MODEL

  # 2. CONFIGURATION based on alias
  case "$model_alias" in
    glm|zhipu|zai|pp|zero)
      # z.ai / GLM 4.7 configuration
      export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
      # Priority: 1. ENV, 2. PP_KEY (config), 3. GLM_KEY (config)
      export ANTHROPIC_API_KEY="${GLM_API_KEY:-${PPINFRA_API_KEY:-$GLM_KEY}}"
      export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
      export ANTHROPIC_MODEL="glm-4.7"
      export API_TIMEOUT_MS=3000000
      
      # Force mappings for z.ai
      export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.7"
      export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.7"
      export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"
      
      echo "🔄 Provider: z.ai (GLM 4.7)"
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
      
    *)
      echo "Unknown model alias: $model_alias"
      echo "Available: glm, ds, claude"
      return 1
      ;;
  esac

  echo "🚀 Launching Claude Code..."
  [[ -n "$ANTHROPIC_BASE_URL" ]] && echo "🌐 Base URL: $ANTHROPIC_BASE_URL"

  if [[ ${#extra_args[@]} -eq 0 ]]; then
    exec claude
  else
    exec claude "${extra_args[@]}"
  fi
}

# Shortcuts
alias glm="ccc glm"
alias deepseek="ccc ds"
alias claude-pro="ccc claude"
