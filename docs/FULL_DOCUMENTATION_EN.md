# Claude Code Router - Complete Documentation

> **Version**: 1.0.73
> **Date**: 2025-12-20
> **Purpose**: Multi-provider AI routing through Claude Code with intent-based selection

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Supported Providers](#supported-providers)
4. [Routing Strategy](#routing-strategy)
5. [Installation](#installation)
6. [Configuration Details](#configuration-details)
7. [Intent Router Logic](#intent-router-logic)
8. [Usage Guide](#usage-guide)
9. [Troubleshooting](#troubleshooting)
10. [API Key Setup Guide](#api-key-setup-guide)

---

## Overview

Claude Code Router acts as a proxy that intercepts Claude Code CLI requests and routes them to different AI providers based on intent analysis. This provides:

- **Cost Optimization**: Simple tasks route to cheaper models
- **Performance Optimization**: Quick responses use fast models
- **Capability Optimization**: Each task uses the most suitable model
- **Single Interface**: Access all models through Claude Code

---

## Architecture

```
┌─────────────────┐
│   Claude Code   │
│   (CLI/UI)      │
└────────┬────────┘
         │ localhost:3456
         ▼
┌─────────────────┐
│  Claude Code    │
│    Router       │
│  (Proxy Server) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────────┐ ┌───────────┐
│OpenAI │ │Anthro │ │Gemini │ │ Qwen  │ │  GLM  │ │OpenRouter │ │ Copilot    │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────────┘ └───────────┘
```

### Flow

1. User sends request to Claude Code
2. Request goes to `localhost:3456` (router)
3. Router analyzes intent using `smart-intent-router.js`
4. Request is routed to appropriate provider
5. Response is returned to user

---

## Supported Providers

### 1. OpenAI
| Feature | Value |
|---------|-------|
| **API URL** | `https://api.openai.com/v1/chat/completions` |
| **Models** | gpt-4o, gpt-4-turbo, gpt-4o-mini, o1, o1-mini |
| **Use Case** | Coding, debugging, refactoring |
| **Cost** | Medium-High |
| **Env Var** | `OPENAI_API_KEY` |

### 2. Anthropic (Claude)
| Feature | Value |
|---------|-------|
| **API URL** | `https://api.anthropic.com/v1/messages` |
| **Models** | claude-sonnet-4-latest, claude-3-5-sonnet-latest |
| **Use Case** | Deep reasoning, architecture, analysis |
| **Cost** | High |
| **Env Var** | `ANTHROPIC_API_KEY` |
| **Transformer** | `Anthropic` (required) |

### 3. Google Gemini
| Feature | Value |
|---------|-------|
| **API URL** | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| **Models** | gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash |
| **Use Case** | Fast responses, long context (1M token) |
| **Cost** | Low-Medium |
| **Env Var** | `GEMINI_API_KEY` |
| **Transformer** | `gemini` (required) |

### 4. Alibaba Qwen (DashScope)
| Feature | Value |
|---------|-------|
| **API URL** | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` |
| **Models** | qwen-plus, qwen-max, qwen3-coder-plus, qwen-turbo |
| **Use Case** | Cheap coding, simple tasks |
| **Cost** | Very Low |
| **Env Var** | `QWEN_API_KEY` |

### 5. Zhipu GLM (Z.ai)
| Feature | Value |
|---------|-------|
| **API URL** | `https://api.z.ai/api/coding/paas/v4/chat/completions` |
| **Models** | glm-4.7, glm-4.6, glm-4.5, glm-4-plus |
| **Use Case** | Multilingual, Chinese, translation |
| **Cost** | Low |
| **Env Var** | `GLM_API_KEY` |

### 6. OpenRouter
| Feature | Value |
|---------|-------|
| **API URL** | `https://openrouter.ai/api/v1/chat/completions` |
| **Models** | All models (Claude, GPT, Gemini, Llama, DeepSeek...) |
| **Use Case** | Fallback, variety |
| **Cost** | Variable |
| **Env Var** | `OPENROUTER_API_KEY` |
| **Transformer** | `openrouter` (required) |

### 7. GitHub Copilot
| Feature | Value |
|---------|-------|
| **API URL** | Custom implementation |
| **Models** | copilot |
| **Use Case** | Coding assistance, IntelliSense |
| **Cost** | Low (with subscription) |
| **Env Var** | `GITHUB_COPIOT_API_KEY` |

---

## Routing Strategy

### Automatic Intent-Based Routing

| Intent | Trigger Words | Provider | Model |
|--------|----------------|----------|-------|
| **CODING** | implement, refactor, debug, fix, code, function, class, typescript, python, api, database | OpenAI | gpt-4o |
| **REASONING** | architect, design, analyze, plan, why, explain, compare, evaluate, best practice | Anthropic | claude-sonnet-4 |
| **FAST** | fast, quick, brief, summary, tldr, overview, scan, check | Gemini | gemini-2.5-flash |
| **SIMPLE** | list, show, what is, simple, basic, help, format, rename, mkdir | Qwen | qwen-plus |
| **MULTILINGUAL** | translate, translate, multilingual, Chinese characters | GLM | glm-4.7 |
| **HEAVY_REASONING** | complex algorithm, optimization, performance critical, prove, mathematical | OpenAI | o1 |
| **CODING_ASSIST** | help me code, fix this error, suggest improvement, refactor | GitHub Copilot | copilot |

### Built-in Router Settings

| Scenario | Provider | Model | Description |
|----------|----------|-------|-------------|
| **default** | OpenAI | gpt-4o | When no match |
| **background** | Qwen | qwen-turbo | Background tasks |
| **think** | Anthropic | claude-sonnet-4 | Reasoning tasks |
| **longContext** | Gemini | gemini-2.5-flash | >60K tokens |

---

## Installation

### Requirements
- Node.js 18+
- pnpm (preferred) or npm

### Option 1: Homebrew (Recommended)

```bash
brew install halilertekin/tap/claude-code-router-config
```

The Homebrew installation handles everything automatically:
- Copies configuration files
- Creates ~/.env with templates
- Provides next-step instructions

### Option 2: NPM Package

```bash
pnpm add -g @halilertekin/claude-code-router-config
ccr-setup
```

### Option 3: Manual Installation

#### Step 1: Install Package

```bash
pnpm add -g @halilertekin/claude-code-router-config
mkdir -p ~/.claude-code-router
```

#### Step 2: Environment Variables

Option 1: Create `.env` file:

```bash
cp .env.example ~/.env
# Edit ~/.env with your API keys
```

Option 2: Add to `~/.zshrc` or `~/.bashrc`:

```bash
# ═══════════════════════════════════════════════════
# Claude Code Router - API Keys
# ═══════════════════════════════════════════════════
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

### Step 3: Reload Shell

```bash
source ~/.zshrc
```

### Step 4: Start

```bash
ccr code
```

---

## Configuration Details

### config.json Structure

```json
{
  "LOG": true,                    // Enable logging
  "LOG_LEVEL": "info",            // Log level: fatal|error|warn|info|debug|trace
  "API_TIMEOUT_MS": 300000,       // 5 minute timeout
  "CUSTOM_ROUTER_PATH": "$HOME/.claude-code-router/smart-intent-router.js",

  "Providers": [
    {
      "name": "provider_name",           // Unique name
      "api_base_url": "https://...",    // API endpoint
      "api_key": "$ENV_VAR",            // Environment variable reference
      "models": ["model1", "model2"],   // Supported models
      "transformer": { "use": [] }      // Required transformers
    }
  ],

  "Router": {
    "default": "provider,model",        // Default route
    "background": "provider,model",     // Background tasks
    "think": "provider,model",          // Reasoning tasks
    "longContext": "provider,model",    // Long context
    "longContextThreshold": 60000       // Token threshold
  }
}
```

### Transformers

| Transformer | Usage |
|-------------|-------|
| `Anthropic` | Anthropic API format |
| `gemini` | Google Gemini API format |
| `openrouter` | OpenRouter API format |
| `deepseek` | DeepSeek models |
| `maxtoken` | Max token limit setting |

---

## Intent Router Logic

### Working Principle

1. Request arrives
2. Message content is extracted (user + system messages)
3. Pattern matching is counted for each intent
4. Intent with highest score is selected
5. Request is routed to relevant provider

### Pattern Priority

1. **HEAVY_REASONING** - Complex algorithms
2. **CODING** - Code writing/debugging
3. **CODING_ASSIST** - Coding help
4. **REASONING** - Analysis/explanation
5. **MULTILINGUAL** - Translation
6. **FAST** - Quick responses
7. **SIMPLE** - Simple tasks

### Customization

Edit `smart-intent-router.js` to:
- Add new intents
- Modify patterns
- Update routes

---

## Usage Guide

### Basic Commands

```bash
# Start router
ccr start

# Start with Claude Code
ccr code

# Check status
ccr status

# Stop router
ccr stop

# Restart router
ccr restart

# Open web UI
ccr ui

# Model selection interface
ccr model
```

### Runtime Model Switching

Inside Claude Code using `/model` command:

```
/model openai,gpt-4o
/model openai,o1
/model anthropic,claude-sonnet-4-latest
/model gemini,gemini-2.5-flash
/model gemini,gemini-2.5-pro
/model qwen,qwen-plus
/model qwen,qwen3-coder-plus
/model glm,glm-4.7
/model openrouter,deepseek/deepseek-chat
/model copilot,copilot
```

### Example Usage Scenarios

```bash
# Coding → OpenAI gpt-4o
claude "Write a Python function to implement merge sort"

# Deep Analysis → Anthropic Claude
claude "Analyze the trade-offs between microservices and monolith architecture"

# Quick Summary → Gemini Flash
claude "Give me a quick summary of GraphQL vs REST"

# Simple Task → Qwen
claude "List all TypeScript files in src directory"

# Translation → GLM
claude "Translate this to Chinese: Hello, how are you?"

# Complex Algorithm → OpenAI O1
claude "Design an optimal caching algorithm for a distributed system"

# Coding Assistance → GitHub Copilot
claude "Help me debug this React component error"
```

### Monitor Logs

```bash
# All logs
tail -f ~/.claude-code-router/logs/*.log

# Only routing decisions
tail -f ~/.claude-code-router/logs/*.log | grep "Router"
```

---

## Troubleshooting

### Router Not Starting

```bash
# Check if port is in use
lsof -i :3456

# Kill if needed
kill -9 <PID>

# Restart
ccr start
```

### API Errors

1. Check API keys:
```bash
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
# ... others
```

2. Test API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Model Not Found Error

Check model names in `config.json`:
- OpenAI: `gpt-4o` (not `gpt-4-o`)
- Anthropic: `claude-sonnet-4-latest`
- Gemini: `gemini-2.5-flash`

### Routing Not Working

1. Check custom router loaded:
```bash
cat ~/.claude-code-router/config.json | grep CUSTOM_ROUTER
```

2. Check router file exists:
```bash
ls -la ~/.claude-code-router/smart-intent-router.js
```

3. Check for syntax errors:
```bash
node -c ~/.claude-code-router/smart-intent-router.js
```

---

## API Key Setup Guide

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy key (starts with `sk-...`)

### Anthropic
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy key (starts with `sk-ant-...`)

### Google Gemini
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy key (starts with `AIza...`)

### Alibaba Qwen (DashScope)
1. Go to https://dashscope.console.aliyun.com/apiKey
2. Create Aliyun account (international)
3. Get API key

### Zhipu GLM (Z.ai)
1. Go to https://open.bigmodel.cn/usercenter/apikeys
2. Create account
3. Get API key

### OpenRouter
1. Go to https://openrouter.ai/keys
2. Sign in with GitHub/Google
3. Click "Create Key"
4. Copy key (starts with `sk-or-...`)

### GitHub Copilot
1. Go to https://github.com/settings/tokens
2. Generate new token
3. Select `copilot` scope
4. Copy token (starts with `ghu_...`)

---

## File Structure

```
~/.claude-code-router/
├── config.json              # Main configuration
├── smart-intent-router.js         # Custom routing logic
├── README.md                # Quick documentation
├── FULL_DOCUMENTATION.md    # This file
└── logs/                    # Log files
    └── *.log
```

---

## Notes

- Router always runs on `localhost:3456`
- `ANTHROPIC_BASE_URL` enables Claude Code to connect to router
- `NO_PROXY` prevents system proxy from blocking router
- Environment variables can be used in config.json with `$VAR_NAME` format

---

## Attribution



## Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [DashScope Docs](https://www.alibabacloud.com/help/en/model-studio)
- [Z.ai Docs](https://docs.z.ai)
- [GitHub Copilot API](https://docs.github.com/en/copilot)
