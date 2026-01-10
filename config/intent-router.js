/**
 * Multi-Provider Intent Router
 * Routes requests based on task type to optimal provider
 *
 * This router is designed for the built-in unified router
 *
 * Configuration by Halil Ertekin
 */

const INTENTS = {
  // Coding tasks → OpenAI (GPT-4o, O1, Codex)
  CODING: {
    patterns: [
      /\b(implement|refactor|debug|fix|write|code|function|class|method|bug|error|compile|syntax)\b/i,
      /\b(typescript|javascript|python|rust|go|java|react|vue|angular|swift|kotlin)\b/i,
      /\b(api|endpoint|database|query|migration|schema|test|unit test)\b/i,
      /\b(codex|o1|reasoning)\b/i
    ],
    route: "openai,gpt-4o"
  },

  // Deep reasoning → Anthropic Claude
  REASONING: {
    patterns: [
      /\b(architect|design|analyze|plan|strategy|structure|system|trade-?off)\b/i,
      /\b(why|explain|reason|understand|compare|evaluate|consider|review)\b/i,
      /\b(decision|approach|best practice|pattern|principle|philosophy)\b/i
    ],
    route: "anthropic,claude-sonnet-4-latest"
  },

  // Fast responses → Gemini Flash
  FAST: {
    patterns: [
      /\b(fast|quick|brief|short|summary|tldr|overview|hızlı)\b/i,
      /\b(scan|check|verify|validate)\b/i
    ],
    route: "gemini,gemini-2.5-flash"
  },

  // Simple/cheap tasks → Qwen
  SIMPLE: {
    patterns: [
      /\b(list|show|what is|simple|basic|help|how to|format)\b/i,
      /\b(rename|move|delete|create file|mkdir|copy)\b/i,
      /\b(ucuz|basit|kolay)\b/i
    ],
    route: "qwen,qwen-plus"
  },

  // Multilingual → GLM
  MULTILINGUAL: {
    patterns: [
      /\b(translate|çevir|tercüme|chinese|türkçe|multilingual)\b/i,
      /[\u4e00-\u9fff]/, // Chinese characters
      /[\u0600-\u06FF]/, // Arabic
    ],
    route: "glm,glm-4.7"
  },

  // Heavy coding/reasoning → O1
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

  // Fallback
  console.log("[Router] No match → openai,gpt-4o");
  return null;
};
