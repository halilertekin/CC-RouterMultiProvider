# Claude Code Router Config

[![npm version](https://badge.fury.io/js/@halilertekin%2Fclaude-code-router-config.svg)](https://badge.fury.io/js/@halilertekin%2Fclaude-code-router-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Multi-provider configuration for Claude Code Router with intelligent intent-based routing.

## Quick Install

```bash
npm install -g @halilertekin/claude-code-router-config
ccr-setup
```

### One-shot GLM setup (Claude login + GLM API)

```bash
npx -y -p @halilertekin/claude-code-router-config ccr-glm-setup --key "YOUR_GLM_API_KEY"
source ~/.zshrc
glm
```

## Features

- **🤖 7 AI Providers**: OpenAI, Anthropic, Gemini, Qwen, GLM, OpenRouter, GitHub Copilot
- **🎯 Smart Routing**: Automatically selects the best model based on your request
- **💰 Cost Optimized**: Simple tasks use cheaper models
- **⚡ Performance**: Fast responses use optimized models
- **🛠️ Easy Setup**: One-command installation
- **📝 Environment Support**: `.env` file support

## Installation

> [!IMPORTANT]
> Choose only ONE installation method (Homebrew OR NPM) to avoid conflicts.

### Option 1: Homebrew (Recommended for macOS)

```bash
brew install halilertekin/tap/claude-code-router-config
```

### Option 2: NPM / PNPM

```bash
npm install -g @halilertekin/claude-code-router-config
# or
pnpm add -g @halilertekin/claude-code-router-config
```

### Option 3: Manual

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-router-config.git
cd claude-code-router-config
chmod +x install.sh
./install.sh
```

## Setup

After installation:

1. **Edit API keys** in `~/.env`:
   ```bash
   nano ~/.env
   ```

2. **Add to shell** (`~/.zshrc` or `~/.bashrc`):
   ```bash
   # Load .env variables
   export $(cat ~/.env | xargs)

   # Router connection
   export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
   export NO_PROXY="127.0.0.1"
   ```

3. **Reload shell**:
   ```bash
   source ~/.zshrc
   ```

4. **Start router**:
   ```bash
   ccr code
   ```

## API Keys

Get your API keys:

| Provider | Link |
|----------|------|
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic | https://console.anthropic.com/settings/keys |
| Gemini | https://aistudio.google.com/apikey |
| Qwen | https://dashscope.console.aliyun.com/apiKey |
| GLM | https://open.bigmodel.cn/usercenter/apikeys |
| OpenRouter | https://openrouter.ai/keys |
| GitHub Copilot | https://github.com/settings/tokens |

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

### Smart Routing Examples

```bash
# Coding → OpenAI
claude "Write a Python sorting function"

# Analysis → Anthropic
claude "Explain microservices architecture"

# Quick summary → Gemini
claude "Quick summary of REST APIs"

# Simple task → Qwen
claude "List files in directory"

# Translation → GLM
claude "Translate to Chinese: Hello"

# Coding help → GitHub Copilot
claude "Help me debug this React component"
```

## Configuration Files

The installer creates:

```
~/.claude-code-router/
├── config.json          # Provider configuration
├── intent-router.js     # Smart routing logic
└── logs/                # Log files

~/.env                   # API keys (created from .env.example)
```

## Documentation

- [Complete Documentation](https://github.com/halilertekin/claude-code-router-config/docs/FULL_DOCUMENTATION_EN.md)
- [GitHub Repository](https://github.com/halilertekin/claude-code-router-config)

## Attribution

This package provides configuration for [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router), the original tool that enables Claude Code functionality with multiple AI providers.

The original Claude Code Router project is developed and maintained by musistudio. This package contains pre-configured routing logic and provider configurations.

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---

**Note**: This is a configuration package. Requires the original [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) to function.
