# Claude Code Router Config - Advanced Multi-Provider Setup

🚀 **v2.4.4** - Multi-provider Claude Code routing with GLM-5, Claude Pro, DeepSeek & more!

Use Claude Code as a single interface to access multiple AI providers with intelligent routing for optimal performance, cost, and quality.

## ✨ Quick Start

```bash
# 1. Install
npm install -g @halilertekin/claude-code-router-config

# 2. Configure API keys in ~/.env
export GLM_API_KEY="your_key"

# 3. Use with Claude Code
glm        # → z.ai GLM-4.7 (Coding Plan)
glm5       # → z.ai GLM-5 (Coding Plan)
glmapi     # → z.ai GLM-5 (API Credits)
claude-pro # → Anthropic Claude Pro
deepseek   # → DeepSeek
```

---

## 📋 Available Aliases

| Alias | Provider | Endpoint | Model | Best For |
|-------|----------|----------|-------|----------|
| `glm` | z.ai | Coding Plan | GLM-4.7 | Pro subscription coding |
| `glm5` | z.ai | Coding Plan | GLM-5 | Max users, complex tasks |
| `glmapi` | z.ai | API Credits | GLM-5 | Pay-per-use (30$ bakiye) |
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

### User Guides
- [Setup Guide (TR/EN)](SETUP.md)
- [Provider Setup Guide](docs/PROVIDER_SETUP.md)
- [Full Documentation](docs/FULL_DOCUMENTATION_EN.md)

### Optimization & Best Practices
- [📚 Claude Code Optimization Guide](docs/claude-code-optimization/CLAUDE_OPTIMIZATION_GUIDE.md) **NEW!**
  - Token optimization tips (25-35% savings)
  - Best practices for CLAUDE.md
  - Model selection strategies
  - Applied optimizations for v2.4.3

---

## 🔧 Troubleshooting

### "GLM_API_KEY not set"
- Check `~/.env` file exists and has the key
- Run `source ~/.zshrc` or restart terminal

### Model not working
- Verify API key is valid
- Check quotas/balance

---

## 🔒 Security

This package follows security best practices:

### Vulnerability Management
- **Automated scanning**: Dependabot monitors dependencies
- **Zero vulnerabilities**: All reported issues are patched promptly
- **Version 2.4.4**: All security advisories resolved

### Security Updates
```bash
# Check for updates
npm outdated -g @halilertekin/claude-code-router-config

# Update to latest
npm update -g @halilertekin/claude-code-router-config
```

### API Key Safety
- API keys stored in `~/.env` (never in code)
- `.env` is gitignored by default
- Keys are loaded securely with shell source

### Reported Vulnerabilities
- ✅ All vulnerabilities fixed in v2.4.4
- See [Security Advisories](https://github.com/halilertekin/CC-RouterMultiProvider/security/advisories)

---

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---

## ⚡ Performance Optimization

### Token Limit Optimization

Claude Code adds an attribution header to every request that causes the full prompt to be reprocessed each time, leading to faster token depletion. To disable this:

```bash
# Add to ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0"
  }
}
```

---

## 🤖 AI Agent & Skill Ekleme Rehberi

Aşağıdaki üçüncü parti agent ve skill'leri Claude Code'a ekleyebilirsin:

### 1. Scientific Skills (Bilimsel Araştırma)
**K-Dense-AI/claude-scientific-skills** - 140+ bilimsel skill

```bash
# Claude Code'da çalıştır:
/plugin marketplace add K-Dense-AI/claude-scientific-skills
/plugin install scientific-skills@claude-scientific-skills
```

Kapsam: Bioinformatics, Drug Discovery, Clinical Research, ML/AI, Data Analysis

---

### 2. ASO Skills (App Store Optimizasyonu)
**alirezarezvani/claude-code-aso-skill** - ASO agent sistemi

```bash
git clone https://github.com/alirezarezvani/claude-code-aso-skill.git
cp .claude/agents/aso/*.md ~/.claude/agents/
```

Kapsam: Keyword research, metadata optimization, pre-launch checklist

---

### 3. App Store Connect CLI Skills
**rudrankriyam/app-store-connect-cli-skills** - iOS deployment otomasyonu

```bash
npx skills add rudrankriyam/app-store-connect-cli-skills
```

Kapsam: Build, TestFlight, metadata upload, submission, signing

---

## 🔄 Auto-Refactor Bot (PR Otomatik İnceleme)

MiniMax M2.5 kullanarak PR'ları otomatik inceleyen bot kurulumu:

### Kurulum

1. **OpenRouter'da MiniMax endpoint al**
2. **GitHub Action oluştur** (.github/workflows/auto-refactor.yml):

```yaml
name: Auto-Refactor Bot
on: [pull_request]

jobs:
  refactor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          
      - name: Run Auto-Refactor
        run: |
          # PR diff'ini al
          git diff main...HEAD --name-only > changed_files.txt
          
          # MiniMax'e gönder (refactor önerileri)
          curl -X POST https://openrouter.ai/api/v1/chat/completions \
            -H "Authorization: Bearer $OPENROUTER_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{
              "model": "minimax/MiniMax-M2.5",
              "messages": [{"role": "user", "content": "Bu kodları incele ve refactor/optimizasyon önerilerini listele."}]
            }'
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

3. **Secret ekle**: OpenRouter API key'i GitHub secrets'a ekle

### Nasıl Çalışır?

1. PR açılır → GitHub Action tetiklenir
2. Bot değişiklikleri analiz eder
3. MiniMax M2.5'e gönderir
4. Refactor önerisi varsa commit atar
5. Değişiklik yoksa herhangi bir şey yapmaz

**Maliyet**: ~$0.001/analiz (çok ucuz!)

---

## ⭐ Support

If you find this useful, please give it a ⭐ on [GitHub](https://github.com/halilertekin/CC-RouterMultiProvider)!
