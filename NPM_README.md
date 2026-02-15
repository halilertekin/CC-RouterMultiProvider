# Claude Code Router Config

[![npm version](https://badge.fury.io/js/@halilertekin%2Fclaude-code-router-config.svg)](https://badge.fury.io/js/@halilertekin%2Fclaude-code-router-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Multi-provider configuration for Claude Code Router with intelligent intent-based routing.

## v2.4.2 - GitHub Packages

Now supports **GLM-5** with two endpoint options:

| Alias | Endpoint | Use Case |
|-------|----------|----------|
| `glm` | z.ai Coding Plan | Subscription-based coding |
| `glmapi` | z.ai API Credits | Pay-per-use with credits |

## Quick Install

```bash
npm install -g @halilertekin/claude-code-router-config
ccr-setup
```

### Non-interactive install (CI)

If you run in CI or without a TTY, the installer skips existing config files by default.

```bash
# Skip prompts (CI-friendly)
CCR_CONFIG_NO_PROMPT=1 ccr-setup

# Force overwrite existing config files
CCR_CONFIG_OVERWRITE=1 ccr-setup
# or
ccr-setup --overwrite
```

### One-shot GLM setup (z.ai GLM API)

```bash
npx -y -p @halilertekin/claude-code-router-config ccr-glm-setup --key "YOUR_GLM_API_KEY"
source ~/.zshrc
glm        # GLM-5 via Coding Plan
glmapi     # GLM-5 via API Credits
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
   # Load .env variables (safe with comments)
   set -a
   source ~/.env
   set +a

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
   ccr start
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
| GLM (z.ai) | https://z.ai/apikeys |
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
/model glm,glm-5
/model glmapi,glm-5
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

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---
