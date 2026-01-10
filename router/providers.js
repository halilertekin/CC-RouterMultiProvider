const { resolveProviderKey } = require('./config');

function inferProviderFormat(provider) {
  const name = (provider?.name || '').toLowerCase();
  const baseUrl = provider?.api_base_url || '';
  const transformers = provider?.transformer?.use || [];

  if (name === 'anthropic' || name === 'glm') return 'anthropic';
  if (baseUrl.includes('/v1/messages') || baseUrl.includes('/anthropic')) return 'anthropic';
  if (transformers.some((t) => t.toLowerCase() === 'anthropic')) return 'anthropic';

  return 'openai';
}

function resolveAuthHeader(provider, apiKey) {
  if (!apiKey) return {};

  const name = (provider?.name || '').toLowerCase();
  const headerName = provider.api_key_header
    || (name === 'gemini' ? 'x-goog-api-key' : 'authorization');
  const headerValue = headerName.toLowerCase() === 'authorization'
    ? `Bearer ${apiKey}`
    : apiKey;

  return { [headerName]: headerValue };
}

function buildProviderHeaders(provider) {
  const apiKey = resolveProviderKey(provider);
  const headers = {
    'content-type': 'application/json',
    ...resolveAuthHeader(provider, apiKey),
    ...(provider.headers || {})
  };

  if (inferProviderFormat(provider) === 'anthropic') {
    headers['anthropic-version'] = headers['anthropic-version'] || '2023-06-01';
  }

  if ((provider?.name || '').toLowerCase() === 'openrouter') {
    const referer = provider.referer || process.env.OPENROUTER_REFERRER;
    const title = provider.app_name || process.env.OPENROUTER_APP_NAME;
    if (referer) headers['http-referer'] = referer;
    if (title) headers['x-title'] = title;
  }

  return { headers, apiKey };
}

module.exports = {
  inferProviderFormat,
  buildProviderHeaders
};
