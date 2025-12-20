# Claude Code Router - Setup Prompt for Other Machines

Use this prompt to set up Claude Code Router on another machine. Copy and paste into Claude Code.

---

## SETUP PROMPT

```
You are a DevOps + LLM infrastructure engineer.

Task: Install and configure Claude Code Router with intent-based routing.

Requirements:
- Use pnpm (not npm)
- Don't hardcode model versions, use the latest/recommended models per provider
- macOS/Linux environment

Providers to setup:
1. OpenAI (gpt-4o, o1) - Coding, debugging
2. Anthropic Claude - Deep reasoning, analysis
3. Google Gemini - Fast responses, long context
4. Alibaba Qwen (DashScope) - Cheap, simple tasks
5. Zhipu GLM (Z.ai) - Multilingual, translation
6. OpenRouter - Fallback
7. GitHub Copilot - Coding assistance

Intent-Based Routing Rules:
- Code writing/debug → OpenAI (gpt-4o)
- Architecture/analysis/why → Anthropic Claude
- Fast/summary/tldr → Gemini Flash
- Simple/list/help → Qwen (cheap)
- Translation/multilingual → GLM
- Complex algorithm → OpenAI (o1)
- Coding help/suggestions → GitHub Copilot
- No match → OpenAI (fallback)

Tasks:
1. Install @musistudio/claude-code-router with pnpm
2. Create ~/.claude-code-router/config.json (all providers)
3. Create ~/.claude-code-router/intent-router.js (routing logic)
4. Show required .zshrc additions

API Endpoints:
- OpenAI: https://api.openai.com/v1/chat/completions
- Anthropic: https://api.anthropic.com/v1/messages (transformer: Anthropic)
- Gemini: https://generativelanguage.googleapis.com/v1beta/openai/chat/completions (transformer: gemini)
- Qwen: https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
- GLM: https://api.z.ai/api/paas/v4/chat/completions
- OpenRouter: https://openrouter.ai/api/v1/chat/completions (transformer: openrouter)
- GitHub Copilot: Custom implementation for GitHub API

Router Settings:
- default: openai,gpt-4o
- background: qwen,qwen-turbo
- think: anthropic,claude-sonnet-4-latest
- longContext: gemini,gemini-2.5-flash
- longContextThreshold: 60000

Output:
1. Installation commands
2. config.json content
3. intent-router.js content
4. .zshrc additions
5. Startup and test commands
```

---

## QUICK SETUP (Manual)

If you prefer manual setup:

### 1. Install

```bash
pnpm add -g @musistudio/claude-code-router
mkdir -p ~/.claude-code-router
```

### 2. config.json

```bash
cat > ~/.claude-code-router/config.json << 'EOF'
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 300000,
  "CUSTOM_ROUTER_PATH": "$HOME/.claude-code-router/intent-router.js",

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
      "api_base_url": "https://api.z.ai/api/paas/v4/chat/completions",
      "api_key": "$GLM_API_KEY",
      "models": ["glm-4.6", "glm-4.5", "glm-4-plus"],
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
    },
    {
      "name": "copilot",
      "api_base_url": "https://api.githubcopilot.com/chat/completions",
      "api_key": "$GITHUB_COPIOT_API_KEY",
      "models": ["copilot"],
      "transformer": { "use": [] }
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

### 3. intent-router.js

```bash
cat > ~/.claude-code-router/intent-router.js << 'EOF'
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
  CODING_ASSIST: {
    patterns: [
      /\b(help me code|suggest improvement|better way to|how to improve)\b/i,
      /\b(refactor this|optimize this|clean up this code)\b/i
    ],
    route: "copilot,copilot"
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
      /\b(fast|quick|brief|short|summary|tldr|overview)\b/i,
      /\b(scan|check|verify|validate)\b/i
    ],
    route: "gemini,gemini-2.5-flash"
  },
  SIMPLE: {
    patterns: [
      /\b(list|show|what is|simple|basic|help|how to|format)\b/i,
      /\b(rename|move|delete|create file|mkdir|copy)\b/i
    ],
    route: "qwen,qwen-plus"
  },
  MULTILINGUAL: {
    patterns: [
      /\b(translate|multilingual|chinese|japanese|spanish|french|german)\b/i,
      /[\u4e00-\u9fff]/,  // Chinese characters
      /[\u0600-\u06FF]/,  // Arabic
      /[\u0400-\u04FF]/,  // Cyrillic
    ],
    route: "glm,glm-4.6"
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

### 4. .zshrc Additions

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
export GITHUB_COPIOT_API_KEY="ghu_..."

# Router Connection
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export NO_PROXY="127.0.0.1"
EOF
```

### 5. Start

```bash
source ~/.zshrc
ccr code
```

---

## ONE-LINE INSTALLATION

To create all files at once:

```bash
# 1. Install
pnpm add -g @musistudio/claude-code-router && mkdir -p ~/.claude-code-router

# 2. Download configs (from this repo)
curl -sL https://raw.githubusercontent.com/YOUR_REPO/main/config/config.json > ~/.claude-code-router/config.json
curl -sL https://raw.githubusercontent.com/YOUR_REPO/main/config/intent-router.js > ~/.claude-code-router/intent-router.js

# 3. Add API keys to .zshrc (manual)
# 4. Start
source ~/.zshrc && ccr code
```

---

## API KEY SETUP LINKS

| Provider | Link | Notes |
|----------|------|-------|
| OpenAI | https://platform.openai.com/api-keys | gpt-4o, o1 |
| Anthropic | https://console.anthropic.com/settings/keys | Claude |
| Gemini | https://aistudio.google.com/apikey | Google AI |
| Qwen | https://dashscope.console.aliyun.com/apiKey | Alibaba |
| GLM | https://open.bigmodel.cn/usercenter/apikeys | Zhipu AI |
| OpenRouter | https://openrouter.ai/keys | Multiple |
| GitHub Copilot | https://github.com/settings/tokens | `copilot` scope |