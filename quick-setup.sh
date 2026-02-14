#!/bin/zsh

# Claude Code Router - Quick Setup Script
# Usage: ./quick-setup.sh

echo "🔧 Claude Code Router - Quick Setup / Hızlı Kurulum"
echo "====================================================="

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ZSHRC="$HOME/.zshrc"

# 1. Add source line to .zshrc
SOURCE_LINE='[[ -f "$HOME/code/claude-code-router-config/cli/ccc.zsh" ]] && source "$HOME/code/claude-code-router-config/cli/ccc.zsh"'

if grep -q "claude-code-router-config/cli/ccc.zsh" "$ZSHRC" 2>/dev/null; then
    echo "✅ .zshrc already configured"
else
    echo "" >> "$ZSHRC"
    echo "# Claude Code Router" >> "$ZSHRC"
    echo "$SOURCE_LINE" >> "$ZSHRC"
    echo "✅ .zshrc updated"
fi

# 2. Check .env file
ENV_FILE="$HOME/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    touch "$ENV_FILE"
fi

if grep -q "GLM_API_KEY" "$ENV_FILE" 2>/dev/null; then
    echo "✅ GLM_API_KEY defined"
else
    echo "" >> "$ENV_FILE"
    echo "# z.ai GLM API Key" >> "$ENV_FILE"
    echo 'export GLM_API_KEY="YOUR_KEY_HERE"' >> "$ENV_FILE"
    echo "⚠️ Added GLM_API_KEY to .env - replace with your actual key"
fi

# 3. Reload shell
source "$ZSHRC"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Usage / Kullanım:"
echo "  glm       → z.ai Coding Plan (GLM-5)"
echo "  glmapi    → z.ai API Credits (GLM-5)"  
echo "  claude-pro → Claude Pro"
echo "  deepseek  → DeepSeek"
echo ""
echo "Next steps / Sonraki adımlar:"
echo "  1. Get API key from https://z.ai/apikeys"
echo "  2. Update GLM_API_KEY in ~/.env"
echo "  3. Restart terminal"
echo ""
