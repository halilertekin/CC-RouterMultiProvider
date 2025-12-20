#!/bin/bash

# Claude Code Router - Install Script
# Usage: ./install.sh

set -e

echo "=========================================="
echo "  Claude Code Router - Kurulum"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm bulunamadı. Kuruluyor...${NC}"
    npm install -g pnpm
fi

# Install claude-code-router
echo -e "${GREEN}[1/3] Claude Code Router kuruluyor...${NC}"
pnpm add -g @musistudio/claude-code-router

# Create config directory
echo -e "${GREEN}[2/3] Config dizini oluşturuluyor...${NC}"
mkdir -p ~/.claude-code-router

# Copy config files
echo -e "${GREEN}[3/3] Config dosyaları kopyalanıyor...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp "$SCRIPT_DIR/config/config.json" ~/.claude-code-router/
cp "$SCRIPT_DIR/config/intent-router.js" ~/.claude-code-router/

echo ""
echo -e "${GREEN}=========================================="
echo "  Kurulum Tamamlandı!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}SON ADIM: ~/.zshrc dosyanıza aşağıdaki satırları ekleyin:${NC}"
echo ""
cat << 'EOF'
# ═══════════════════════════════════════════════════
# Claude Code Router - API Keys
# ═══════════════════════════════════════════════════
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIza..."
export QWEN_API_KEY="sk-..."
export GLM_API_KEY="..."
export OPENROUTER_API_KEY="sk-or-..."

# Router Connection
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export NO_PROXY="127.0.0.1"
EOF

echo ""
echo -e "${GREEN}Sonra:${NC}"
echo "  source ~/.zshrc"
echo "  ccr code"
echo ""
echo -e "${YELLOW}API Key Alma Linkleri:${NC}"
echo "  OpenAI:     https://platform.openai.com/api-keys"
echo "  Anthropic:  https://console.anthropic.com/settings/keys"
echo "  Gemini:     https://aistudio.google.com/apikey"
echo "  Qwen:       https://dashscope.console.aliyun.com/apiKey"
echo "  GLM:        https://open.bigmodel.cn/usercenter/apikeys"
echo "  OpenRouter: https://openrouter.ai/keys"
