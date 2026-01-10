# Claude Code Router - Kurulum Prompt'u

Bu prompt'u başka bir makinede Claude Code Router kurmak için kullanabilirsin.
Kopyala ve Claude Code'a yapıştır.

---

## KURULUM PROMPT'U

```
Sen bir DevOps + LLM altyapı uzmanısın.

Görev: Claude Code Router'ı kur ve intent-based routing ile yapılandır.

Gereksinimler:
- pnpm kullan (npm değil)
- Model versiyonlarını sabitlemek yerine en güncel/önerilen modelleri kullan
- macOS/Linux ortamı

Kurulacak Provider'lar:
1. OpenAI (gpt-4o, o1) - Coding, debugging
2. Anthropic Claude - Deep reasoning, analysis
3. Google Gemini - Hızlı cevaplar, uzun context
4. Alibaba Qwen (DashScope) - Ucuz, basit işler
5. Zhipu GLM (Z.ai) - Çok dilli, çeviri
6. OpenRouter - Fallback

Intent-Based Routing Kuralları:
- Kod yazma/debug → OpenAI (gpt-4o)
- Mimari/analiz/neden → Anthropic Claude
- Hızlı/özet/tldr → Gemini Flash
- Basit/liste/yardım → Qwen (ucuz)
- Çeviri/çok dilli → GLM
- Karmaşık algoritma → OpenAI (o1)
- Eşleşme yok → OpenAI (fallback)

Yapılacaklar:
1. pnpm ile @halilertekin/claude-code-router-config kur
2. ~/.claude-code-router/config.json oluştur (tüm provider'lar)
3. ~/.claude-code-router/smart-smart-intent-router.js oluştur (routing logic)
4. ~/.zshrc için gerekli env var'ları göster

API Endpoint'leri:
- OpenAI: https://api.openai.com/v1/chat/completions
- Anthropic: https://api.anthropic.com/v1/messages (transformer: Anthropic)
- Gemini: https://generativelanguage.googleapis.com/v1beta/openai/chat/completions (transformer: gemini)
- Qwen: https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
- GLM: https://api.z.ai/api/coding/paas/v4/chat/completions
- OpenRouter: https://openrouter.ai/api/v1/chat/completions (transformer: openrouter)

Router Ayarları:
- default: openai,gpt-4o
- background: qwen,qwen-turbo
- think: anthropic,claude-sonnet-4-latest
- longContext: gemini,gemini-2.5-flash
- longContextThreshold: 60000

Çıktı:
1. Kurulum komutları
2. config.json içeriği
3. smart-intent-router.js içeriği
4. .zshrc eklemeleri
5. Başlatma ve test komutları
```

---

## HIZLI KURULUM (Manuel)

Eğer prompt kullanmak istemiyorsan, aşağıdaki adımları manuel uygula:

### 1. Kurulum

```bash
pnpm add -g @halilertekin/claude-code-router-config
mkdir -p ~/.claude-code-router
```

### 2. config.json

```bash
cat > ~/.claude-code-router/config.json << 'EOF'
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 300000,
  "CUSTOM_ROUTER_PATH": "$HOME/.claude-code-router/smart-intent-router.js",

  "Providers": [
    {
      "name": "openai",
      "api_base_url": "https://api.openai.com/v1/chat/completions",
      "api_key": "$OPENAI_API_KEY",
      "models": ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini", "o1", "o1-mini"],
      "transformer": { "use": [] }
    },
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "$ANTHROPIC_API_KEY",
      "models": ["claude-sonnet-4-latest", "claude-3-5-sonnet-latest"],
      "transformer": { "use": ["Anthropic"] }
    },
    {
      "name": "gemini",
      "api_base_url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      "api_key": "$GEMINI_API_KEY",
      "models": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
      "transformer": { "use": ["gemini"] }
    },
    {
      "name": "qwen",
      "api_base_url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
      "api_key": "$QWEN_API_KEY",
      "models": ["qwen-plus", "qwen-max", "qwen3-coder-plus", "qwen-turbo"],
      "transformer": { "use": [] }
    },
    {
      "name": "glm",
      "api_base_url": "https://api.z.ai/api/coding/paas/v4/chat/completions",
      "api_key": "$GLM_API_KEY",
      "models": ["glm-4.7", "glm-4.6", "glm-4.5", "glm-4-plus"],
      "transformer": { "use": [] }
    },
    {
      "name": "openrouter",
      "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
      "api_key": "$OPENROUTER_API_KEY",
      "models": [
        "anthropic/claude-sonnet-4",
        "deepseek/deepseek-chat",
        "google/gemini-2.5-flash",
        "meta-llama/llama-3.3-70b-instruct"
      ],
      "transformer": { "use": ["openrouter"] }
    }
  ],

  "Router": {
    "default": "openai,gpt-4o",
    "background": "qwen,qwen-turbo",
    "think": "anthropic,claude-sonnet-4-latest",
    "longContext": "gemini,gemini-2.5-flash",
    "longContextThreshold": 60000
  }
}
EOF
```

### 3. smart-intent-router.js

```bash
cat > ~/.claude-code-router/smart-intent-router.js << 'EOF'
const INTENTS = {
  CODING: {
    patterns: [
      /\b(implement|refactor|debug|fix|write|code|function|class|method|bug|error|compile|syntax)\b/i,
      /\b(typescript|javascript|python|rust|go|java|react|vue|angular|swift|kotlin)\b/i,
      /\b(api|endpoint|database|query|migration|schema|test|unit test)\b/i,
      /\b(codex|o1|reasoning)\b/i
    ],
    route: "openai,gpt-4o"
  },
  REASONING: {
    patterns: [
      /\b(architect|design|analyze|plan|strategy|structure|system|trade-?off)\b/i,
      /\b(why|explain|reason|understand|compare|evaluate|consider|review)\b/i,
      /\b(decision|approach|best practice|pattern|principle|philosophy)\b/i
    ],
    route: "anthropic,claude-sonnet-4-latest"
  },
  FAST: {
    patterns: [
      /\b(fast|quick|brief|short|summary|tldr|overview|hızlı)\b/i,
      /\b(scan|check|verify|validate)\b/i
    ],
    route: "gemini,gemini-2.5-flash"
  },
  SIMPLE: {
    patterns: [
      /\b(list|show|what is|simple|basic|help|how to|format)\b/i,
      /\b(rename|move|delete|create file|mkdir|copy)\b/i,
      /\b(ucuz|basit|kolay)\b/i
    ],
    route: "qwen,qwen-plus"
  },
  MULTILINGUAL: {
    patterns: [
      /\b(translate|çevir|tercüme|chinese|türkçe|multilingual)\b/i,
      /[\u4e00-\u9fff]/,
      /[\u0600-\u06FF]/,
    ],
    route: "glm,glm-4.7"
  },
  HEAVY_REASONING: {
    patterns: [
      /\b(complex algorithm|optimization|performance critical|system design)\b/i,
      /\b(prove|mathematical|theorem|formal verification)\b/i
    ],
    route: "openai,o1"
  }
};

function extractContent(req) {
  const messages = req.body?.messages || [];
  return messages
    .filter(m => m.role === "user" || m.role === "system")
    .map(m => typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    .join(" ")
    .slice(0, 3000);
}

function detectIntent(content) {
  const scores = {};
  for (const [intent, config] of Object.entries(INTENTS)) {
    scores[intent] = config.patterns.reduce((score, pattern) => {
      const matches = (content.match(pattern) || []).length;
      return score + matches;
    }, 0);
  }
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

module.exports = async function router(req, config) {
  const content = extractContent(req);
  const intent = detectIntent(content);
  if (intent && INTENTS[intent]) {
    const route = INTENTS[intent].route;
    console.log(`[Router] ${intent} → ${route}`);
    return route;
  }
  console.log("[Router] No match → openai,gpt-4o");
  return null;
};
EOF
```

### 4. .zshrc Eklemeleri

```bash
cat >> ~/.zshrc << 'EOF'

# ═══════════════════════════════════════════════════
# Claude Code Router - API Keys
# ═══════════════════════════════════════════════════
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIza..."
export QWEN_API_KEY="sk-..."
export GLM_API_KEY="..."
export OPENROUTER_API_KEY="sk-or-..."

# Router Connection
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export NO_PROXY="127.0.0.1"
EOF
```

### 5. Başlat

```bash
source ~/.zshrc
ccr code
```

---

## TEK SATIRLIK KURULUM

Tüm dosyaları tek seferde oluşturmak için:

```bash
# 1. Kur
pnpm add -g @halilertekin/claude-code-router-config && mkdir -p ~/.claude-code-router

# 2. Config'leri indir (bu repo'dan)
curl -sL https://raw.githubusercontent.com/YOUR_REPO/main/config.json > ~/.claude-code-router/config.json
curl -sL https://raw.githubusercontent.com/YOUR_REPO/main/smart-intent-router.js > ~/.claude-code-router/smart-intent-router.js

# 3. API key'leri .zshrc'ye ekle (manuel)
# 4. Başlat
source ~/.zshrc && ccr code
```

---

## API KEY ALMA LİNKLERİ

| Provider | Link |
|----------|------|
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic | https://console.anthropic.com/settings/keys |
| Gemini | https://aistudio.google.com/apikey |
| Qwen | https://dashscope.console.aliyun.com/apiKey |
| GLM | https://open.bigmodel.cn/usercenter/apikeys |
| OpenRouter | https://openrouter.ai/keys |
