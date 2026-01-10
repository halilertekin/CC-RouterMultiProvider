# Claude Code Router Config - Advanced Multi-Provider Setup

🚀 **v2.0.1** - Unified router + config package with z.ai (GLM 4.7) support, advanced CLI tools, analytics, smart routing, and configuration templates!

Use Claude Code as a single interface to access multiple AI providers with intelligent routing for optimal performance, cost, and quality.

## ✨ New in v2.0.1
- **z.ai Support**: Native integration for GLM-4.7 via z.ai (PPInfra).
- **Lightweight Mode**: New `ccc` function for zero-dependency routing.
- **Direct GLM Alias**: Type `glm` to launch Claude Code with GLM-4.7 immediately.
- **Non-interactive install**: CI-friendly installer flags and env controls.
- **Unified router**: Built-in router service, no external dependency required.
- **Packaging fix**: Router files are bundled in the npm package.

## 🚀 Setup on Another Machine (Fastest Way)

If you just want to use the `ccc` command (Claude Code Commander) and `glm` alias without installing the full Node.js router stack:

1. **Clone the repo:**
   ```bash
   mkdir -p ~/code
   git clone git@github.com:halilertekin/CC-RouterMultiProvider.git ~/code/claude-code-router-config
   ```

2. **Source the script in your `.zshrc`:**
   Add this line to your `~/.zshrc`:
   ```bash
   [[ -f "$HOME/code/claude-code-router-config/cli/ccc.zsh" ]] && source "$HOME/code/claude-code-router-config/cli/ccc.zsh"
   ```

3. **Configure Keys:**
   Create `~/.env` or `~/.ccm_config` with your keys:
   ```bash
   export GLM_API_KEY="your_zai_key_here"
   export DEEPSEEK_API_KEY="your_deepseek_key_here"
   ```

4. **Reload & Run:**
   ```bash
   source ~/.zshrc
   glm        # Launches GLM-4.7 via z.ai
   ccc ds     # Launches DeepSeek
   ccc claude # Launches Official Claude (Pro)
   ```

---

## Features

- **Node.js 16+ Support**: Compatible with modern Node.js environments
- **7 Provider Support**: OpenAI, Anthropic, Gemini, Qwen, GLM, OpenRouter, GitHub Copilot
- **Smart Intent-Based Routing**: Automatically selects the best model based on your request
- **Advanced CLI Tools**: Test, benchmark, analyze, and monitor your setup
- **Analytics & Cost Tracking**: Detailed insights into usage and spending
- **Configuration Templates**: Pre-optimized setups for different use cases
- **Health Monitoring**: Real-time provider status and automatic failover
- **Enhanced Logging**: Detailed logs with metrics and performance data

## Routing Strategy

| Request Type | Provider | Model |
|--------------|----------|-------|
| Code writing, debugging | OpenAI | gpt-4o |
| Deep analysis, architecture | Anthropic | claude-sonnet-4 |
| Quick responses, summaries | Gemini | gemini-2.5-flash |
| Simple tasks | Qwen | qwen-plus |
| Translation, multilingual | GLM | glm-4.7 (z.ai) |
| Complex algorithms | OpenAI | o1 |
| Coding assistance | GitHub Copilot | copilot |

## Installation (Full Router)

### Option 1: PNPM (Recommended)

Use this if you want the full routing capabilities (benchmarking, analytics, etc).

```bash
pnpm add -g @halilertekin/claude-code-router-config
# System is ready! Run: ccr --help
```

Then run the installer to copy config files:

```bash
ccr-setup
```

Non-interactive usage (CI):

```bash
CCR_CONFIG_NO_PROMPT=1 ccr-setup
CCR_CONFIG_OVERWRITE=1 ccr-setup
# or
ccr-setup --overwrite
```

### Option 2: Manual Setup

#### 1. Copy Configuration Files

```bash
mkdir -p ~/.claude-code-router
cp config/config.json ~/.claude-code-router/
cp config/intent-router.js ~/.claude-code-router/
cp config/smart-intent-router.js ~/.claude-code-router/
```

#### 2. Set Up Environment Variables

Create `.env` file:

```bash
cp .env.example ~/.env
# Edit ~/.env with your API keys
```

#### 3. Start Router

```bash
source ~/.zshrc
node router/server.js
```

## API Key Setup

| Provider | Link | Notes |
|----------|------|-------|
| OpenAI | https://platform.openai.com/api-keys | gpt-4o, o1 models |
| Anthropic | https://console.anthropic.com/settings/keys | Claude models |
| Gemini | https://aistudio.google.com/apikey | Google AI models |
| Qwen | https://dashscope.console.aliyun.com/apiKey | Alibaba Cloud |
| GLM (z.ai) | https://open.bigmodel.cn/usercenter/apikeys | Zhipu AI / z.ai |
| OpenRouter | https://openrouter.ai/keys | Multiple models |
| GitHub Copilot | https://github.com/settings/tokens | `copilot` scope |

## Configuration Templates

| Template | Best For | Priority | Cost | Speed |
|----------|----------|----------|------|-------|
| **performance-optimized** | Real-time apps, chatbots | Speed | Low | ⭐⭐⭐⭐⭐ |
| **cost-optimized** | Budget-conscious, bulk processing | Cost | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **quality-focused** | Critical tasks, research | Quality | High | ⭐⭐ |
| **development** | Coding, debugging | Coding | Medium | ⭐⭐⭐⭐ |
| **balanced** | General use | Balanced | Medium | ⭐⭐⭐⭐ |

```bash
# Quick template selection
ccr config template performance-optimized  # Fastest
ccr config template cost-optimized           # Cheapest
ccr config template quality-focused          # Best quality
```

## Analytics Dashboard

View comprehensive analytics via:
```bash
# Web Dashboard (if enabled)
ccr ui

# CLI Analytics
ccr analytics today --detailed
```

Metrics tracked:
- Request volume and patterns
- Cost per provider/model
- Response times and latency
- Success/error rates
- Provider health status

## Documentation

- [Complete Documentation (EN)](docs/FULL_DOCUMENTATION_EN.md)
- [Complete Documentation (TR)](docs/FULL_DOCUMENTATION.md)
- [Setup Prompt (EN)](docs/SETUP_PROMPT_EN.md)
- [Setup Prompt (TR)](docs/SETUP_PROMPT.md)
- [Configuration Templates Guide](templates/README.md)

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---

## 🌟 Show Your Support

If you find this useful, please give it a ⭐ on [GitHub](https://github.com/halilertekin/CC-RouterMultiProvider)!
