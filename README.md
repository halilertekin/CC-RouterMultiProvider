# Claude Code Router - Multi-Provider Setup

Claude Code'u tek arayüz olarak kullanarak birden fazla AI provider'a intent-based routing ile erişim.

## Özellikler

- **6 Provider Desteği**: OpenAI, Anthropic, Gemini, Qwen, GLM, OpenRouter
- **Intent-Based Routing**: İsteğin içeriğine göre otomatik model seçimi
- **Maliyet Optimizasyonu**: Basit işler ucuz modellere gider
- **Performans Optimizasyonu**: Hızlı cevap gereken işler hızlı modellere gider

## Routing Stratejisi

| İstek Tipi | Provider | Model |
|------------|----------|-------|
| Kod yazma, debug | OpenAI | gpt-4o |
| Derin analiz, mimari | Anthropic | claude-sonnet-4 |
| Hızlı cevap, özet | Gemini | gemini-2.5-flash |
| Basit işler | Qwen | qwen-plus |
| Çeviri, çok dilli | GLM | glm-4.6 |
| Karmaşık algoritma | OpenAI | o1 |

## Hızlı Kurulum

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-router-config.git
cd claude-code-router-config
chmod +x install.sh
./install.sh
```

## Manuel Kurulum

### 1. Paket Kurulumu

```bash
pnpm add -g @musistudio/claude-code-router
```

### 2. Config Dosyalarını Kopyala

```bash
mkdir -p ~/.claude-code-router
cp config/config.json ~/.claude-code-router/
cp config/intent-router.js ~/.claude-code-router/
```

### 3. Environment Variables

`~/.zshrc` dosyasına ekle:

```bash
# Claude Code Router - API Keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIza..."
export QWEN_API_KEY="sk-..."
export GLM_API_KEY="..."
export OPENROUTER_API_KEY="sk-or-..."

# Router Connection
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export NO_PROXY="127.0.0.1"
```

### 4. Başlat

```bash
source ~/.zshrc
ccr code
```

## Kullanım

### Temel Komutlar

```bash
ccr start    # Router'ı başlat
ccr code     # Claude Code ile başlat
ccr status   # Durum kontrolü
ccr stop     # Durdur
```

### Model Değiştirme (Runtime)

Claude Code içinde:

```
/model openai,gpt-4o
/model anthropic,claude-sonnet-4-latest
/model gemini,gemini-2.5-flash
/model qwen,qwen-plus
/model glm,glm-4.6
```

## API Key Alma

| Provider | Link |
|----------|------|
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic | https://console.anthropic.com/settings/keys |
| Gemini | https://aistudio.google.com/apikey |
| Qwen | https://dashscope.console.aliyun.com/apiKey |
| GLM | https://open.bigmodel.cn/usercenter/apikeys |
| OpenRouter | https://openrouter.ai/keys |

## Dosya Yapısı

```
~/.claude-code-router/
├── config.json          # Provider yapılandırması
├── intent-router.js     # Routing logic
└── logs/                # Log dosyaları
```

## Dokümantasyon

- [Tam Dokümantasyon](docs/FULL_DOCUMENTATION.md)
- [Kurulum Prompt'u](docs/SETUP_PROMPT.md)

## Lisans

MIT
