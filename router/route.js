const fs = require('fs');

function estimateTokens(messages = [], system) {
  const systemText = Array.isArray(system)
    ? system.map((s) => (typeof s === 'string' ? s : s?.text || '')).join(' ')
    : (system || '');
  const messageText = (messages || [])
    .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')))
    .join(' ');
  const text = `${systemText} ${messageText}`;
  return Math.max(1, Math.ceil(text.length / 4));
}

function parseExplicitRoute(model) {
  if (!model || !model.includes(',')) return null;
  const [provider, ...rest] = model.split(',');
  const modelName = rest.join(',');
  return provider && modelName ? { provider, model: modelName } : null;
}

function extractSubagentModel(system) {
  const systemText = Array.isArray(system)
    ? system.map((item) => (item?.text ? item.text : '')).join(' ')
    : (system || '');
  const match = systemText.match(/<CCR-SUBAGENT-MODEL>(.*?)<\/CCR-SUBAGENT-MODEL>/s);
  return match ? match[1].trim() : null;
}

function loadCustomRouter(routerPath) {
  try {
    if (!routerPath) return null;
    if (!fs.existsSync(routerPath)) return null;
    delete require.cache[require.resolve(routerPath)];
    return require(routerPath);
  } catch {
    return null;
  }
}

async function resolveRoute(req, config) {
  if (!req?.body) return config.Router?.default || null;

  const explicit = parseExplicitRoute(req.body.model);
  if (explicit) {
    return `${explicit.provider},${explicit.model}`;
  }

  const tokenCount = estimateTokens(req.body.messages || [], req.body.system);
  req.tokenCount = tokenCount;

  const subagentModel = extractSubagentModel(req.body.system);
  if (subagentModel) {
    return subagentModel;
  }

  const customRouter = loadCustomRouter(config.CUSTOM_ROUTER_PATH);
  if (customRouter) {
    try {
      const route = await customRouter(req, config);
      if (route) return route;
    } catch {
      // Fall through to defaults
    }
  }

  const routerConfig = config.Router || {};
  const longContextThreshold = routerConfig.longContextThreshold || 60000;
  if (tokenCount > longContextThreshold && routerConfig.longContext) {
    return routerConfig.longContext;
  }

  if (req.body.thinking && routerConfig.think) {
    return routerConfig.think;
  }

  if (Array.isArray(req.body.tools) && req.body.tools.some((tool) => {
    return typeof tool?.type === 'string' && tool.type.startsWith('web_search');
  }) && routerConfig.webSearch) {
    return routerConfig.webSearch;
  }

  if (req.body.model?.includes('haiku') && routerConfig.background) {
    return routerConfig.background;
  }

  return routerConfig.default || null;
}

module.exports = {
  resolveRoute,
  parseExplicitRoute,
  estimateTokens
};
