const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.claude-code-router');
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, 'config.json');

function resolveEnv(value) {
  if (typeof value !== 'string') return value;

  const withHome = value
    .replace(/\$HOME/g, os.homedir())
    .replace(/\${HOME}/g, os.homedir());

  if (!withHome.includes('$')) return withHome;

  return withHome.replace(/\$([A-Z0-9_]+)/gi, (_, key) => {
    return process.env[key] ?? '';
  });
}

function resolveConfigValue(value) {
  if (Array.isArray(value)) {
    return value.map(resolveConfigValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, resolveConfigValue(val)])
    );
  }
  return resolveEnv(value);
}

function applyDefaults(config) {
  const defaults = {
    HOST: '127.0.0.1',
    PORT: 3456,
    LOG: true,
    LOG_LEVEL: 'info',
    API_TIMEOUT_MS: 300000
  };

  return {
    ...defaults,
    ...config
  };
}

function loadConfig() {
  const configPath = process.env.CCR_CONFIG_PATH || DEFAULT_CONFIG_PATH;
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const resolved = resolveConfigValue(raw);
  return applyDefaults(resolved);
}

function getConfigPath() {
  return process.env.CCR_CONFIG_PATH || DEFAULT_CONFIG_PATH;
}

function getConfigDir() {
  return process.env.CCR_CONFIG_DIR || DEFAULT_CONFIG_DIR;
}

function resolveProviderKey(provider) {
  if (!provider?.api_key) return null;
  if (typeof provider.api_key === 'string' && provider.api_key.startsWith('$')) {
    const envKey = provider.api_key.slice(1);
    return process.env[envKey] || null;
  }
  return provider.api_key;
}

module.exports = {
  loadConfig,
  getConfigPath,
  getConfigDir,
  resolveProviderKey
};
