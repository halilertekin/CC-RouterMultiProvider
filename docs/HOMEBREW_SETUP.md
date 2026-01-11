# Homebrew Setup Documentation

## Overview

This document explains how to set up and use the custom Homebrew tap for installing `claude-code-router-config`. The custom tap allows easy installation of the multi-provider AI routing configuration with intent-based routing support.

## Custom Tap Details

**Tap Repository**: https://github.com/halilertekin/homebrew-tap
**Formula**: `claude-code-router-config`
**Main Repository**: https://github.com/halilertekin/CC-RouterMultiProvider

## Installation Instructions

### Prerequisites

- macOS with [Homebrew](https://brew.sh/) installed
- An Anthropic API key (for Claude models)
- Optional API keys for other providers (OpenAI, Gemini, Qwen, GLM, OpenRouter, GitHub Copilot)

### Step 1: Add the Custom Tap

```bash
# Add the custom tap to your Homebrew installation
brew tap halilertekin/homebrew-tap
```

### Step 2: Install the Package

```bash
# Install claude-code-router-config
brew install claude-code-router-config
```

### Step 3: Configure API Keys

The installer automatically creates configuration files and an `.env.example` file. You need to:

1. **Edit your environment variables:**
   ```bash
   nano ~/.env
   ```

2. **Add your API keys:**
   ```bash
   # Required for Claude models
   export ANTHROPIC_API_KEY="your_anthropic_api_key_here"

   # Optional - Add other providers
   export OPENAI_API_KEY="your_openai_api_key_here"
   export GEMINI_API_KEY="your_gemini_api_key_here"
   export QWEN_API_KEY="your_qwen_api_key_here"
   export GLM_API_KEY="your_glm_api_key_here"
   export OPENROUTER_API_KEY="your_openrouter_api_key_here"
   export GITHUB_TOKEN="your_github_token_here"
   ```

3. **Add to shell configuration:**
   ```bash
   # Add to ~/.zshrc or ~/.bashrc (safe .env load)
   set -a
   source ~/.env
   set +a
   export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
   export NO_PROXY="127.0.0.1"
   ```

4. **Reload your shell:**
   ```bash
   source ~/.zshrc
   # or
   source ~/.bashrc
   ```

### Step 4: Start the Router

```bash
# Start the Claude Code Router
ccr code
```

## What Gets Installed

The Homebrew formula installs the following components:

### 1. Core Package

### 2. Configuration Files
- **`~/.claude-code-router/config.json`**: Multi-provider configuration with 7 AI providers
- **`~/.claude-code-router/smart-intent-router.js`**: Intelligent intent-based routing logic

### 3. Environment Template
- **`~/.env`**: Environment variables file (created from `.env.example`)

## Supported AI Providers

The configuration supports 7 AI providers:

1. **OpenAI**: GPT-4o, GPT-4 Turbo, O1, O1-mini
2. **Anthropic**: Claude Sonnet 4, Claude 3.5 Sonnet
3. **Gemini**: Gemini 2.5 Flash, Gemini 2.5 Pro
4. **Qwen**: Qwen Plus, Qwen Max
5. **GLM**: GLM-4.6, GLM-4.5
6. **OpenRouter**: Multiple models via OpenRouter
7. **GitHub Copilot**: Code assistance

## Intent-Based Routing

The router automatically routes requests to the most appropriate provider based on the task type:

- **Coding tasks** → OpenAI (GPT-4o/O1)
- **Deep reasoning** → Anthropic Claude
- **Fast responses** → Gemini Flash
- **Simple tasks** → Qwen
- **Multilingual** → GLM
- **Heavy reasoning** → OpenAI O1
- **Coding assistance** → GitHub Copilot

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   ```bash
   # Fix permissions on config directory
   sudo chown -R $USER:$USER ~/.claude-code-router
   chmod 755 ~/.claude-code-router
   ```

2. **pnpm Not Found**
   ```bash
   # Install pnpm
   brew install pnpm

   # Or the formula automatically falls back to npm
   ```

3. **Environment Variables Not Loading**
   ```bash
   # Verify .env file exists
   ls -la ~/.env

   # Manually source environment
   set -a
   source ~/.env
   set +a
   ```

4. **Router Fails to Start**
   ```bash
   # Check configuration files
   ls -la ~/.claude-code-router/

   # Verify config syntax
   node -c ~/.claude-code-router/smart-intent-router.js
   ```

5. **API Key Issues**
   ```bash
   # Test API key
   curl -X POST https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "content-type: application/json" \
     -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
   ```

### Getting Help

1. **Check logs**: The router provides detailed logging information
2. **Verify configuration**: Ensure all JSON files are valid
3. **Test providers individually**: Use direct API calls to test each provider
4. **Check network connectivity**: Ensure you can reach the provider APIs

## Updating the Installation

To update to the latest version:

```bash
# Update the tap
brew update

# Upgrade the package
brew upgrade claude-code-router-config

# Or reinstall for clean setup
brew reinstall claude-code-router-config
```

## Uninstallation

To completely remove the installation:

```bash
# Uninstall the package
brew uninstall claude-code-router-config

# Remove configuration files (optional)
rm -rf ~/.claude-code-router

# Remove environment variables from ~/.zshrc or ~/.bashrc
# Remove the tap (optional)
brew untap halilertekin/homebrew-tap
```

## Advanced Configuration

### Custom Intent Patterns

Edit `~/.claude-code-router/smart-intent-router.js` to add custom routing patterns:

```javascript
// Add custom intent
CUSTOM_TASK: {
  patterns: [/\b(custom|special|specific)\b/i],
  route: "openai,gpt-4o"
}
```

### Provider Priority

Modify the routing order in `~/.claude-code-router/config.json`:

```json
"Router": {
  "default": "anthropic,claude-sonnet-4-latest",
  "background": "qwen,qwen-turbo",
  "think": "openai,o1"
}
```

## Performance Tips

1. **Use appropriate models**: Choose the right model for each task
2. **Set timeouts**: Configure appropriate API timeouts
3. **Monitor usage**: Track token usage and costs
4. **Cache results**: Use caching for repeated requests

## Security Considerations

1. **Protect API keys**: Never commit API keys to version control
2. **Use environment variables**: Keep sensitive data in `.env`
3. **Regular key rotation**: Rotate API keys periodically
4. **Audit logs**: Monitor router logs for unusual activity

## Support

- **Main Repository**: https://github.com/halilertekin/CC-RouterMultiProvider
- **Issues**: Report issues via GitHub
- **Documentation**: See `docs/` directory for comprehensive guides

## Attribution

Configuration by Halil Ertekin
