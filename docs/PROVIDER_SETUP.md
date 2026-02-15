# Provider Setup Guide / Provider Kurulum Rehberi

[English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## English | Provider Setup Guide

### Overview

Claude Code Router supports multiple AI providers with intelligent routing. You can use one or more providers simultaneously, and the router will automatically switch between them based on cost, performance, and quality.

### Current Architecture

```
Request → Smart Intent Router → Provider Selection → AI Response
                ↓                    ↓
          Intent Analysis       GLM-5 (Primary)
          (Cost Optimized)      Claude Pro (Quality)
                                DeepSeek (Budget)
                                MiniMax (Long Context)
                                Qwen (Fallback)
                                Gemini (Backup)
                                OpenAI (Premium)
```

### Quick Start

1. **Install & Setup**
```bash
npm install -g @halilertekin/claude-code-router-config
ccr-setup
```

2. **Configure API Keys**
```bash
# Edit your .env file
nano ~/.env
```

3. **Start Router**
```bash
ccr start    # Start router server
ccr code     # Start router + Claude Code
```

---

### Available Providers

| Provider | API Base URL | Cost (per 1M tokens) | Best For |
|----------|-------------|---------------------|----------|
| **GLM-5 (z.ai)** | `api.z.ai/api/coding/paas/v4` | ~$0.50 | Coding Plan (3x usage) |
| **GLM API (z.ai)** | `api.z.ai/api/paas/v4` | ~$0.50 | Pay-per-use |
| **Claude Pro** | Official Anthropic | ~$3.00 | Premium quality |
| **DeepSeek** | `api.deepseek.com/anthropic` | ~$0.60 | Budget coding |
| **MiniMax** | `api.minimax.io/anthropic` | ~$0.30 | Long context (200k+) |
| **Qwen** | `dashscope-intl.aliyuncs.com/...` | ~$0.10 | Cost-optimized |
| **Gemini** | `generativelanguage.googleapis.com/...` | ~$0.01 | Fast responses |
| **OpenAI** | `api.openai.com/v1/...` | ~$2.50 | Premium quality |

---

### Adding Providers

#### Step 1: Get API Key

**GLM-5 (z.ai) - Recommended**
- Website: https://z.ai/apikeys
- Pricing: Very competitive, 3x usage with Coding Plan
- Sign up → Create API Key
- Two endpoints:
  - Coding Plan: `https://api.z.ai/api/coding/paas/v4`
  - API Credits: `https://api.z.ai/api/paas/v4`

**MiniMax**
- Website: https://platform.minimax.io/
- Pricing: Very competitive, ultra-long context (200k+ tokens)
- Sign up → Create API Key

**DeepSeek**
- Website: https://platform.deepseek.com/
- Pricing: Affordable
- Sign up → Create API Key

**Qwen (Alibaba)**
- Website: https://dashscope-intl.aliyuncs.com/
- Pricing: https://dashscope-intl.aliyuncs.com/pricing
- Sign up → Create API Key

**Gemini (Google)**
- Website: https://ai.google.dev/
- Pricing: Free tier available
- Sign up → Create API Key

**OpenAI**
- Website: https://platform.openai.com/
- Pricing: https://openai.com/pricing
- Sign up → Create API Key

**Anthropic**
- Website: https://console.anthropic.com/
- Pricing: https://anthropic.com/pricing
- Sign up → Create API Key

**OpenRouter**
- Website: https://openrouter.ai/
- Pricing: Varies by model
- Sign up → Create API Key

#### Step 2: Add to `.env` File

Edit `~/.env`:

```bash
# Primary Provider (GLM - Recommended)
export GLM_API_KEY="your_glm_api_key_here"

# Additional Providers (Optional - for routing)
export QWEN_API_KEY="your_qwen_api_key_here"
export GEMINI_API_KEY="your_gemini_api_key_here"
export OPENAI_API_KEY="your_openai_api_key_here"
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
export OPENROUTER_API_KEY="your_openrouter_api_key_here"
```

#### Step 3: Verify Setup

```bash
# Check configuration
ccr status --detailed

# Test provider connection
ccr test glm
ccr test qwen
ccr test gemini

# Benchmark providers
ccr benchmark --all --compare-speed
```

---

### Inter-Provider Routing

The router automatically switches between providers based on:

1. **Intent Analysis**
   - Coding tasks → GLM (cost-effective)
   - Reasoning → GLM with fallback to Qwen
   - Fast responses → GLM or Gemini
   - Complex tasks → OpenAI with fallback

2. **Cost Optimization**
   - Primary: GLM (~$0.50/1M tokens)
   - Fallback 1: Qwen (~$0.10/1M tokens)
   - Fallback 2: Gemini (~$0.01/1M tokens)
   - Premium: OpenAI/Anthropic (when quality needed)

3. **Health Monitoring**
   - If provider fails → automatic fallback
   - Performance tracking → optimal provider selection
   - Cost tracking → budget management

#### Routing Flow Example

```
User Request: "Help me refactor this code"
     ↓
Intent Router: CODING intent detected
     ↓
Provider Selection: glm,glm-5 (primary)
     ↓
Try GLM → Success ✅
     OR
Try GLM → Failure ❌ → Fallback to Qwen ✅
```

---

### Configuration Examples

#### Example 1: Cost-Optimized Setup (GLM Only)

```json
{
  "Router": {
    "default": "glm,glm-5",
    "fallbacks": ["qwen,qwen-plus", "gemini,gemini-2.5-flash"]
  }
}
```

`.env`:
```bash
export GLM_API_KEY="your_key"
# No other keys needed - GLM handles everything
```

#### Example 2: Multi-Provider Setup (With Routing)

```json
{
  "Router": {
    "default": "glm,glm-5",
    "fallbacks": ["qwen,qwen-plus", "gemini,gemini-2.5-flash", "openai,gpt-4o"]
  }
}
```

`.env`:
```bash
export GLM_API_KEY="your_glm_key"
export QWEN_API_KEY="your_qwen_key"
export GEMINI_API_KEY="your_gemini_key"
export OPENAI_API_KEY="your_openai_key"
```

#### Example 3: Quality-Optimized Setup (Premium)

```json
{
  "Router": {
    "default": "anthropic,claude-sonnet-4-latest",
    "fallbacks": ["openai,gpt-4o", "glm,glm-5"]
  }
}
```

`.env`:
```bash
export ANTHROPIC_API_KEY="your_anthropic_key"
export OPENAI_API_KEY="your_openai_key"
export GLM_API_KEY="your_glm_key"
```

---

### Advanced: Custom Routing Rules

Edit `~/.claude-code-router/smart-intent-router.js`:

```javascript
// Custom routing based on your needs
CODING: {
  patterns: [/\b(coding|debug|refactor)\b/i],
  route: "glm,glm-5",           // Primary
  fallbacks: [
    "qwen,qwen3-coder-plus",      // Fallback 1
    "openai,gpt-4o"               // Fallback 2 (premium)
  ]
}
```

---

### Troubleshooting

**Issue: Provider not working**
```bash
# Check if API key is set
echo $GLM_API_KEY

# Test connection
ccr test glm

# Check logs
tail -f ~/.claude-code-router/logs/app.log
```

**Issue: Always using same provider**
```bash
# Check router config
cat ~/.claude-code-router/config.json | jq '.Router'

# Verify intent router
cat ~/.claude-code-router/smart-intent-router.js
```

**Issue: High costs**
```bash
# Check analytics
ccr analytics --today

# Verify cost optimization is enabled
ccr status --detailed --show-costs
```

---

### Cost Comparison

| Task | Claude Sonnet 4.5 | GLM 4.7 | Savings |
|------|-------------------|---------|---------|
| 100K coding tasks | $300 | $50 | **83%** |
| 1M tokens input | $3.00 | $0.50 | **83%** |
| 1M tokens output | $15.00 | $2.00 | **87%** |

---

<a name="türkçe"></a>
---
## Türkçe | Provider Kurulum Rehberi

### Genel Bakış

Claude Code Router, birden fazla AI sağlayıcısını akıllı yönlendirme ile destekler. Aynı anda bir veya daha fazla sağlayıcı kullanabilirsiniz, router maliyet, performans ve kaliteye göre otomatik olarak sağlayıcılar arası geçiş yapar.

### Mevcut Mimari

```
İstek → Akıllı Intent Router → Sağlayıcı Seçimi → AI Cevabı
              ↓                      ↓
        Intent Analizi           GLM-5 (Birincil)
        (Maliyet Optimize)      Claude Pro (Kalite)
                                DeepSeek (Bütçe)
                                MiniMax (Uzun Bağlam)
                                Qwen (Yedek)
                                Gemini (Yedek 2)
                                OpenAI (Premium)
```

### Hızlı Başlangıç

1. **Kurulum**
```bash
npm install -g @halilertekin/claude-code-router-config
ccr-setup
```

2. **API Key Yapılandırma**
```bash
# .env dosyasını düzenle
nano ~/.env
```

3. **Router'ı Başlat**
```bash
ccr start    # Router sunucusunu başlat
ccr code     # Router + Claude Code'u başlat
```

---

### Mevcut Sağlayıcılar

| Sağlayıcı | API URL | Maliyet (1M token) | En İyi Kullanım |
|-----------|---------|-------------------|-----------------|
| **GLM-5 (z.ai)** | `api.z.ai/api/coding/paas/v4` | ~$0.50 | Coding Plan (3x kullanım) |
| **GLM API (z.ai)** | `api.z.ai/api/paas/v4` | ~$0.50 | Kredi ile ödeme |
| **Claude Pro** | Official Anthropic | ~$3.00 | Premium kalite |
| **DeepSeek** | `api.deepseek.com/anthropic` | ~$0.60 | Bütçe kodlama |
| **MiniMax** | `api.minimax.io/anthropic` | ~$0.30 | Uzun bağlam (200k+) |
| **Qwen** | `dashscope-intl.aliyuncs.com/...` | ~$0.10 | Maliyet optimize |
| **Gemini** | `generativelanguage.googleapis.com/...` | ~$0.01 | Hızlı cevap |
| **OpenAI** | `api.openai.com/v1/...` | ~$2.50 | Premium kalite |

---

### Sağlayıcı Ekleme

#### Adım 1: API Key Al

**GLM-5 (z.ai) - Önerilen**
- Website: https://z.ai/apikeys
- Fiyatlandırma: Çok uygun, Coding Plan ile 3x kullanım
- Kayıt ol → API Key Oluştur
- İki endpoint:
  - Coding Plan: `https://api.z.ai/api/coding/paas/v4`
  - API Kredileri: `https://api.z.ai/api/paas/v4`

**MiniMax**
- Website: https://platform.minimax.io/
- Fiyatlandırma: Çok uygun, ultra-uzun bağlam (200k+ token)
- Kayıt ol → API Key Oluştur

**DeepSeek**
- Website: https://platform.deepseek.com/
- Fiyatlandırma: Uygun fiyat
- Kayıt ol → API Key Oluştur

**Qwen (Alibaba)**
- Website: https://dashscope-intl.aliyuncs.com/
- Fiyatlandırma: https://dashscope-intl.aliyuncs.com/pricing
- Kayıt ol → API Key Oluştur

**Gemini (Google)**
- Website: https://ai.google.dev/
- Fiyatlandırma: Ücretsiz tier mevcut
- Kayıt ol → API Key Oluştur

**OpenAI**
- Website: https://platform.openai.com/
- Fiyatlandırma: https://openai.com/pricing
- Kayıt ol → API Key Oluştur

**Anthropic**
- Website: https://console.anthropic.com/
- Fiyatlandırma: https://anthropic.com/pricing
- Kayıt ol → API Key Oluştur

**OpenRouter**
- Website: https://openrouter.ai/
- Fiyatlandırma: Modele göre değişir
- Kayıt ol → API Key Oluştur

#### Adım 2: `.env` Dosyasına Ekle

`~/.env` dosyasını düzenle:

```bash
# Birincil Sağlayıcı (GLM - Önerilen)
export GLM_API_KEY="glm_api_key_buraya"

# Ek Sağlayıcılar (Opsiyonel - yönlendirme için)
export MINIMAX_API_KEY="minimax_api_key_buraya"
export DEEPSEEK_API_KEY="deepseek_api_key_buraya"
export QWEN_API_KEY="qwen_api_key_buraya"
export GEMINI_API_KEY="gemini_api_key_buraya"
export OPENAI_API_KEY="openai_api_key_buraya"
export ANTHROPIC_API_KEY="anthropic_api_key_buraya"
export OPENROUTER_API_KEY="openrouter_api_key_buraya"
```

#### Adım 3: Kurulumu Doğrula

```bash
# Yapılandırmayı kontrol et
ccr status --detailed

# Sağlayıcı bağlantısını test et
ccr test glm
ccr test qwen
ccr test gemini

# Sağlayıcıları benchmark et
ccr benchmark --all --compare-speed
```

---

### Sağlayıcılar Arası Yönlendirme

Router, sağlayıcılar arasında şunlara göre otomatik geçiş yapar:

1. **Intent Analizi**
   - Kodlama görevleri → GLM (ucuz)
   - Akıl yürütme → GLM, Qwen yedeği
   - Hızlı cevaplar → GLM veya Gemini
   - Karmaşık görevler → OpenAI, yedeği mevcut

2. **Maliyet Optimizasyonu**
   - Birincil: GLM (~$0.50/1M token)
   - Yedek 1: Qwen (~$0.10/1M token)
   - Yedek 2: Gemini (~$0.01/1M token)
   - Premium: OpenAI/Anthropic (kalite gerektiğinde)

3. **Sağlık İzleme**
   - Sağlayıcı başarısız → otomatik yedek
   - Performans izleme → optimal sağlayıcı seçimi
   - Maliyet izleme → bütçe yönetimi

#### Yönlendirme Akışı Örneği

```
Kullanıcı İsteği: "Bu kodu refactor etmemeye yardımcı olur musun?"
     ↓
Intent Router: KODlama intent'i algılandı
     ↓
Sağlayıcı Seçimi: glm,glm-5 (birincil)
     ↓
GLM Dene → Başarılı ✅
     VEYA
GLM Dene → Başarısız ❌ → Qwen Yedeği ✅
```

---

### Yapılandırma Örnekleri

#### Örnek 1: Maliyet Optimize Kurulum (Sadece GLM)

```json
{
  "Router": {
    "default": "glm,glm-5",
    "fallbacks": ["qwen,qwen-plus", "gemini,gemini-2.5-flash"]
  }
}
```

`.env`:
```bash
export GLM_API_KEY="senin_key"
# Diğer key'lere gerek yok - GLM her şeyi halleder
```

#### Örnek 2: Çoklu Sağlayıcı Kurulum (Yönlendirme ile)

```json
{
  "Router": {
    "default": "glm,glm-5",
    "fallbacks": ["qwen,qwen-plus", "gemini,gemini-2.5-flash", "openai,gpt-4o"]
  }
}
```

`.env`:
```bash
export GLM_API_KEY="glm_key"
export QWEN_API_KEY="qwen_key"
export GEMINI_API_KEY="gemini_key"
export OPENAI_API_KEY="openai_key"
```

#### Örnek 3: Kalite Optimize Kurulum (Premium)

```json
{
  "Router": {
    "default": "anthropic,claude-sonnet-4-latest",
    "fallbacks": ["openai,gpt-4o", "glm,glm-5"]
  }
}
```

`.env`:
```bash
export ANTHROPIC_API_KEY="anthropic_key"
export OPENAI_API_KEY="openai_key"
export GLM_API_KEY="glm_key"
```

---

### İleri Seviye: Özel Yönlendirme Kuralları

`~/.claude-code-router/smart-intent-router.js` dosyasını düzenle:

```javascript
// İhtiyaçlarına göre özel yönlendirme
CODING: {
  patterns: [/\b(coding|debug|refactor|kodlama)\b/i],
  route: "glm,glm-5",              // Birincil
  fallbacks: [
    "qwen,qwen3-coder-plus",         // Yedek 1
    "openai,gpt-4o"                  // Yedek 2 (premium)
  ]
}
```

---

### Sorun Giderme

**Sorun: Sağlayıcı çalışmıyor**
```bash
# API key'in ayarlanmış olduğunu kontrol et
echo $GLM_API_KEY

# Bağlantıyı test et
ccr test glm

# Logları kontrol et
tail -f ~/.claude-code-router/logs/app.log
```

**Sorun: Her zaman aynı sağlayıcıyı kullanıyor**
```bash
# Router yapılandırmasını kontrol et
cat ~/.claude-code-router/config.json | jq '.Router'

# Intent router'ı doğrula
cat ~/.claude-code-router/smart-intent-router.js
```

**Sorun: Yüksek maliyetler**
```bash
# Analitikleri kontrol et
ccr analytics --today

# Maliyet optimizasyonunun açık olduğunu doğrula
ccr status --detailed --show-costs
```

---

### Maliyet Karşılaştırması

| Görev | Claude Sonnet 4.5 | GLM 4.7 | Tasarruf |
|------|-------------------|---------|---------|
| 100K kodlama görevi | $300 | $50 | **%83** |
| 1M token input | $3.00 | $0.50 | **%83** |
| 1M token output | $15.00 | $2.00 | **%87** |

---

### CLI Komutları

```bash
# Router yönetimi
ccr start              # Router'ı başlat
ccr stop               # Router'ı durdur
ccr restart            # Router'ı yeniden başlat
ccr status             # Durumu göster
ccr code               # Router + Claude Code

# İstatistikler
ccr analytics --today  # Bugünün kullanımı
ccr analytics          # Haftalık özet
ccr benchmark          # Karşılaştırmalı test

# Test ve doğrulama
ccr test glm           # GLM bağlantısını test et
ccr config validate    # Yapılandırmayı doğrula

# Dashboard
ccr ui                 # Web dashboard'ı aç
```

---

### Daha Fazla Bilgi

- **GitHub Repository**: https://github.com/halilertekin/CC-RouterMultiProvider
- **Issues**: https://github.com/halilertekin/CC-RouterMultiProvider/issues
- **Changelog**: [CHANGELOG.md](../CHANGELOG.md)

---

*Created by Halil Ertekin*
*Version: 2.4.0*
*Last Updated: 2026-02-15*
