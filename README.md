# Claude Code Router - Multi-Provider Setup

Use Claude Code as a single interface to access multiple AI providers with intent-based routing for optimal performance and cost.

## Features

- **7 Provider Support**: OpenAI, Anthropic, Gemini, Qwen, GLM, OpenRouter, GitHub Copilot
- **Intent-Based Routing**: Automatically selects the best model based on your request
- **Cost Optimization**: Simple tasks go to cheaper models
- **Performance Optimization**: Fast responses use optimized models

## Routing Strategy

| Request Type | Provider | Model |
|--------------|----------|-------|
| Code writing, debugging | OpenAI | gpt-4o |
| Deep analysis, architecture | Anthropic | claude-sonnet-4 |
| Quick responses, summaries | Gemini | gemini-2.5-flash |
| Simple tasks | Qwen | qwen-plus |
| Translation, multilingual | GLM | glm-4.6 |
| Complex algorithms | OpenAI | o1 |
| Coding assistance | GitHub Copilot | copilot |

## Installation

### Option 1: Homebrew (Recommended)

```bash
brew install halilertekin/tap/claude-code-router-config
```

After installation, edit your API keys in `~/.env` and start the router:
```bash
ccr code
```

### Option 2: NPM

```bash
pnpm add -g claude-code-router-config
ccr-setup
```

### Option 3: Manual Setup

#### 1. Install Dependencies

```bash
pnpm add -g @musistudio/claude-code-router
```

#### 2. Copy Configuration Files

```bash
mkdir -p ~/.claude-code-router
cp config/config.json ~/.claude-code-router/
cp config/intent-router.js ~/.claude-code-router/
```

#### 3. Set Up Environment Variables

Create `.env` file:

```bash
cp .env.example ~/.env
# Edit ~/.env with your API keys
```

Or add to `~/.zshrc` / `~/.bashrc`:

```bash
# Claude Code Router - API Keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIza..."
export QWEN_API_KEY="sk-..."
export GLM_API_KEY="..."
export OPENROUTER_API_KEY="sk-or-..."
export GITHUB_COPIOT_API_KEY="ghu_..."

# Router Connection
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export NO_PROXY="127.0.0.1"
```

#### 4. Start Router

```bash
source ~/.zshrc
ccr code
```

## Usage

### Basic Commands

```bash
ccr start    # Start router
ccr code     # Start with Claude Code
ccr status   # Check status
ccr stop     # Stop router
```

### Switch Models (Runtime)

Inside Claude Code:

```
/model openai,gpt-4o
/model anthropic,claude-sonnet-4-latest
/model gemini,gemini-2.5-flash
/model qwen,qwen-plus
/model glm,glm-4.6
/model copilot,copilot
```

## API Key Setup

| Provider | Link | Notes |
|----------|------|-------|
| OpenAI | https://platform.openai.com/api-keys | gpt-4o, o1 models |
| Anthropic | https://console.anthropic.com/settings/keys | Claude models |
| Gemini | https://aistudio.google.com/apikey | Google AI models |
| Qwen | https://dashscope.console.aliyun.com/apiKey | Alibaba Cloud |
| GLM | https://open.bigmodel.cn/usercenter/apikeys | Zhipu AI |
| OpenRouter | https://openrouter.ai/keys | Multiple models |
| GitHub Copilot | https://github.com/settings/tokens | `copilot` scope |

## Testing

```bash
# Test different routing scenarios
claude "Write a Python sorting function"      # → OpenAI
claude "Explain microservices architecture" # → Anthropic
claude "Quick summary of REST APIs"        # → Gemini
claude "List files in current directory"    # → Qwen
claude "Translate to Chinese: Hello"        # → GLM
claude "Help me debug this React component" # → GitHub Copilot
```

## Documentation

- [Complete Documentation (EN)](docs/FULL_DOCUMENTATION_EN.md)
- [Setup Prompt (EN)](docs/SETUP_PROMPT_EN.md)
- [Setup Prompt (TR)](docs/SETUP_PROMPT.md)

## Attribution

This package provides configuration for [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router), an excellent tool that enables Claude Code functionality with multiple AI providers.

The original Claude Code Router project is developed and maintained by musistudio. This package contains pre-configured routing logic and provider configurations to help users get started quickly.

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---

**Note**: This is a configuration package. To use it, you need to install the original [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) package.