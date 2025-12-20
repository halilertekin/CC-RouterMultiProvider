# Claude Code Router - Tam Dokümantasyon

> **Versiyon**: 1.0.73
> **Tarih**: 2025-12-20
> **Amaç**: Tek Claude Code arayüzünden birden fazla AI provider'a intent-based routing

---

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari](#mimari)
3. [Desteklenen Provider'lar](#desteklenen-providerlar)
4. [Routing Stratejisi](#routing-stratejisi)
5. [Kurulum](#kurulum)
6. [Konfigürasyon Detayları](#konfigürasyon-detayları)
7. [Intent Router Mantığı](#intent-router-mantığı)
8. [Kullanım Rehberi](#kullanım-rehberi)
9. [Sorun Giderme](#sorun-giderme)
10. [API Key Alma Rehberi](#api-key-alma-rehberi)

---

## Genel Bakış

Claude Code Router, Claude Code CLI'ı bir proxy üzerinden çalıştırarak istekleri farklı AI provider'lara yönlendirir. Bu sayede:

- **Maliyet optimizasyonu**: Basit işler ucuz modellere gider
- **Performans optimizasyonu**: Hızlı cevap gereken işler hızlı modellere gider
- **Yetenek optimizasyonu**: Her iş için en uygun model seçilir
- **Tek arayüz**: Tüm modellere Claude Code üzerinden erişim

---

## Mimari

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
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────────┐
│OpenAI │ │Anthro │ │Gemini │ │ Qwen  │ │  GLM  │ │OpenRouter │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────────┘
```

### Akış

1. Kullanıcı Claude Code'a istek gönderir
2. İstek `localhost:3456`'ya (router) gider
3. Router, `intent-router.js` ile intent analizi yapar
4. İstek uygun provider'a yönlendirilir
5. Cevap kullanıcıya döner

---

## Desteklenen Provider'lar

### 1. OpenAI
| Özellik | Değer |
|---------|-------|
| **API URL** | `https://api.openai.com/v1/chat/completions` |
| **Modeller** | gpt-4o, gpt-4-turbo, gpt-4o-mini, o1, o1-mini |
| **Kullanım** | Coding, debugging, refactoring |
| **Maliyet** | Orta-Yüksek |
| **Env Var** | `OPENAI_API_KEY` |

### 2. Anthropic (Claude)
| Özellik | Değer |
|---------|-------|
| **API URL** | `https://api.anthropic.com/v1/messages` |
| **Modeller** | claude-sonnet-4-latest, claude-3-5-sonnet-latest |
| **Kullanım** | Deep reasoning, architecture, analysis |
| **Maliyet** | Yüksek |
| **Env Var** | `ANTHROPIC_API_KEY` |
| **Transformer** | `Anthropic` (gerekli) |

### 3. Google Gemini
| Özellik | Değer |
|---------|-------|
| **API URL** | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| **Modeller** | gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash |
| **Kullanım** | Hızlı cevaplar, uzun context (1M token) |
| **Maliyet** | Düşük-Orta |
| **Env Var** | `GEMINI_API_KEY` |
| **Transformer** | `gemini` (gerekli) |

### 4. Alibaba Qwen (DashScope)
| Özellik | Değer |
|---------|-------|
| **API URL** | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` |
| **Modeller** | qwen-plus, qwen-max, qwen3-coder-plus, qwen-turbo |
| **Kullanım** | Ucuz coding, basit işler |
| **Maliyet** | Çok Düşük |
| **Env Var** | `QWEN_API_KEY` |

### 5. Zhipu GLM (Z.ai)
| Özellik | Değer |
|---------|-------|
| **API URL** | `https://api.z.ai/api/paas/v4/chat/completions` |
| **Modeller** | glm-4.6, glm-4.5, glm-4-plus |
| **Kullanım** | Çok dilli, Çince, çeviri |
| **Maliyet** | Düşük |
| **Env Var** | `GLM_API_KEY` |

### 6. OpenRouter
| Özellik | Değer |
|---------|-------|
| **API URL** | `https://openrouter.ai/api/v1/chat/completions` |
| **Modeller** | Tüm modeller (Claude, GPT, Gemini, Llama, DeepSeek...) |
| **Kullanım** | Fallback, çeşitlilik |
| **Maliyet** | Değişken |
| **Env Var** | `OPENROUTER_API_KEY` |
| **Transformer** | `openrouter` (gerekli) |

---

## Routing Stratejisi

### Otomatik Intent-Based Routing

| Intent | Tetikleyici Kelimeler | Provider | Model |
|--------|----------------------|----------|-------|
| **CODING** | implement, refactor, debug, fix, code, function, class, typescript, python, api, database | OpenAI | gpt-4o |
| **REASONING** | architect, design, analyze, plan, why, explain, compare, evaluate, best practice | Anthropic | claude-sonnet-4 |
| **FAST** | fast, quick, brief, summary, tldr, overview, hızlı, scan, check | Gemini | gemini-2.5-flash |
| **SIMPLE** | list, show, what is, simple, basic, help, format, rename, mkdir, ucuz, basit | Qwen | qwen-plus |
| **MULTILINGUAL** | translate, çevir, tercüme, chinese, türkçe, Çince karakterler | GLM | glm-4.6 |
| **HEAVY_REASONING** | complex algorithm, optimization, performance critical, prove, mathematical | OpenAI | o1 |

### Built-in Router Ayarları

| Senaryo | Provider | Model | Açıklama |
|---------|----------|-------|----------|
| **default** | OpenAI | gpt-4o | Eşleşme yoksa |
| **background** | Qwen | qwen-turbo | Arka plan görevleri |
| **think** | Anthropic | claude-sonnet-4 | Düşünme/reasoning |
| **longContext** | Gemini | gemini-2.5-flash | >60K token |

---

## Kurulum

### Gereksinimler
- Node.js 18+
- pnpm (tercih edilen) veya npm

### Seçenek 1: Homebrew (Tavsiye Edilen)

```bash
brew install halilertekin/tap/claude-code-router-config
```

Homebrew kurulumu her şeyi otomatik yapar:
- @musistudio/claude-code-router kurar
- Konfigürasyon dosyalarını kopyalar
- ~/.env dosyasını şablonlarla oluşturur
- Sonraki adımları gösterir

### Seçenek 2: NPM Paketi

```bash
pnpm add -g claude-code-router-config
ccr-setup
```

### Seçenek 3: Manuel Kurulum

#### Adım 1: Paket Kurulumu

```bash
pnpm add -g @musistudio/claude-code-router
mkdir -p ~/.claude-code-router
```

#### Adım 2: Environment Variables

`~/.zshrc` veya `~/.bashrc` dosyasına ekle:

```bash
# ═══════════════════════════════════════════════════
# Claude Code Router - API Keys
# ═══════════════════════════════════════════════════

# OpenAI (GPT-4o, O1, Codex)
export OPENAI_API_KEY="sk-..."

# Anthropic (Claude)
export ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini
export GEMINI_API_KEY="AIza..."

# Alibaba Qwen (DashScope)
export QWEN_API_KEY="sk-..."

# Zhipu GLM (Z.ai)
export GLM_API_KEY="..."

# OpenRouter (fallback)
export OPENROUTER_API_KEY="sk-or-..."

# ═══════════════════════════════════════════════════
# Router Connection
# ═══════════════════════════════════════════════════
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export NO_PROXY="127.0.0.1"
```

### Adım 3: Shell'i Yenile

```bash
source ~/.zshrc
```

### Adım 4: Başlat

```bash
ccr code
```

---

## Konfigürasyon Detayları

### config.json Yapısı

```json
{
  "LOG": true,                    // Loglama aktif
  "LOG_LEVEL": "info",            // Log seviyesi: fatal|error|warn|info|debug|trace
  "API_TIMEOUT_MS": 300000,       // 5 dakika timeout
  "CUSTOM_ROUTER_PATH": "$HOME/.claude-code-router/intent-router.js",

  "Providers": [
    {
      "name": "provider_adi",           // Benzersiz isim
      "api_base_url": "https://...",    // API endpoint
      "api_key": "$ENV_VAR",            // Env var referansı
      "models": ["model1", "model2"],   // Desteklenen modeller
      "transformer": { "use": [] }      // Gerekli transformer'lar
    }
  ],

  "Router": {
    "default": "provider,model",        // Varsayılan
    "background": "provider,model",     // Arka plan görevleri
    "think": "provider,model",          // Reasoning görevleri
    "longContext": "provider,model",    // Uzun context
    "longContextThreshold": 60000       // Token eşiği
  }
}
```

### Transformer'lar

| Transformer | Kullanım |
|-------------|----------|
| `Anthropic` | Anthropic API formatı için |
| `gemini` | Google Gemini API formatı için |
| `openrouter` | OpenRouter API formatı için |
| `deepseek` | DeepSeek modelleri için |
| `maxtoken` | Max token limiti ayarı için |

---

## Intent Router Mantığı

### Çalışma Prensibi

1. İstek gelir
2. Mesaj içeriği çıkarılır (user + system mesajları)
3. Her intent için pattern eşleşmesi sayılır
4. En yüksek skora sahip intent seçilir
5. İlgili provider'a yönlendirilir

### Pattern Öncelik Sırası

1. **HEAVY_REASONING** - Karmaşık algoritmalar
2. **CODING** - Kod yazma/düzeltme
3. **REASONING** - Analiz/açıklama
4. **MULTILINGUAL** - Çeviri
5. **FAST** - Hızlı cevaplar
6. **SIMPLE** - Basit işler

### Özelleştirme

`intent-router.js` dosyasını düzenleyerek:
- Yeni intent'ler ekleyebilirsin
- Pattern'leri değiştirebilirsin
- Route'ları güncelleyebilirsin

---

## Kullanım Rehberi

### Temel Komutlar

```bash
# Router'ı başlat
ccr start

# Claude Code ile birlikte başlat
ccr code

# Durum kontrolü
ccr status

# Router'ı durdur
ccr stop

# Router'ı yeniden başlat
ccr restart

# Web UI aç
ccr ui

# Model seçim arayüzü
ccr model
```

### Runtime Model Değiştirme

Claude Code içinde `/model` komutu:

```
/model openai,gpt-4o
/model openai,o1
/model anthropic,claude-sonnet-4-latest
/model gemini,gemini-2.5-flash
/model gemini,gemini-2.5-pro
/model qwen,qwen-plus
/model qwen,qwen3-coder-plus
/model glm,glm-4.6
/model openrouter,deepseek/deepseek-chat
```

### Örnek Kullanım Senaryoları

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
```

### Logları İzleme

```bash
# Tüm loglar
tail -f ~/.claude-code-router/logs/*.log

# Sadece router kararları
tail -f ~/.claude-code-router/logs/*.log | grep "Router"
```

---

## Sorun Giderme

### Router Başlamıyor

```bash
# Port kullanımda mı kontrol et
lsof -i :3456

# Varsa kapat
kill -9 <PID>

# Tekrar başlat
ccr start
```

### API Hatası Alıyorum

1. API key'in doğru mu kontrol et:
```bash
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
# ... diğerleri
```

2. Key'i test et:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Model Bulunamıyor Hatası

`config.json`'daki model adının doğru olduğundan emin ol:
- OpenAI: `gpt-4o` (not: `gpt-4-o` değil)
- Anthropic: `claude-sonnet-4-latest`
- Gemini: `gemini-2.5-flash`

### Routing Çalışmıyor

1. Custom router'ın yüklendiğini kontrol et:
```bash
cat ~/.claude-code-router/config.json | grep CUSTOM_ROUTER
```

2. Router dosyasının var olduğunu kontrol et:
```bash
ls -la ~/.claude-code-router/intent-router.js
```

3. Syntax hatası var mı kontrol et:
```bash
node -c ~/.claude-code-router/intent-router.js
```

---

## API Key Alma Rehberi

### OpenAI
1. https://platform.openai.com/api-keys adresine git
2. "Create new secret key" tıkla
3. Key'i kopyala (`sk-...` ile başlar)

### Anthropic
1. https://console.anthropic.com/settings/keys adresine git
2. "Create Key" tıkla
3. Key'i kopyala (`sk-ant-...` ile başlar)

### Google Gemini
1. https://aistudio.google.com/apikey adresine git
2. "Create API Key" tıkla
3. Key'i kopyala (`AIza...` ile başlar)

### Alibaba Qwen (DashScope)
1. https://dashscope.console.aliyun.com/apiKey adresine git
2. Aliyun hesabı oluştur (international)
3. API key al

### Zhipu GLM (Z.ai)
1. https://open.bigmodel.cn/usercenter/apikeys adresine git
2. Hesap oluştur
3. API key al

### OpenRouter
1. https://openrouter.ai/keys adresine git
2. GitHub/Google ile giriş yap
3. "Create Key" tıkla
4. Key'i kopyala (`sk-or-...` ile başlar)

---

## Dosya Yapısı

```
~/.claude-code-router/
├── config.json              # Ana konfigürasyon
├── intent-router.js         # Custom routing logic
├── README.md                # Kısa dokümantasyon
├── FULL_DOCUMENTATION.md    # Bu dosya
└── logs/                    # Log dosyaları
    └── *.log
```

---

## Notlar

- Router her zaman `localhost:3456` üzerinde çalışır
- `ANTHROPIC_BASE_URL` Claude Code'un router'a bağlanmasını sağlar
- `NO_PROXY` sistem proxy'sinin router'ı atlamamasını sağlar
- Env var'lar `$VAR_NAME` formatında config.json'da kullanılabilir

---

## Atıf (Attribution)

Bu yapılandırma paketi [@musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) için tasarlanmıştır. Bu, Claude Code'u birden fazla AI sağlayıcısıyla kullanmanızı sağlayan mükemmel bir araçtır.

Orijinal Claude Code Router projesi musistudio tarafından geliştirilmektedir ve bakımı yapılmaktadır. Bu paket, kullanıcıların hızla başlamasına yardımcı olmak için önceden yapılandırılmış routing mantığı ve sağlayıcı konfigürasyonları içermektedir.

## Kaynaklar

- [GitHub - musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)
- [npm - @musistudio/claude-code-router](https://www.npmjs.com/package/@musistudio/claude-code-router)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [DashScope Docs](https://www.alibabacloud.com/help/en/model-studio)
- [Z.ai Docs](https://docs.z.ai)
