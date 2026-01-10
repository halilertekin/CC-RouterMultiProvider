#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  loadConfig,
  getConfigPath,
  getConfigDir,
  readEnvFile,
  writeEnvValue
} = require('./config');
const { resolveRoute, estimateTokens } = require('./route');
const {
  anthropicToOpenAI,
  openAIToAnthropic,
  openAIResponseToAnthropic,
  anthropicResponseToOpenAI
} = require('./format');
const { inferProviderFormat, buildProviderHeaders } = require('./providers');
const { sendJsonRequest, sendStreamRequest } = require('./http');
const { readStream } = require('./http');
const {
  pipeStream,
  streamOpenAIToAnthropic,
  streamAnthropicToOpenAI
} = require('./stream');
const { recordRequest, calculateCost, getTodayAnalytics, getAnalyticsSummary, exportAnalytics } = require('../cli/analytics');
const { logger } = require('../logging/enhanced-logger');
const { HealthMonitor } = require('../logging/health-monitor');

function getRequestFormat(req) {
  return req.path.startsWith('/v1/messages') ? 'anthropic' : 'openai';
}

function pickProvider(route, config) {
  if (!route) return null;
  const [providerName, ...modelParts] = route.split(',');
  const model = modelParts.join(',').trim();
  const provider = config.Providers.find(
    (p) => p.name.toLowerCase() === providerName.toLowerCase()
  );
  if (!provider) return null;
  return {
    provider,
    model: model || provider.models?.[0]
  };
}

function ensureAnthropicDefaults(body) {
  if (!body.max_tokens) {
    body.max_tokens = 1024;
  }
  return body;
}

function extractUsage(providerFormat, response) {
  if (providerFormat === 'anthropic') {
    return {
      inputTokens: response?.usage?.input_tokens || 0,
      outputTokens: response?.usage?.output_tokens || 0
    };
  }
  return {
    inputTokens: response?.usage?.prompt_tokens || 0,
    outputTokens: response?.usage?.completion_tokens || 0
  };
}

function buildFallbackRoutes(config, usedRoute) {
  const fallbackRoutes = [];
  const routerFallbacks = config.Router?.fallbacks || [];
  for (const route of routerFallbacks) {
    if (route && route !== usedRoute) fallbackRoutes.push(route);
  }

  if (config.Router?.default && config.Router.default !== usedRoute) {
    fallbackRoutes.push(config.Router.default);
  }

  config.Providers.forEach((provider) => {
    const model = provider.models?.[0];
    const route = model ? `${provider.name},${model}` : null;
    if (route && route !== usedRoute && !fallbackRoutes.includes(route)) {
      fallbackRoutes.push(route);
    }
  });

  return fallbackRoutes;
}

async function handleProxy(req, res) {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const requestFormat = getRequestFormat(req);
  const route = await resolveRoute(req, config);
  let selection = pickProvider(route, config);

  if (!selection) {
    res.status(400).json({ error: 'No matching provider found' });
    return;
  }

  let providerFormat = inferProviderFormat(selection.provider);
  let { headers, apiKey } = buildProviderHeaders(selection.provider);

  if (!apiKey) {
    res.status(400).json({ error: `Missing API key for provider ${selection.provider.name}` });
    return;
  }

  let outgoingBody;
  if (requestFormat === providerFormat) {
    outgoingBody = { ...req.body };
  } else if (providerFormat === 'openai') {
    outgoingBody = anthropicToOpenAI(req.body);
  } else {
    outgoingBody = openAIToAnthropic(req.body);
  }

  outgoingBody.model = selection.model;
  if (providerFormat === 'anthropic') {
    ensureAnthropicDefaults(outgoingBody);
  }

  const timeoutMs = config.API_TIMEOUT_MS || 300000;
  const upstreamUrl = selection.provider.api_base_url;

  const start = Date.now();
  const shouldStream = Boolean(outgoingBody.stream);

  const attemptRequest = async () => {
    if (shouldStream) {
      return sendStreamRequest({
        url: upstreamUrl,
        headers,
        body: outgoingBody,
        timeoutMs
      });
    }
    return sendJsonRequest({
      url: upstreamUrl,
      headers,
      body: outgoingBody,
      timeoutMs
    });
  };

  let upstream;
  let usedRoute = route;

  try {
    upstream = await attemptRequest();
  } catch (error) {
    const fallbacks = buildFallbackRoutes(config, usedRoute);
    for (const fallback of fallbacks) {
      const fallbackSelection = pickProvider(fallback, config);
      if (!fallbackSelection) continue;

      const fallbackFormat = inferProviderFormat(fallbackSelection.provider);
      const fallbackHeaders = buildProviderHeaders(fallbackSelection.provider).headers;

      outgoingBody.model = fallbackSelection.model;
      if (fallbackFormat === 'anthropic') {
        ensureAnthropicDefaults(outgoingBody);
      }

      try {
        upstream = shouldStream
          ? await sendStreamRequest({
              url: fallbackSelection.provider.api_base_url,
              headers: fallbackHeaders,
              body: outgoingBody,
              timeoutMs
            })
          : await sendJsonRequest({
              url: fallbackSelection.provider.api_base_url,
              headers: fallbackHeaders,
              body: outgoingBody,
              timeoutMs
            });
        usedRoute = fallback;
        selection = fallbackSelection;
        providerFormat = fallbackFormat;
        headers = fallbackHeaders;
        break;
      } catch {
        continue;
      }
    }
  }

  if (!upstream) {
    res.status(502).json({ error: 'Failed to reach provider' });
    return;
  }

  if (shouldStream) {
    if (upstream.statusCode >= 400) {
      const errorText = await readStream(upstream.body);
      res.status(upstream.statusCode).json({ error: errorText || 'Upstream error' });
      return;
    }

    res.status(200);
    if (requestFormat === providerFormat) {
      await pipeStream(res, upstream.body, upstream.headers);
      return;
    }
    if (providerFormat === 'openai' && requestFormat === 'anthropic') {
      await streamOpenAIToAnthropic(upstream.body, res, { model: selection.model });
      return;
    }
    if (providerFormat === 'anthropic' && requestFormat === 'openai') {
      await streamAnthropicToOpenAI(upstream.body, res, { model: selection.model });
      return;
    }
  }

  if (upstream.statusCode >= 400) {
    res.status(upstream.statusCode).send(upstream.rawBody || { error: 'Upstream error' });
    return;
  }

  let responsePayload;
  try {
    responsePayload = JSON.parse(upstream.rawBody || '{}');
  } catch {
    responsePayload = { error: 'Invalid upstream response' };
  }

  const latency = Date.now() - start;
  const usage = extractUsage(providerFormat, responsePayload);
  const cost = calculateCost(selection.provider.name, selection.model, usage.inputTokens, usage.outputTokens);

  logger.logRequest(selection.provider.name, selection.model, usage.inputTokens, usage.outputTokens, latency, true, cost);
  recordRequest(selection.provider.name, selection.model, usage.inputTokens, usage.outputTokens, latency, true);

  if (requestFormat !== providerFormat) {
    if (requestFormat === 'anthropic') {
      responsePayload = openAIResponseToAnthropic(responsePayload, selection.model);
    } else {
      responsePayload = anthropicResponseToOpenAI(responsePayload, selection.model);
    }
  }

  res.status(200).json(responsePayload);
}

function setupApi(app) {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/v1/messages', handleProxy);
  app.post('/v1/messages/count_tokens', (req, res) => {
    const tokenCount = estimateTokens(req.body?.messages || [], req.body?.system);
    res.json({ input_tokens: tokenCount });
  });
  app.post('/v1/chat/completions', handleProxy);

  app.post('/v1/responses', (req, res) => {
    req.body = req.body || {};
    if (!req.body.messages && req.body.input) {
      if (typeof req.body.input === 'string') {
        req.body.messages = [{ role: 'user', content: req.body.input }];
      } else if (Array.isArray(req.body.input)) {
        req.body.messages = req.body.input;
      } else {
        req.body.messages = [];
      }
    }
    handleProxy(req, res);
  });

  app.get('/api/status', (req, res) => {
    res.json({
      success: true,
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: require('../package.json').version,
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch()
      }
    });
  });

  app.get('/api/config', (req, res) => {
    try {
      const config = loadConfig();
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/env', (req, res) => {
    try {
      const config = loadConfig();
      const envFile = readEnvFile();
      const keys = new Set();

      (config.Providers || []).forEach((provider) => {
        if (typeof provider.api_key === 'string' && provider.api_key.startsWith('$')) {
          keys.add(provider.api_key.slice(1));
        }
      });

      if ((config.Providers || []).some((provider) => provider.name?.toLowerCase() === 'openrouter')) {
        keys.add('OPENROUTER_REFERRER');
        keys.add('OPENROUTER_APP_NAME');
      }

      const data = Array.from(keys)
        .sort()
        .map((key) => {
          const value = process.env[key] || envFile.entries[key] || '';
          return { name: key, present: Boolean(value) };
        });

      res.json({ success: true, data: { envPath: envFile.path, keys: data } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/env', (req, res) => {
    try {
      const key = String(req.body?.key || '').trim();
      const value = req.body?.value;

      if (!key) {
        res.status(400).json({ success: false, error: 'Missing env key' });
        return;
      }

      if (value === undefined || value === null || String(value).trim() === '') {
        res.status(400).json({ success: false, error: 'Missing env value' });
        return;
      }

      const result = writeEnvValue(key, value);
      process.env[key] = String(value);
      res.json({ success: true, data: { key, path: result.path } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/config', (req, res) => {
    try {
      const configPath = getConfigPath();
      const backupDir = path.join(getConfigDir(), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `config-${timestamp}.json`);
      fs.copyFileSync(configPath, backupPath);

      fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
      res.json({ success: true, message: 'Config saved', backup: backupPath });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/config/templates', (req, res) => {
    try {
      const templatesDir = path.join(__dirname, '..', 'templates');
      const files = fs.readdirSync(templatesDir).filter((file) => file.endsWith('.json'));
      const templates = files.map((file) => {
        const content = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf8'));
        return {
          name: file.replace('.json', ''),
          description: content._description || content._comment || '',
          config: content
        };
      });
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/providers', (req, res) => {
    try {
      const config = loadConfig();
      res.json({ success: true, data: config.Providers || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/analytics/today', (req, res) => {
    try {
      res.json({ success: true, data: getTodayAnalytics() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/analytics/summary', (req, res) => {
    try {
      const period = req.query.period || 'week';
      res.json({ success: true, data: getAnalyticsSummary(period) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/analytics/export', (req, res) => {
    try {
      const format = req.query.format || 'json';
      const period = req.query.period || 'all';
      const filepath = exportAnalytics(format, period);
      res.download(filepath, (err) => {
        if (err) {
          res.status(500).json({ success: false, error: 'Export failed' });
        }
        fs.unlink(filepath, () => {});
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/health/providers', async (req, res) => {
    try {
      const config = loadConfig();
      const monitor = new HealthMonitor({ enabled: true });
      config.Providers.forEach((provider) => monitor.addProvider(provider.name, provider));
      const results = await monitor.checkAllProviders();
      res.json({ success: true, data: Object.values(results) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/health/system', (req, res) => {
    const monitor = new HealthMonitor({ enabled: false });
    res.json({
      success: true,
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: monitor.getCPUUsage(),
        nodeVersion: process.version
      }
    });
  });

  app.get('/api/logs/files', (req, res) => {
    try {
      const logDir = path.join(os.homedir(), '.claude-code-router', 'logs');
      const logFiles = [];
      if (fs.existsSync(logDir)) {
        const files = fs.readdirSync(logDir);
        for (const file of files) {
          if (file.endsWith('.log') || file.endsWith('.json')) {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            logFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              lastModified: stats.mtime.toISOString()
            });
          }
        }
      }
      res.json({ success: true, data: logFiles });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/logs', (req, res) => {
    try {
      const filePath = req.query.file
        ? req.query.file
        : path.join(os.homedir(), '.claude-code-router', 'logs', 'app.log');
      if (!fs.existsSync(filePath)) {
        res.json({ success: true, data: [] });
        return;
      }
      const logContent = fs.readFileSync(filePath, 'utf8');
      const logLines = logContent.split('\n').filter((line) => line.trim());
      res.json({ success: true, data: logLines });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/logs', (req, res) => {
    try {
      const filePath = req.query.file
        ? req.query.file
        : path.join(os.homedir(), '.claude-code-router', 'logs', 'app.log');
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf8');
      }
      res.json({ success: true, message: 'Logs cleared' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

function setupUi(app) {
  const uiRoot = path.join(__dirname, '..', 'web-dashboard', 'public');
  app.use('/ui', express.static(uiRoot));
  app.get('/', (req, res) => res.redirect('/ui'));
}

function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    if (req.path === '/health' || req.path.startsWith('/ui')) {
      return next();
    }
    let config;
    try {
      config = loadConfig();
    } catch {
      return next();
    }
    if (!config.APIKEY) {
      return next();
    }
    const authHeader = req.headers.authorization || req.headers['x-api-key'];
    if (!authHeader) {
      res.status(401).json({ error: 'API key missing' });
      return;
    }
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : authHeader;
    if (token !== config.APIKEY) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    next();
  });

  setupApi(app);
  setupUi(app);

  const config = loadConfig();
  logger.level = config.LOG_LEVEL || logger.level;
  logger.enableConsole = config.LOG !== false;

  const host = config.HOST || '127.0.0.1';
  const port = parseInt(config.PORT || 3456, 10);

  app.listen(port, host, () => {
    logger.info(`Router server listening on http://${host}:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
