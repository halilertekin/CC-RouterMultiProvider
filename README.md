# Claude Code Router Config - Advanced Multi-Provider Setup

🚀 **v1.1.0** - Now with advanced CLI tools, analytics, smart routing, and configuration templates!

Use Claude Code as a single interface to access multiple AI providers with intelligent routing for optimal performance, cost, and quality.

## ✨ New Features in v1.1.0

### 🛠️ Advanced CLI Tools
```bash
ccr test <provider> [model]              # Test provider connectivity
ccr benchmark --compare-speed            # Benchmark all providers
ccr analytics today                      # View usage statistics
ccr config validate                      # Validate configuration
ccr health --all-providers               # Check provider health
```

### 📊 Analytics & Monitoring
- **Cost Tracking**: Monitor spending per provider and model
- **Usage Analytics**: Track requests, latency, and success rates
- **Performance Metrics**: Detailed performance insights
- **Health Monitoring**: Real-time provider health checks

### 🧠 Smart Routing Engine
- **Adaptive Routing**: Learns from past performance
- **Cost-Aware Selection**: Optimizes for budget constraints
- **Performance-Based**: Prioritizes speed when needed
- **Quality-Focused**: Ensures best results for critical tasks

### 📋 Configuration Templates
```bash
ccr config template performance-optimized    # Speed prioritized
ccr config template cost-optimized           # Budget friendly
ccr config template quality-focused          # Maximum quality
ccr config template development             # Coding optimized
ccr config template balanced                # Best of all worlds
```

## Features

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

### 🔧 Advanced CLI Commands

#### Testing & Benchmarking
```bash
# Test provider connectivity
ccr test openai gpt-4o
ccr test anthropic claude-sonnet-4-latest

# Benchmark all providers
ccr benchmark --all --compare-speed
ccr benchmark full 5 --provider=openai --provider=anthropic

# Load testing
ccr benchmark load openai gpt-4o --concurrent=5 --duration=30
```

#### Configuration Management
```bash
# Validate configuration
ccr config validate

# Backup configuration
ccr config backup

# Apply templates
ccr config template performance-optimized
ccr config template cost-optimized
ccr config template quality-focused
ccr config template development
ccr config template balanced

# Show detailed status with costs
ccr status --detailed --show-costs
```

#### Analytics & Monitoring
```bash
# View today's analytics
ccr analytics today --detailed

# View period analytics
ccr analytics week --detailed
ccr analytics month --detailed

# Export data
ccr analytics export --format=csv --period=month

# Health monitoring
ccr health --all-providers
```

### Basic Commands

```bash
ccr start    # Start router
ccr code     # Start with Claude Code
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

## Smart Routing Features

### 🧠 Adaptive Intelligence
- **Learning**: Improves routing based on historical performance
- **Context Awareness**: Considers request complexity and timing
- **Cost Awareness**: Respects budget constraints and optimization goals

### 🔄 Auto-Fallback
- **Health Checks**: Monitors provider status every 30 seconds
- **Circuit Breaker**: Automatically routes around failed providers
- **Graceful Degradation**: Maintains service during provider issues

### 📈 Performance Optimization
- **Latency Tracking**: Monitors and optimizes for speed
- **Success Rate**: Reliability-based routing decisions
- **Load Balancing**: Distributes requests optimally

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

## What's New

### v1.1.0 Features
- ✨ Advanced CLI tools for testing and benchmarking
- 📊 Built-in analytics and cost tracking
- 🧠 Smart routing with machine learning
- 📋 Configuration templates for different use cases
- 🔍 Health monitoring and auto-fallback
- 📝 Enhanced logging with metrics

### Coming Soon
- 🌐 Enhanced web dashboard
- 🔌 Plugin system for custom providers
- 🤖 AI-powered optimization recommendations
- 📱 Mobile-friendly analytics dashboard

## Attribution

This package provides configuration for [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router), an excellent tool that enables Claude Code functionality with multiple AI providers.

The original Claude Code Router project is developed and maintained by musistudio. This package contains pre-configured routing logic, advanced CLI tools, and provider configurations to help users get started quickly and optimize their AI workflows.

## License

MIT © [Halil Ertekin](https://github.com/halilertekin)

---

**Note**: This is an enhanced configuration package. To use it, you need to install the original [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) package.

## 🌟 Show Your Support

If you find this useful, please give it a ⭐ on [GitHub](https://github.com/halilertekin/CC-RouterMultiProvider)!