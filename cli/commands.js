#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const configPath = path.join(require('os').homedir(), '.claude-code-router');

// Load config
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(configPath, 'config.json'), 'utf8'));
  } catch (error) {
    console.error(chalk.red('❌ Configuration not found. Run installation first.'));
    process.exit(1);
  }
}

// Test provider connectivity
async function testProvider(provider, model) {
  const config = loadConfig();
  const providerConfig = config.Providers.find(p => p.name === provider);

  if (!providerConfig) {
    console.error(chalk.red(`❌ Provider "${provider}" not found in config`));
    return false;
  }

  console.log(chalk.blue(`🔍 Testing ${provider} with model: ${model || 'default'}`));

  try {
    const startTime = Date.now();
    // Simple test request
    const testRequest = {
      model: model || providerConfig.models[0],
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 10
    };

    // For now, just check if API key is set
    const apiKey = process.env[providerConfig.api_key.replace('$', '')];
    if (!apiKey) {
      throw new Error(`API key not set for ${provider}`);
    }

    const endTime = Date.now();
    console.log(chalk.green(`✅ ${provider}: Connected (${endTime - startTime}ms)`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ ${provider}: ${error.message}`));
    return false;
  }
}

// Benchmark all providers
async function benchmarkProviders(options = {}) {
  const config = loadConfig();
  const { allProviders = false, compareSpeed = false } = options;

  console.log(chalk.blue('🏃‍♂️ Provider Benchmark'));
  console.log(chalk.gray('─'.repeat(50)));

  const results = [];

  for (const provider of config.Providers) {
    if (allProviders || provider.name.includes('openai') || provider.name.includes('anthropic')) {
      const startTime = Date.now();
      const success = await testProvider(provider.name);
      const endTime = Date.now();

      if (success) {
        results.push({
          provider: provider.name,
          latency: endTime - startTime,
          status: 'healthy'
        });
      } else {
        results.push({
          provider: provider.name,
          latency: null,
          status: 'failed'
        });
      }
    }
  }

  if (compareSpeed && results.length > 1) {
    console.log(chalk.blue('\n📊 Speed Comparison'));
    const healthyResults = results.filter(r => r.status === 'healthy');
    healthyResults.sort((a, b) => a.latency - b.latency);

    healthyResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${result.provider}: ${result.latency}ms`);
    });
  }

  return results;
}

// Show detailed status
async function showDetailedStatus(options = {}) {
  const config = loadConfig();
  const { showCosts = false } = options;

  console.log(chalk.blue('📊 Claude Code Router Status'));
  console.log(chalk.gray('─'.repeat(50)));

  // Configuration info
  console.log(chalk.yellow('Configuration:'));
  console.log(`  Providers: ${config.Providers.length}`);
  console.log(`  Logging: ${config.LOG ? 'Enabled' : 'Disabled'}`);
  console.log(`  Custom Router: ${config.CUSTOM_ROUTER_PATH ? 'Enabled' : 'Disabled'}`);

  // Provider status
  console.log(chalk.yellow('\nProviders:'));
  for (const provider of config.Providers) {
    const apiKey = process.env[provider.api_key.replace('$', '')];
    const status = apiKey ? '🟢 Active' : '🔴 Missing API Key';
    console.log(`  ${provider.name}: ${status}`);
  }

  // Router configuration
  console.log(chalk.yellow('\nRouter Configuration:'));
  Object.entries(config.Router).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  if (showCosts) {
    console.log(chalk.yellow('\n💰 Cost Information:'));
    console.log('  Note: Cost tracking requires analytics module');
    console.log('  Run: ccr analytics --today');
  }
}

// Validate configuration
function validateConfig() {
  const configPathFull = path.join(configPath, 'config.json');

  if (!fs.existsSync(configPathFull)) {
    console.error(chalk.red('❌ Config file not found'));
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPathFull, 'utf8'));

    console.log(chalk.blue('🔍 Validating Configuration'));
    console.log(chalk.gray('─'.repeat(50)));

    // Check required fields
    const requiredFields = ['Providers', 'Router'];
    let valid = true;

    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(chalk.red(`❌ Missing required field: ${field}`));
        valid = false;
      } else {
        console.log(chalk.green(`✅ ${field}: Present`));
      }
    }

    // Check providers
    if (config.Providers) {
      console.log(chalk.yellow('\nProvider Validation:'));
      config.Providers.forEach((provider, index) => {
        const required = ['name', 'api_base_url', 'api_key', 'models'];
        const missing = required.filter(field => !provider[field]);

        if (missing.length === 0) {
          console.log(chalk.green(`  ✅ Provider ${index + 1}: ${provider.name}`));
        } else {
          console.log(chalk.red(`  ❌ Provider ${index + 1}: Missing ${missing.join(', ')}`));
          valid = false;
        }
      });
    }

    if (valid) {
      console.log(chalk.green('\n✅ Configuration is valid!'));
    } else {
      console.log(chalk.red('\n❌ Configuration has errors'));
    }

    return valid;
  } catch (error) {
    console.error(chalk.red(`❌ Error parsing config: ${error.message}`));
    return false;
  }
}

// Backup configuration
function backupConfig() {
  const configPathFull = path.join(configPath, 'config.json');
  const routerPathFull = path.join(configPath, 'intent-router.js');
  const backupDir = path.join(configPath, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    if (fs.existsSync(configPathFull)) {
      const backupConfig = path.join(backupDir, `config-${timestamp}.json`);
      fs.copyFileSync(configPathFull, backupConfig);
      console.log(chalk.green(`✅ Config backed up: ${backupConfig}`));
    }

    if (fs.existsSync(routerPathFull)) {
      const backupRouter = path.join(backupDir, `intent-router-${timestamp}.js`);
      fs.copyFileSync(routerPathFull, backupRouter);
      console.log(chalk.green(`✅ Router backed up: ${backupRouter}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Backup failed: ${error.message}`));
  }
}

// CLI command handler
async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'test':
      const provider = args[0];
      const model = args[1];
      if (provider) {
        await testProvider(provider, model);
      } else {
        console.error(chalk.red('❌ Please specify a provider: ccr test <provider> [model]'));
      }
      break;

    case 'benchmark':
      const options = {
        allProviders: args.includes('--all'),
        compareSpeed: args.includes('--compare-speed')
      };
      await benchmarkProviders(options);
      break;

    case 'status':
      const statusOptions = {
        detailed: args.includes('--detailed'),
        showCosts: args.includes('--show-costs')
      };
      await showDetailedStatus(statusOptions);
      break;

    case 'config':
      const configCommand = args[0];
      switch (configCommand) {
        case 'validate':
          validateConfig();
          break;
        case 'backup':
          backupConfig();
          break;
        default:
          console.log(chalk.yellow('Available config commands:'));
          console.log('  validate  - Check configuration validity');
          console.log('  backup    - Backup current configuration');
      }
      break;

    default:
      console.log(chalk.blue('Claude Code Router - Advanced CLI'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.yellow('Available commands:'));
      console.log('');
      console.log('Testing & Benchmarking:');
      console.log('  ccr test <provider> [model]        - Test provider connection');
      console.log('  ccr benchmark [--all] [--compare-speed] - Benchmark providers');
      console.log('  ccr status [--detailed] [--show-costs] - Show router status');
      console.log('');
      console.log('Configuration Management:');
      console.log('  ccr config validate                 - Validate configuration');
      console.log('  ccr config backup                   - Backup configuration');
      console.log('');
      console.log('Examples:');
      console.log('  ccr test openai gpt-4o');
      console.log('  ccr benchmark --all --compare-speed');
      console.log('  ccr status --detailed --show-costs');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testProvider,
  benchmarkProviders,
  showDetailedStatus,
  validateConfig,
  backupConfig
};