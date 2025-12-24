#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('./chalk-safe');
const os = require('os');

// Analytics storage path
const analyticsDir = path.join(os.homedir(), '.claude-code-router', 'analytics');
const dataFile = path.join(analyticsDir, 'usage.json');
const costFile = path.join(analyticsDir, 'costs.json');

// Pricing information (approximate, per 1M tokens)
const PRICING = {
  openai: {
    'gpt-4o': { input: 5.0, output: 15.0 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'o1': { input: 15.0, output: 60.0 },
    'o1-mini': { input: 3.0, output: 12.0 }
  },
  anthropic: {
    'claude-sonnet-4-latest': { input: 15.0, output: 75.0 },
    'claude-3-5-sonnet-latest': { input: 3.0, output: 15.0 },
    'claude-3-5-haiku-latest': { input: 1.0, output: 5.0 }
  },
  gemini: {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-pro': { input: 1.25, output: 5.0 },
    'gemini-2.0-flash': { input: 0.075, output: 0.30 }
  },
  qwen: {
    'qwen-plus': { input: 0.5, output: 2.0 },
    'qwen-max': { input: 2.0, output: 6.0 },
    'qwen-turbo': { input: 0.3, output: 0.6 },
    'qwen3-coder-plus': { input: 2.0, output: 6.0 }
  },
  glm: {
    'glm-4.6': { input: 0.5, output: 2.0 },
    'glm-4.5': { input: 0.5, output: 2.0 },
    'glm-4-plus': { input: 1.0, output: 2.0 }
  },
  openrouter: {
    // OpenRouter pricing varies by model
    'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
    'meta-llama/llama-3.2-3b-instruct': { input: 0.10, output: 0.10 }
  }
};

// Initialize analytics directory
function initializeAnalytics() {
  if (!fs.existsSync(analyticsDir)) {
    fs.mkdirSync(analyticsDir, { recursive: true });
  }

  // Initialize data files if they don't exist
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
      requests: [],
      daily: {},
      monthly: {},
      providers: {},
      models: {}
    }, null, 2));
  }

  if (!fs.existsSync(costFile)) {
    fs.writeFileSync(costFile, JSON.stringify({
      daily: {},
      monthly: {},
      providers: {},
      total: 0
    }, null, 2));
  }
}

// Record a request
function recordRequest(provider, model, inputTokens, outputTokens, latency, success = true) {
  initializeAnalytics();

  const timestamp = new Date().toISOString();
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const month = date.substring(0, 7); // YYYY-MM

  const request = {
    timestamp,
    provider,
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    latency,
    success,
    cost: calculateCost(provider, model, inputTokens, outputTokens)
  };

  // Update analytics data
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  // Add request to history
  data.requests.push(request);

  // Update daily stats
  if (!data.daily[date]) {
    data.daily[date] = { requests: 0, tokens: 0, latency: [], providers: {}, models: {} };
  }
  data.daily[date].requests++;
  data.daily[date].tokens += request.totalTokens;
  data.daily[date].latency.push(latency);
  data.daily[date].providers[provider] = (data.daily[date].providers[provider] || 0) + 1;
  data.daily[date].models[model] = (data.daily[date].models[model] || 0) + 1;

  // Update monthly stats
  if (!data.monthly[month]) {
    data.monthly[month] = { requests: 0, tokens: 0, latency: [], providers: {}, models: {} };
  }
  data.monthly[month].requests++;
  data.monthly[month].tokens += request.totalTokens;
  data.monthly[month].latency.push(latency);
  data.monthly[month].providers[provider] = (data.monthly[month].providers[provider] || 0) + 1;
  data.monthly[month].models[model] = (data.monthly[month].models[model] || 0) + 1;

  // Update provider stats
  if (!data.providers[provider]) {
    data.providers[provider] = { requests: 0, tokens: 0, models: {} };
  }
  data.providers[provider].requests++;
  data.providers[provider].tokens += request.totalTokens;
  data.providers[provider].models[model] = (data.providers[provider].models[model] || 0) + 1;

  // Update model stats
  if (!data.models[`${provider}/${model}`]) {
    data.models[`${provider}/${model}`] = { requests: 0, tokens: 0, avgLatency: 0 };
  }
  const modelStats = data.models[`${provider}/${model}`];
  modelStats.requests++;
  modelStats.tokens += request.totalTokens;
  modelStats.avgLatency = (modelStats.avgLatency * (modelStats.requests - 1) + latency) / modelStats.requests;

  // Save updated data
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  // Update cost data
  updateCosts(provider, model, request.cost, date, month);

  return request;
}

// Calculate cost for a request
function calculateCost(provider, model, inputTokens, outputTokens) {
  const providerPricing = PRICING[provider];
  if (!providerPricing) {
    return 0; // Unknown provider
  }

  const modelPricing = providerPricing[model];
  if (!modelPricing) {
    return 0; // Unknown model
  }

  // Convert tokens to millions
  const inputMillions = inputTokens / 1000000;
  const outputMillions = outputTokens / 1000000;

  const inputCost = inputMillions * modelPricing.input;
  const outputCost = outputMillions * modelPricing.output;

  return inputCost + outputCost;
}

// Update cost tracking
function updateCosts(provider, model, cost, date, month) {
  const costs = JSON.parse(fs.readFileSync(costFile, 'utf8'));

  // Update daily costs
  if (!costs.daily[date]) {
    costs.daily[date] = {};
  }
  costs.daily[date][provider] = (costs.daily[date][provider] || 0) + cost;

  // Update monthly costs
  if (!costs.monthly[month]) {
    costs.monthly[month] = {};
  }
  costs.monthly[month][provider] = (costs.monthly[month][provider] || 0) + cost;

  // Update provider costs
  costs.providers[provider] = (costs.providers[provider] || 0) + cost;

  // Update total cost
  costs.total += cost;

  fs.writeFileSync(costFile, JSON.stringify(costs, null, 2));
}

// Get analytics for today
function getTodayAnalytics() {
  initializeAnalytics();
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const costs = JSON.parse(fs.readFileSync(costFile, 'utf8'));
  const today = new Date().toISOString().split('T')[0];

  const todayData = data.daily[today];
  const todayCosts = costs.daily[today];

  if (!todayData) {
    return {
      date: today,
      requests: 0,
      tokens: 0,
      cost: 0,
      avgLatency: 0,
      providers: {},
      models: {}
    };
  }

  const avgLatency = todayData.latency.length > 0
    ? Math.round(todayData.latency.reduce((a, b) => a + b, 0) / todayData.latency.length)
    : 0;

  const totalCost = todayCosts
    ? Object.values(todayCosts).reduce((sum, cost) => sum + cost, 0)
    : 0;

  return {
    date: today,
    requests: todayData.requests,
    tokens: todayData.tokens,
    cost: totalCost,
    avgLatency,
    providers: todayData.providers,
    models: todayData.models
  };
}

// Get analytics summary
function getAnalyticsSummary(period = 'week') {
  initializeAnalytics();
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const costs = JSON.parse(fs.readFileSync(costFile, 'utf8'));

  const dates = getDateRange(period);
  let totalRequests = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let allLatencies = [];
  const providers = {};
  const models = {};

  dates.forEach(date => {
    const dayData = data.daily[date];
    const dayCosts = costs.daily[date];

    if (dayData) {
      totalRequests += dayData.requests;
      totalTokens += dayData.tokens;
      allLatencies = allLatencies.concat(dayData.latency);

      Object.entries(dayData.providers).forEach(([provider, count]) => {
        providers[provider] = (providers[provider] || 0) + count;
      });

      Object.entries(dayData.models).forEach(([model, count]) => {
        models[model] = (models[model] || 0) + count;
      });
    }

    if (dayCosts) {
      totalCost += Object.values(dayCosts).reduce((sum, cost) => sum + cost, 0);
    }
  });

  const avgLatency = allLatencies.length > 0
    ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length)
    : 0;

  return {
    period,
    dates: dates.length,
    totalRequests,
    totalTokens,
    totalCost,
    avgLatency,
    providers,
    models
  };
}

// Get date range for period
function getDateRange(period) {
  const dates = [];
  const today = new Date();
  const start = new Date(today);

  switch (period) {
    case 'today':
      dates.push(today.toISOString().split('T')[0]);
      break;
    case 'week':
      start.setDate(today.getDate() - 7);
      break;
    case 'month':
      start.setMonth(today.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(today.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(today.getFullYear() - 1);
      break;
  }

  if (period !== 'today') {
    const current = new Date(start);
    while (current <= today) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
}

// Export analytics
function exportAnalytics(format = 'json', period = 'all') {
  initializeAnalytics();
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const costs = JSON.parse(fs.readFileSync(costFile, 'utf8'));

  const exportData = {
    timestamp: new Date().toISOString(),
    period,
    usage: data,
    costs: costs
  };

  const filename = `claude-code-router-analytics-${period}-${Date.now()}.${format}`;
  const filepath = path.join(process.cwd(), filename);

  if (format === 'json') {
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
  } else if (format === 'csv') {
    // Convert to CSV
    const headers = ['timestamp', 'provider', 'model', 'inputTokens', 'outputTokens', 'totalTokens', 'latency', 'success', 'cost'];
    const rows = data.requests.map(req => [
      req.timestamp,
      req.provider,
      req.model,
      req.inputTokens,
      req.outputTokens,
      req.totalTokens,
      req.latency,
      req.success,
      req.cost
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    fs.writeFileSync(filepath, csv);
  }

  return filepath;
}

// Display analytics
function displayAnalytics(period = 'today', options = {}) {
  const { detailed = false, export: exportFormat = null } = options;

  console.log(chalk.blue(`📊 Claude Code Router Analytics - ${period.toUpperCase()}`));
  console.log(chalk.gray('─'.repeat(60)));

  if (period === 'today') {
    const today = getTodayAnalytics();

    console.log(chalk.yellow('\n📅 Today\'s Stats:'));
    console.log(`  Requests: ${today.requests}`);
    console.log(`  Tokens: ${today.tokens.toLocaleString()}`);
    console.log(`  Cost: $${today.cost.toFixed(4)}`);
    console.log(`  Avg Latency: ${today.avgLatency}ms`);

    if (detailed && Object.keys(today.providers).length > 0) {
      console.log(chalk.yellow('\n🏭 Providers:'));
      Object.entries(today.providers).forEach(([provider, count]) => {
        const percentage = ((count / today.requests) * 100).toFixed(1);
        console.log(`  ${provider}: ${count} requests (${percentage}%)`);
      });

      console.log(chalk.yellow('\n🤖 Models:'));
      Object.entries(today.models).forEach(([model, count]) => {
        const percentage = ((count / today.requests) * 100).toFixed(1);
        console.log(`  ${model}: ${count} requests (${percentage}%)`);
      });
    }
  } else {
    const summary = getAnalyticsSummary(period);

    console.log(chalk.yellow(`\n📈 Last ${period} Summary:`));
    console.log(`  Total Requests: ${summary.totalRequests.toLocaleString()}`);
    console.log(`  Total Tokens: ${summary.totalTokens.toLocaleString()}`);
    console.log(`  Total Cost: $${summary.totalCost.toFixed(4)}`);
    console.log(`  Avg Latency: ${summary.avgLatency}ms`);
    console.log(`  Days Analyzed: ${summary.dates}`);

    if (detailed && Object.keys(summary.providers).length > 0) {
      console.log(chalk.yellow('\n🏭 Provider Breakdown:'));
      const sortedProviders = Object.entries(summary.providers)
        .sort(([, a], [, b]) => b - a);

      sortedProviders.forEach(([provider, count]) => {
        const percentage = ((count / summary.totalRequests) * 100).toFixed(1);
        console.log(`  ${provider}: ${count.toLocaleString()} requests (${percentage}%)`);
      });
    }

    if (detailed && Object.keys(summary.models).length > 0) {
      console.log(chalk.yellow('\n🤖 Model Breakdown:'));
      const sortedModels = Object.entries(summary.models)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10 models

      sortedModels.forEach(([model, count]) => {
        const percentage = ((count / summary.totalRequests) * 100).toFixed(1);
        console.log(`  ${model}: ${count.toLocaleString()} requests (${percentage}%)`);
      });
    }
  }

  // Export if requested
  if (exportFormat) {
    const filepath = exportAnalytics(exportFormat, period);
    console.log(chalk.green(`\n💾 Data exported to: ${filepath}`));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'today':
      displayAnalytics('today', { detailed: args.includes('--detailed') });
      break;

    case 'week':
      displayAnalytics('week', { detailed: args.includes('--detailed') });
      break;

    case 'month':
      displayAnalytics('month', { detailed: args.includes('--detailed') });
      break;

    case 'export':
      const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';
      const period = args.find(arg => arg.startsWith('--period='))?.split('=')[1] || 'all';
      exportAnalytics(format, period);
      console.log(chalk.green(`Analytics exported as ${format} for ${period}`));
      break;

    case 'record':
      // For internal use - record a request
      const [provider, model, inputTokens, outputTokens, latency, success] = args.slice(1);
      if (provider && model && inputTokens && outputTokens && latency) {
        recordRequest(
          provider,
          model,
          parseInt(inputTokens),
          parseInt(outputTokens),
          parseInt(latency),
          success === 'true'
        );
      } else {
        console.error(chalk.red('Usage: ccr analytics record <provider> <model> <inputTokens> <outputTokens> <latency> [success]'));
      }
      break;

    default:
      console.log(chalk.blue('Claude Code Router - Analytics CLI'));
      console.log(chalk.gray('─'.repeat(45)));
      console.log(chalk.yellow('Available commands:'));
      console.log('');
      console.log('View Analytics:');
      console.log('  ccr analytics today [--detailed]        - Today\'s statistics');
      console.log('  ccr analytics week [--detailed]         - Last week');
      console.log('  ccr analytics month [--detailed]        - Last month');
      console.log('');
      console.log('Export Data:');
      console.log('  ccr analytics export [--format=json|csv] [--period=all] - Export analytics');
      console.log('');
      console.log('Internal Use:');
      console.log('  ccr analytics record <provider> <model> <tokens> <latency> - Record request');
      console.log('');
      console.log('Examples:');
      console.log('  ccr analytics today --detailed');
      console.log('  ccr analytics export --format=csv --period=month');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  recordRequest,
  getTodayAnalytics,
  getAnalyticsSummary,
  exportAnalytics,
  calculateCost
};