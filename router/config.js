const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.claude-code-router');
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, 'config.json');
const DEFAULT_ENV_PATH = path.join(os.homedir(), '.env');
let envLoaded = false;

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const withoutExport = trimmed.startsWith('export ')
    ? trimmed.slice('export '.length).trim()
    : trimmed;

  const separatorIndex = withoutExport.indexOf('=');
  if (separatorIndex === -1) return null;

  const key = withoutExport.slice(0, separatorIndex).trim();
  if (!key) return null;

  let value = withoutExport.slice(separatorIndex + 1).trim();
  const hasQuotes = (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith('\'') && value.endsWith('\''));
  if (hasQuotes) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function getEnvPath() {
  return process.env.CCR_ENV_PATH || DEFAULT_ENV_PATH;
}

function loadDotenv() {
  if (envLoaded) return;
  envLoaded = true;

  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed) return;
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  });
}

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

function readEnvFile() {
  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) {
    return { path: envPath, entries: {} };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const entries = {};
  content.split(/\r?\n/).forEach((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed) return;
    entries[parsed.key] = parsed.value;
  });

  return { path: envPath, entries };
}

function formatEnvValue(value) {
  const safe = /^[A-Za-z0-9_./:@-]+$/.test(value);
  if (safe) return value;
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  return `"${escaped}"`;
}

function writeEnvValue(key, value) {
  const envPath = getEnvPath();
  const normalizedKey = String(key || '').trim();
  if (!/^[A-Za-z0-9_]+$/.test(normalizedKey)) {
    throw new Error('Invalid environment key');
  }

  const normalizedValue = value === undefined || value === null ? '' : String(value);
  const formattedValue = formatEnvValue(normalizedValue);

  let lines = [];
  let updated = false;

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    lines = content.split(/\r?\n/);
  }

  lines = lines.map((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed || parsed.key !== normalizedKey) return line;
    const prefix = line.trim().startsWith('export ') ? 'export ' : '';
    updated = true;
    return `${prefix}${normalizedKey}=${formattedValue}`;
  });

  if (!updated) {
    lines.push(`${normalizedKey}=${formattedValue}`);
  }

  const output = lines.filter((line, index, arr) => {
    if (index === arr.length - 1) return true;
    return line !== '' || arr[index + 1] !== '';
  });

  fs.writeFileSync(envPath, `${output.join('\n')}\n`, 'utf8');

  return { path: envPath, updated: true };
}

function resolveConfigValue(value, key) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveConfigValue(item, key));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, val]) => [
        childKey,
        resolveConfigValue(val, childKey)
      ])
    );
  }
  if (key === 'api_key') return value;
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
  loadDotenv();
  const configPath = process.env.CCR_CONFIG_PATH || DEFAULT_CONFIG_PATH;
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const resolved = resolveConfigValue(raw, null);
  return applyDefaults(resolved);
}

function getConfigPath() {
  return process.env.CCR_CONFIG_PATH || DEFAULT_CONFIG_PATH;
}

function getConfigDir() {
  return process.env.CCR_CONFIG_DIR || DEFAULT_CONFIG_DIR;
}

function resolveProviderKey(provider) {
  loadDotenv();
  if (!provider?.api_key) return null;
  if (typeof provider.api_key === 'string' && provider.api_key.startsWith('$')) {
    const envKey = provider.api_key.slice(1);
    return process.env[envKey] || null;
  }
  return provider.api_key;
}

module.exports = {
  loadConfig,
  getEnvPath,
  readEnvFile,
  writeEnvValue,
  getConfigPath,
  getConfigDir,
  resolveProviderKey
};
