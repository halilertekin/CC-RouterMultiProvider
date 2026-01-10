const { request } = require('undici');

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function sendJsonRequest({ url, headers, body, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const rawBody = await readStream(response.body);
    return {
      statusCode: response.statusCode,
      headers: response.headers,
      rawBody
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendStreamRequest({ url, headers, body, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const response = await request(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: controller.signal
  });

  response.body.on('end', () => clearTimeout(timeout));
  response.body.on('error', () => clearTimeout(timeout));

  return response;
}

module.exports = {
  sendJsonRequest,
  sendStreamRequest,
  readStream
};
