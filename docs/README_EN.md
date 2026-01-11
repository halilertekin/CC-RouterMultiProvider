# Claude Code Router - Multi-Provider Setup

Use Claude Code as a single interface to access multiple AI providers with intent-based routing for optimal performance and cost.

## Features

- **6+ Provider Support**: OpenAI, Anthropic, Gemini, Qwen, GLM, OpenRouter, GitHub Copilot
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
| Translation, multilingual | GLM | glm-4.7 |
| Complex algorithms | OpenAI | o1 |
| Coding assistance | GitHub Copilot | copilot |

## Quick Setup

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-router-config.git
cd claude-code-router-config
chmod +x install.sh
./install.sh
```

### One-shot GLM setup (Claude login + GLM API)

```bash
./setup-glm.sh --key "YOUR_GLM_API_KEY"
```
Then run:
```bash
glm        # direct z.ai
glm-ccr    # via local router
```

## Manual Setup

### 1. Install Package

```bash
pnpm add -g @halilertekin/claude-code-router-config
```

### 2. Copy Configuration Files

```bash
mkdir -p ~/.claude-code-router
cp config/config.json ~/.claude-code-router/
cp config/smart-intent-router.js ~/.claude-code-router/
cp config/smart-smart-intent-router.js ~/.claude-code-router/
```

### 3. Set Up Environment Variables

Create `.env` file in your home directory:

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

### 4. Start Router

```bash
source ~/.zshrc  # Reload environment
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
/model glm,glm-4.7
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

## File Structure

```
~/.claude-code-router/
├── config.json          # Provider configuration
├── smart-intent-router.js     # Routing logic
└── logs/                # Log files
```

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

- [Complete Documentation](docs/FULL_DOCUMENTATION_EN.md)
- [Setup Prompt](docs/SETUP_PROMPT_EN.md)

## License

MIT
