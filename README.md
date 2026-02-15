# Claude Code Router Config - Advanced Multi-Provider Setup

🚀 **v2.3.0** - Multi-provider Claude Code routing with GLM-5, Claude Pro, DeepSeek & more!

Use Claude Code as a single interface to access multiple AI providers with intelligent routing for optimal performance, cost, and quality.

## ✨ Quick Start

```bash
# 1. Install
npm install -g @halilertekin/claude-code-router-config

# 2. Configure API keys in ~/.env
export GLM_API_KEY="your_key"

# 3. Use with Claude Code
glm        # → z.ai GLM-5 (Coding Plan)
glmapi     # → z.ai GLM-5 (API Credits)
claude-pro # → Anthropic Claude Pro
deepseek   # → DeepSeek
```

---

## 📋 Available Aliases

| Alias | Provider | Endpoint | Model | Best For |
|-------|----------|----------|-------|----------|
| `glm` | z.ai | Coding Plan | GLM-5 | Subscription coding |
| `glmapi` | z.ai | API Credits | GLM-5 | Pay-per-use |
| `claude-pro` | Anthropic | Official | Claude Sonnet 4.5 | Premium coding |
| `deepseek` | DeepSeek | Anthropic API | deepseek-chat | Budget coding |
| `minimax` / `mm` | MiniMax | Anthropic API | M2.5 | Long context |

---

## 🚀 Installation

### Option 1: NPM (Recommended)

```bash
npm install -g @halilertekin/claude-code-router-config
source ~/.zshrc
```

### Option 2: Manual

```bash
git clone git@github.com:halilertekin/CC-RouterMultiProvider.git ~/code/claude-code-router-config
```

Then add to `~/.zshrc`:
```bash
[[ -f "$HOME/code/claude-code-router-config/cli/ccc.zsh" ]] && source "$HOME/code/claude-code-router-config/cli/ccc.zsh"
```

---

## 🔑 API Key Setup

Add to `~/.env`:

```bash
# z.ai (GLM) - https://z.ai/apikeys
export GLM_API_KEY="your_zai_key"

# Anthropic Claude Pro - https://console.anthropic.com/settings/keys
export ANTHROPIC_API_KEY="your_anthropic_key"

# DeepSeek - https://platform.deepseek.com/
export DEEPSEEK_API_KEY="your_deepseek_key"

# MiniMax - https://platform.minimax.io/
export MINIMAX_API_KEY="your_minimax_key"

# OpenAI - https://platform.openai.com/api-keys
export OPENAI_API_KEY="your_openai_key"

# Gemini - https://aistudio.google.com/apikey
export GEMINI_API_KEY="your_gemini_key"
```

---

## 💻 Claude Code Usage

### Direct Aliases

```bash
# GLM via Coding Plan (subscription)
glm

# GLM via API Credits (pay-per-use)
glmapi

# Official Claude Pro
claude-pro

# DeepSeek
deepseek
```

### With Arguments

```bash
glm "write a React component"
glmapi --print "explain this code"
claude-pro --dangerous-skip-install
```

---

## 🏢 Provider Details

### z.ai (GLM)

- **Website**: https://z.ai
- **Models**: GLM-5 (recommended for max users), GLM-4.7, GLM-4.5
- **Endpoints**:
  - Coding Plan: `https://api.z.ai/api/coding/paas/v4`
  - API Credits: `https://api.z.ai/api/paas/v4`
- **Pricing**: Very competitive, 3x usage with Coding Plan
- **Note**: For maximum users/capacity, use GLM-5 as documented in official z.ai docs

### Claude Pro

- **Website**: https://www.anthropic.com/claude
- **Models**: Claude Sonnet 4.5, Claude Opus 4.5, Claude Haiku
- **Access**: Use `claude login` or API key

### DeepSeek

- **Website**: https://www.deepseek.com
- **Models**: deepseek-chat, deepseek-coder
- **Pricing**: Very affordable

### MiniMax

- **Website**: https://www.minimax.io
- **Models**: M2.5, M2, M1
- **Endpoint**: `https://api.minimax.io/anthropic`
- **Features**: Ultra-long context (200k+ tokens), very competitive pricing

---

## 🛠️ Advanced Features

### Full Router Mode

For intent-based routing with automatic model selection:

```bash
ccr start      # Start router
ccr code       # Start Claude Code with router
ccr status     # Check status
ccr benchmark  # Benchmark providers
```

### Configuration Templates

```bash
ccr config template performance-optimized  # Fastest
ccr config template cost-optimized          # Cheapest
ccr config template quality-focused         # Best quality
```

### Analytics

```bash
ccr analytics today --detailed
ccr ui  # Web dashboard
```

---

## 📖 Documentation

- [Setup Guide (TR/EN)](SETUP.md)
- [Provider Setup Guide](docs/PROVIDER_SETUP.md)
- [Full Documentation](docs/FULL_DOCUMENTATION_EN.md)

---

## 🔧 Troubleshooting

### "GLM_API_KEY not set"
- Check `~/.env` file exists and has the key
- Run `source ~/.zshrc` or restart terminal

### Model not working
- Verify API key is valid
- Check quotas/balance

---

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---

## ⭐ Support

If you find this useful, please give it a ⭐ on [GitHub](https://github.com/halilertekin/CC-RouterMultiProvider)!
