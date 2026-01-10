const crypto = require('crypto');
const { createParser } = require('eventsource-parser');

function setStreamHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

function writeAnthropicEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function writeOpenAIEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function pipeStream(res, upstream, headers) {
  if (headers?.['content-type']) {
    res.setHeader('Content-Type', headers['content-type']);
  } else {
    setStreamHeaders(res);
  }
  for await (const chunk of upstream) {
    res.write(chunk);
  }
  res.end();
}

async function streamOpenAIToAnthropic(upstream, res, { model }) {
  setStreamHeaders(res);

  const messageId = `msg_${crypto.randomUUID()}`;
  let started = false;
  let finished = false;

  const parser = createParser((event) => {
    if (event.type !== 'event') return;
    if (!event.data) return;

    if (event.data === '[DONE]') {
      if (!finished) {
        writeAnthropicEvent(res, 'message_stop', {
          type: 'message_stop'
        });
        finished = true;
      }
      return;
    }

    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    const delta = payload?.choices?.[0]?.delta;
    const text = delta?.content;
    if (text == null) return;

    if (!started) {
      writeAnthropicEvent(res, 'message_start', {
        type: 'message_start',
        message: {
          id: messageId,
          type: 'message',
          role: 'assistant',
          model,
          content: []
        }
      });
      writeAnthropicEvent(res, 'content_block_start', {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' }
      });
      started = true;
    }

    writeAnthropicEvent(res, 'content_block_delta', {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text }
    });
  });

  for await (const chunk of upstream) {
    parser.feed(chunk.toString());
  }

  if (!finished) {
    writeAnthropicEvent(res, 'message_stop', { type: 'message_stop' });
  }
  res.end();
}

async function streamAnthropicToOpenAI(upstream, res, { model }) {
  setStreamHeaders(res);

  const responseId = `chatcmpl_${crypto.randomUUID()}`;
  let started = false;

  const parser = createParser((event) => {
    if (event.type !== 'event') return;
    if (!event.data) return;

    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (payload.type === 'content_block_delta') {
      const text = payload.delta?.text || '';
      if (!started) {
        writeOpenAIEvent(res, {
          id: responseId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }]
        });
        started = true;
      }
      if (text) {
        writeOpenAIEvent(res, {
          id: responseId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
        });
      }
    }

    if (payload.type === 'message_stop') {
      res.write('data: [DONE]\n\n');
    }
  });

  for await (const chunk of upstream) {
    parser.feed(chunk.toString());
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

module.exports = {
  pipeStream,
  streamOpenAIToAnthropic,
  streamAnthropicToOpenAI,
  setStreamHeaders
};
