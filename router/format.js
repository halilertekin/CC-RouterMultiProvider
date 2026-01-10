const crypto = require('crypto');

function toText(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return JSON.stringify(value);
}

function normalizeAnthropicSystem(system) {
  if (!system) return '';
  if (typeof system === 'string') return system;
  if (Array.isArray(system)) {
    return system
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text') return item.text || '';
        return toText(item);
      })
      .join('\n');
  }
  return toText(system);
}

function anthropicMessagesToOpenAI(messages = []) {
  return messages.map((message) => {
    if (typeof message?.content === 'string') {
      return { role: message.role, content: message.content };
    }
    if (Array.isArray(message?.content)) {
      const text = message.content
        .map((part) => {
          if (part?.type === 'text') return part.text || '';
          return toText(part);
        })
        .join('');
      return { role: message.role, content: text };
    }
    return { role: message.role, content: toText(message?.content) };
  });
}

function openAIMessagesToAnthropic(messages = []) {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => {
      if (typeof message.content === 'string') {
        return { role: message.role, content: message.content };
      }
      if (Array.isArray(message.content)) {
        const parts = message.content
          .map((part) => {
            if (part?.type === 'text') {
              return { type: 'text', text: part.text || '' };
            }
            return { type: 'text', text: toText(part) };
          });
        return { role: message.role, content: parts };
      }
      return { role: message.role, content: toText(message.content) };
    });
}

function openAIToolsToAnthropic(tools = []) {
  return tools
    .map((tool) => {
      if (tool?.type === 'function' && tool.function) {
        return {
          name: tool.function.name,
          description: tool.function.description || '',
          input_schema: tool.function.parameters || {}
        };
      }
      return null;
    })
    .filter(Boolean);
}

function anthropicToolsToOpenAI(tools = []) {
  return tools
    .map((tool) => {
      if (!tool?.name) return null;
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.input_schema || {}
        }
      };
    })
    .filter(Boolean);
}

function anthropicToOpenAI(body) {
  const system = normalizeAnthropicSystem(body.system);
  const messages = anthropicMessagesToOpenAI(body.messages || []);
  const openAIMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const openai = {
    model: body.model,
    messages: openAIMessages,
    stream: Boolean(body.stream),
    temperature: body.temperature,
    max_tokens: body.max_tokens
  };

  if (body.top_p != null) openai.top_p = body.top_p;
  if (body.tools) openai.tools = anthropicToolsToOpenAI(body.tools);
  if (body.tool_choice) openai.tool_choice = body.tool_choice;
  if (body.metadata) openai.metadata = body.metadata;

  return openai;
}

function openAIToAnthropic(body) {
  const systemMessages = (body.messages || []).filter((m) => m.role === 'system');
  const system = systemMessages.map((m) => toText(m.content)).join('\n');
  const messages = openAIMessagesToAnthropic(body.messages || []);

  const anthropic = {
    model: body.model,
    messages,
    system: system || undefined,
    stream: Boolean(body.stream),
    max_tokens: body.max_tokens,
    temperature: body.temperature
  };

  if (body.top_p != null) anthropic.top_p = body.top_p;
  if (body.tools) anthropic.tools = openAIToolsToAnthropic(body.tools);
  if (body.tool_choice) anthropic.tool_choice = body.tool_choice;
  if (body.metadata) anthropic.metadata = body.metadata;

  return anthropic;
}

function extractOpenAIText(response) {
  const choice = response?.choices?.[0];
  if (!choice) return '';
  if (choice.message?.content) return choice.message.content;
  if (choice.delta?.content) return choice.delta.content;
  return '';
}

function extractAnthropicText(response) {
  if (!Array.isArray(response?.content)) return toText(response?.content);
  return response.content
    .map((part) => (part?.type === 'text' ? part.text || '' : toText(part)))
    .join('');
}

function openAIResponseToAnthropic(response, fallbackModel) {
  const text = extractOpenAIText(response);
  const id = response?.id || `msg_${crypto.randomUUID()}`;
  const model = response?.model || fallbackModel;
  const finish = response?.choices?.[0]?.finish_reason || 'stop';

  return {
    id,
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text }],
    stop_reason: finish,
    usage: {
      input_tokens: response?.usage?.prompt_tokens || 0,
      output_tokens: response?.usage?.completion_tokens || 0
    }
  };
}

function anthropicResponseToOpenAI(response, fallbackModel) {
  const text = extractAnthropicText(response);
  const model = response?.model || fallbackModel;
  const created = Math.floor(Date.now() / 1000);
  const finish = response?.stop_reason || 'stop';
  const promptTokens = response?.usage?.input_tokens || 0;
  const completionTokens = response?.usage?.output_tokens || 0;

  return {
    id: response?.id || `chatcmpl_${crypto.randomUUID()}`,
    object: 'chat.completion',
    created,
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: finish
      }
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };
}

module.exports = {
  anthropicToOpenAI,
  openAIToAnthropic,
  openAIResponseToAnthropic,
  anthropicResponseToOpenAI,
  anthropicToolsToOpenAI,
  openAIToolsToAnthropic
};
