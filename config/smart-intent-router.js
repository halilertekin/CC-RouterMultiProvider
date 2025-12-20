/**
 * Enhanced Smart Intent Router
 * Intelligent routing with cost, performance, and quality optimization
 *
 * Features:
 * - Intent-based routing
 * - Cost-aware provider selection
 * - Performance-based routing
 * - Health monitoring integration
 * - Auto-fallback mechanisms
 * - Learning from past performance
 *
 * Configuration by Halil Ertekin
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Performance metrics storage
const METRICS_PATH = path.join(os.homedir(), '.claude-code-router', 'routing-metrics.json');

// Load historical performance data
function loadMetrics() {
  try {
    if (fs.existsSync(METRICS_PATH)) {
      return JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load metrics:', error);
  }
  return {
    providers: {},
    intents: {},
    requests: []
  };
}

// Save performance metrics
function saveMetrics(metrics) {
  try {
    // Keep only last 1000 requests
    if (metrics.requests.length > 1000) {
      metrics.requests = metrics.requests.slice(-1000);
    }
    fs.writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Failed to save metrics:', error);
  }
}

// Enhanced intent definitions with routing strategies
const INTENTS = {
  // Coding tasks → OpenAI (GPT-4o, O1) with fallbacks
  CODING: {
    patterns: [
      /\b(implement|refactor|debug|fix|write|code|function|class|method|bug|error|compile|syntax)\b/i,
      /\b(typescript|javascript|python|rust|go|java|react|vue|angular|swift|kotlin)\b/i,
      /\b(api|endpoint|database|query|migration|schema|test|unit test)\b/i,
      /\b(codex|o1|reasoning)\b/i
    ],
    route: "openai,gpt-4o",
    strategy: "quality",
    fallbacks: ["anthropic,claude-sonnet-4-latest", "qwen,qwen3-coder-plus"],
    priority: "high"
  },

  // Deep reasoning → Anthropic Claude with cost consideration
  REASONING: {
    patterns: [
      /\b(architect|design|analyze|plan|strategy|structure|system|trade-?off)\b/i,
      /\b(why|explain|reason|understand|compare|evaluate|consider|review)\b/i,
      /\b(decision|approach|best practice|pattern|principle|philosophy)\b/i
    ],
    route: "anthropic,claude-sonnet-4-latest",
    strategy: "quality",
    fallbacks: ["openai,gpt-4o", "gemini,gemini-2.5-pro"],
    priority: "high"
  },

  // Fast responses → Gemini Flash
  FAST: {
    patterns: [
      /\b(fast|quick|brief|short|summary|tldr|overview|hızlı)\b/i,
      /\b(scan|check|verify|validate)\b/i
    ],
    route: "gemini,gemini-2.5-flash",
    strategy: "performance",
    fallbacks: ["qwen,qwen-turbo", "glm,glm-4.5"],
    priority: "medium"
  },

  // Simple/cheap tasks → Qwen
  SIMPLE: {
    patterns: [
      /\b(list|show|what is|simple|basic|help|how to|format)\b/i,
      /\b(rename|move|delete|create file|mkdir|copy)\b/i,
      /\b(ucuz|basit|kolay)\b/i
    ],
    route: "qwen,qwen-plus",
    strategy: "cost",
    fallbacks: ["glm,glm-4.5", "gemini,gemini-2.5-flash"],
    priority: "low"
  },

  // Multilingual → GLM
  MULTILINGUAL: {
    patterns: [
      /\b(translate|çevir|tercüme|chinese|türkçe|multilingual)\b/i,
      /[\u4e00-\u9fff]/, // Chinese characters
      /[\u0600-\u06FF]/, // Arabic
    ],
    route: "glm,glm-4.6",
    strategy: "quality",
    fallbacks: ["qwen,qwen-plus", "gemini,gemini-2.5-flash"],
    priority: "medium"
  },

  // Heavy reasoning → O1
  HEAVY_REASONING: {
    patterns: [
      /\b(complex algorithm|optimization|performance critical|system design)\b/i,
      /\b(prove|mathematical|theorem|formal verification)\b/i
    ],
    route: "openai,o1",
    strategy: "quality",
    fallbacks: ["anthropic,claude-sonnet-4-latest", "openai,gpt-4o"],
    priority: "highest"
  },

  // AgentSkills commands → Anthropic with specialized routing
  AGENT_SKILLS: {
    patterns: [
      /\b\/sc:[\w-]+\b/i,  // All /sc: commands
      /\b(business panel|expert analysis|strategic review)\b/i,
      /\b(mcp:|context7|magic|morphllm|playwright|serena)\b/i,
      /\b(skill:|capability:|expertise:)\b/i
    ],
    route: "anthropic,claude-sonnet-4-latest",
    strategy: "quality",
    fallbacks: ["openai,gpt-4o", "gemini,gemini-2.5-pro"],
    priority: "highest"
  }
};

// Provider capabilities and costs
const PROVIDER_PROFILES = {
  openai: {
    costTier: "medium",
    performanceTier: "high",
    qualityTier: "high",
    speedTier: "medium",
    specialties: ["coding", "reasoning", "math"],
    models: {
      "gpt-4o": { cost: 1, speed: 1, quality: 1, capability: "general" },
      "gpt-4o-mini": { cost: 0.1, speed: 1.5, quality: 0.8, capability: "general" },
      "gpt-4-turbo": { cost: 2, speed: 1, quality: 1.1, capability: "general" },
      "o1": { cost: 3, speed: 0.3, quality: 1.3, capability: "reasoning" },
      "o1-mini": { cost: 0.6, speed: 0.5, quality: 1.1, capability: "reasoning" }
    }
  },
  anthropic: {
    costTier: "high",
    performanceTier: "high",
    qualityTier: "highest",
    speedTier: "medium",
    specialties: ["reasoning", "writing", "analysis", "safety"],
    models: {
      "claude-sonnet-4-latest": { cost: 3, speed: 1, quality: 1.3, capability: "general" },
      "claude-3-5-sonnet-latest": { cost: 0.6, speed: 1.2, quality: 1, capability: "general" },
      "claude-3-5-haiku-latest": { cost: 0.2, speed: 2, quality: 0.7, capability: "general" }
    }
  },
  gemini: {
    costTier: "low",
    performanceTier: "high",
    qualityTier: "medium",
    speedTier: "highest",
    specialties: ["speed", "context", "multilingual"],
    models: {
      "gemini-2.5-flash": { cost: 0.01, speed: 3, quality: 0.8, capability: "general" },
      "gemini-2.5-pro": { cost: 0.25, speed: 1.5, quality: 1, capability: "general" },
      "gemini-2.0-flash": { cost: 0.01, speed: 3, quality: 0.7, capability: "general" }
    }
  },
  qwen: {
    costTier: "low",
    performanceTier: "medium",
    qualityTier: "medium",
    speedTier: "high",
    specialties: ["cost-effective", "multilingual", "coding"],
    models: {
      "qwen-plus": { cost: 0.1, speed: 2, quality: 0.8, capability: "general" },
      "qwen-max": { cost: 0.4, speed: 1.5, quality: 1, capability: "general" },
      "qwen-turbo": { cost: 0.03, speed: 2.5, quality: 0.6, capability: "general" },
      "qwen3-coder-plus": { cost: 0.4, speed: 1.8, quality: 1.1, capability: "coding" }
    }
  },
  glm: {
    costTier: "low",
    performanceTier: "medium",
    qualityTier: "medium",
    speedTier: "high",
    specialties: ["chinese", "multilingual", "translation"],
    models: {
      "glm-4.6": { cost: 0.1, speed: 2, quality: 0.8, capability: "multilingual" },
      "glm-4.5": { cost: 0.1, speed: 2, quality: 0.8, capability: "multilingual" },
      "glm-4-plus": { cost: 0.2, speed: 1.5, quality: 0.9, capability: "general" }
    }
  },
  openrouter: {
    costTier: "variable",
    performanceTier: "variable",
    qualityTier: "variable",
    speedTier: "variable",
    specialties: ["variety", "fallback", "specialized"],
    models: {
      "deepseek/deepseek-chat": { cost: 0.14, speed: 1.5, quality: 0.9, capability: "coding" },
      "meta-llama/llama-3.2-3b-instruct": { cost: 0.1, speed: 2.5, quality: 0.7, capability: "general" }
    }
  }
};

// Smart routing strategies
const ROUTING_STRATEGIES = {
  cost: {
    name: "Cost-Optimized",
    select: (candidates) => {
      // Sort by cost (ascending)
      return candidates.sort((a, b) => {
        const costA = PROVIDER_PROFILES[a.provider]?.models[a.model]?.cost || 999;
        const costB = PROVIDER_PROFILES[b.provider]?.models[b.model]?.cost || 999;
        return costA - costB;
      });
    }
  },

  performance: {
    name: "Performance-Optimized",
    select: (candidates) => {
      // Sort by speed (descending)
      return candidates.sort((a, b) => {
        const speedA = PROVIDER_PROFILES[a.provider]?.models[a.model]?.speed || 0;
        const speedB = PROVIDER_PROFILES[b.provider]?.models[b.model]?.speed || 0;
        return speedB - speedA;
      });
    }
  },

  quality: {
    name: "Quality-Optimized",
    select: (candidates) => {
      // Sort by quality (descending)
      return candidates.sort((a, b) => {
        const qualityA = PROVIDER_PROFILES[a.provider]?.models[a.model]?.quality || 0;
        const qualityB = PROVIDER_PROFILES[b.provider]?.models[b.model]?.quality || 0;
        return qualityB - qualityA;
      });
    }
  },

  adaptive: {
    name: "Adaptive",
    select: (candidates, metrics, intent) => {
      // Consider historical performance
      const scored = candidates.map(candidate => {
        let score = 0;
        const profile = PROVIDER_PROFILES[candidate.provider]?.models[candidate.model];

        if (!profile) return { ...candidate, score: 0 };

        // Base score from profile
        score += profile.quality * 2;
        score += profile.speed;
        score -= profile.cost * 0.5;

        // Historical performance adjustment
        const historical = getHistoricalPerformance(candidate.provider, candidate.model, intent, metrics);
        score += historical.performanceModifier;

        return { ...candidate, score };
      });

      return scored.sort((a, b) => b.score - a.score);
    }
  }
};

// Get historical performance for provider/model combination
function getHistoricalPerformance(provider, model, intent, metrics) {
  const key = `${provider}/${model}`;
  const intentMetrics = metrics.intents[intent] || {};
  const providerMetrics = metrics.providers[key] || {};

  // Default performance
  const performance = {
    avgLatency: 3000,
    successRate: 0.95,
    costPerRequest: 0.01,
    performanceModifier: 0
  };

  // Apply historical data
  if (providerMetrics.avgLatency) {
    performance.avgLatency = providerMetrics.avgLatency;
    performance.performanceModifier -= (performance.avgLatency - 3000) / 10000; // Penalty for slow
  }

  if (providerMetrics.successRate) {
    performance.successRate = providerMetrics.successRate;
    performance.performanceModifier += (performance.successRate - 0.95) * 10; // Bonus for reliability
  }

  if (intentMetrics.avgLatency) {
    performance.performanceModifier -= (intentMetrics.avgLatency - 3000) / 8000;
  }

  return performance;
}

// Extract content from request
function extractContent(req) {
  const messages = req.body?.messages || [];
  return messages
    .filter(m => m.role === "user" || m.role === "system")
    .map(m => typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    .join(" ")
    .slice(0, 3000); // Limit for performance
}

// Detect intent with scoring
function detectIntent(content) {
  const scores = {};

  // Calculate scores for each intent
  for (const [intent, config] of Object.entries(INTENTS)) {
    scores[intent] = config.patterns.reduce((score, pattern) => {
      const matches = (content.match(pattern) || []).length;
      return score + matches;
    }, 0);

    // Apply priority weighting
    const priorityWeight = {
      highest: 1.5,
      high: 1.3,
      medium: 1.0,
      low: 0.8
    };
    scores[intent] *= priorityWeight[config.priority] || 1.0;
  }

  // Sort by score and filter out zero scores
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  return sorted.length > 0 ? {
    intent: sorted[0][0],
    confidence: sorted[0][1],
    alternatives: sorted.slice(1, 3)
  } : null;
}

// Get available providers from config
function getAvailableProviders(config) {
  const providers = [];

  if (config.Providers) {
    config.Providers.forEach(provider => {
      provider.models.forEach(model => {
        providers.push({
          provider: provider.name,
          model,
          route: `${provider.name},${model}`
        });
      });
    });
  }

  return providers;
}

// Generate candidates for routing
function generateCandidates(detectedIntent, availableProviders) {
  const candidates = [];

  if (!detectedIntent || !availableProviders.length) {
    return candidates;
  }

  // Add primary route
  const primary = availableProviders.find(p => p.route === detectedIntent.route);
  if (primary) {
    candidates.push({
      ...primary,
      source: 'primary',
      reason: 'Intent match'
    });
  }

  // Add fallbacks
  if (INTENTS[detectedIntent.intent]?.fallbacks) {
    INTENTS[detectedIntent.intent].fallbacks.forEach((fallbackRoute, index) => {
      const fallback = availableProviders.find(p => p.route === fallbackRoute);
      if (fallback) {
        candidates.push({
          ...fallback,
          source: 'fallback',
          priority: index + 1,
          reason: `Fallback ${index + 1}`
        });
      }
    });
  }

  return candidates;
}

// Apply routing strategy
function applyRoutingStrategy(candidates, strategy, metrics, intent) {
  if (!candidates.length) return null;

  const router = ROUTING_STRATEGIES[strategy] || ROUTING_STRATEGIES.adaptive;
  const sorted = router.select(candidates, metrics, intent?.intent);

  return sorted[0];
}

// Main router function
module.exports = async function smartRouter(req, config) {
  const metrics = loadMetrics();
  const startTime = Date.now();

  try {
    // Extract content and detect intent
    const content = extractContent(req);
    const detectedIntent = detectIntent(content);

    // Get available providers
    const availableProviders = getAvailableProviders(config);

    // Generate routing candidates
    const candidates = generateCandidates(detectedIntent, availableProviders);

    // Determine routing strategy
    let strategy = 'adaptive'; // Default

    // Override strategy based on intent or config
    if (detectedIntent && INTENTS[detectedIntent.intent]) {
      strategy = INTENTS[detectedIntent.intent].strategy;
    }

    // Check for cost/quality optimization settings in config
    if (config.CostOptimization?.enabled) {
      strategy = 'cost';
    } else if (config.PerformanceOptimization?.enabled) {
      strategy = 'performance';
    } else if (config.QualityOptimization?.enabled) {
      strategy = 'quality';
    }

    // Apply routing strategy
    const selected = applyRoutingStrategy(candidates, strategy, metrics, detectedIntent);

    if (selected) {
      const latency = Date.now() - startTime;

      // Log routing decision
      console.log(`[SmartRouter] ${detectedIntent?.intent || 'unknown'} → ${selected.route} (${strategy}, ${selected.reason})`);

      // Update metrics
      updateRoutingMetrics(metrics, detectedIntent, selected, latency);

      return selected.route;
    }

    // Ultimate fallback - use config default or first available
    const fallback = config.Router?.default || availableProviders[0]?.route;
    console.log(`[SmartRouter] No match → ${fallback}`);

    return fallback;

  } catch (error) {
    console.error('[SmartRouter] Error:', error);
    return config.Router?.default || null;
  } finally {
    saveMetrics(metrics);
  }
};

// Update routing metrics
function updateRoutingMetrics(metrics, intent, selected, latency) {
  const timestamp = new Date().toISOString();
  const key = `${selected.provider}/${selected.model}`;

  // Track request
  metrics.requests.push({
    timestamp,
    intent: intent?.intent || 'unknown',
    provider: selected.provider,
    model: selected.model,
    latency,
    source: selected.source
  });

  // Update provider metrics
  if (!metrics.providers[key]) {
    metrics.providers[key] = {
      requests: 0,
      totalLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      errors: 0
    };
  }

  const providerMetrics = metrics.providers[key];
  providerMetrics.requests++;
  providerMetrics.totalLatency += latency;
  providerMetrics.minLatency = Math.min(providerMetrics.minLatency, latency);
  providerMetrics.maxLatency = Math.max(providerMetrics.maxLatency, latency);

  // Update intent metrics
  if (intent?.intent) {
    if (!metrics.intents[intent.intent]) {
      metrics.intents[intent.intent] = {
        requests: 0,
        totalLatency: 0,
        avgLatency: 0
      };
    }

    const intentMetrics = metrics.intents[intent.intent];
    intentMetrics.requests++;
    intentMetrics.totalLatency += latency;
    intentMetrics.avgLatency = intentMetrics.totalLatency / intentMetrics.requests;
  }
}

// Export utilities for testing
module.exports.INTENTS = INTENTS;
module.exports.PROVIDER_PROFILES = PROVIDER_PROFILES;
module.exports.ROUTING_STRATEGIES = ROUTING_STRATEGIES;