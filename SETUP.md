# Claude Code Router - Setup Guide / Kurulum Rehberi

> **Türkçe** | [English](#english)

## Kullanım

```bash
# .zshrc dosyanıza ekleyin:
source ~/code/claude-code-router-config/cli/ccc.zsh
```

## Alias'lar

| Komut | Provider | Endpoint | Model |
|-------|----------|----------|-------|
| `glm` | z.ai Coding Plan | `api.z.ai/api/coding/paas/v4` | GLM-5 |
| `glmapi` | z.ai API (Kredi) | `api.z.ai/api/paas/v4` | GLM-5 |
| `claude-pro` | Anthropic Claude Pro | Official API | Claude Sonnet 4.5 |
| `deepseek` | DeepSeek | `api.deepseek.com/anthropic` | deepseek-chat |

## API Key Kurulumu

### 1. z.ai (GLM) API Key

`~/.env` dosyanıza ekleyin:

```bash
export GLM_API_KEY="your_z.ai_api_key_here"
```

Key almak için: https://z.ai/apikeys

### 2. Claude Pro

Claude Pro kullanıcıları `claude login` ile giriş yapabilir veya:

```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key"
```

### 3. DeepSeek (opsiyonel)

```bash
export DEEPSEEK_API_KEY="your_deepseek_api_key"
```

## Örnek Kullanım

```bash
# Coding Plan ile GLM-5 kullan
glm

# API kredisi ile GLM-5 kullan
glmapi

# Claude Pro kullan
claude-pro

# DeepSeek kullan
deepseek
```

## Dosya Yapısı

```
claude-code-router-config/
├── cli/
│   └── ccc.zsh          # Ana konfigürasyon dosyası
├── config/              # Model konfigürasyonları
├── router/              # Routing mantığı
└── docs/               # Dokümantasyon
```

## Sorun Giderme

### "GLM_API_KEY not set" hatası
- `~/.env` dosyasında key'in doğru olduğundan emin olun
- Dosyayı kaydettikten sonra terminali yeniden açın veya `source ~/.env` yapın

### Model çalışmıyorsa
- API key'in geçerli olduğunu kontrol edin
- Kotalarınızı kontrol edin (özellikle glmapi için)

---

<a name="english"></a>

## Usage

```bash
# Add to your .zshrc:
source ~/code/claude-code-router-config/cli/ccc.zsh
```

## Aliases

| Command | Provider | Endpoint | Model |
|---------|----------|----------|-------|
| `glm` | z.ai Coding Plan | `api.z.ai/api/coding/paas/v4` | GLM-5 |
| `glmapi` | z.ai API (Credits) | `api.z.ai/api/paas/v4` | GLM-5 |
| `claude-pro` | Anthropic Claude Pro | Official API | Claude Sonnet 4.5 |
| `deepseek` | DeepSeek | `api.deepseek.com/anthropic` | deepseek-chat |

## API Key Setup

### 1. z.ai (GLM) API Key

Add to your `~/.env`:

```bash
export GLM_API_KEY="your_z.ai_api_key_here"
```

Get your key from: https://z.ai/apikeys

### 2. Claude Pro

Claude Pro users can login with `claude login` or:

```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key"
```

### 3. DeepSeek (optional)

```bash
export DEEPSEEK_API_KEY="your_deepseek_api_key"
```

## Example Usage

```bash
# Use GLM-5 with Coding Plan
glm

# Use GLM-5 with API credits
glmapi

# Use Claude Pro
claude-pro

# Use DeepSeek
deepseek
```

## File Structure

```
claude-code-router-config/
├── cli/
│   └── ccc.zsh          # Main configuration file
├── config/              # Model configurations
├── router/              # Routing logic
└── docs/               # Documentation
```

## Troubleshooting

### "GLM_API_KEY not set" error
- Make sure the key in `~/.env` is correct
- After saving, restart terminal or run `source ~/.env`

### Model not working
- Check if your API key is valid
- Check your quotas (especially for glmapi)
