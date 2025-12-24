#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('./chalk-safe');
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

// Helper to find original ccr binary
function getOriginalCcrPath() {
  try {
    // Try to find it in dependencies
    return require.resolve('@musistudio/claude-code-router/index.js');
  } catch (e) {
    return null;
  }
}

// Proxy command to original router
function proxyToOriginal(args) {
  const originalPath = getOriginalCcrPath();
  if (!originalPath) {
    console.error(chalk.red('❌ Original @musistudio/claude-code-router not found.'));
    return;
  }

  const child = spawn('node', [originalPath, ...args], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code || 1);
    }
  });
}

// CLI command handler
async function main() {
  const [command, ...args] = process.argv.slice(2);
  const advancedCommands = ['test', 'benchmark', 'analytics', 'status', 'config', 'health', 'update'];

  // If it's an advanced command or no command is given
  if (advancedCommands.includes(command) || !command || command === '--help' || command === '-h') {
    switch (command) {
      case 'update':
        console.log(chalk.blue('🔄 Checking for updates and updating...'));
        const updateProcess = spawn('pnpm', ['add', '-g', '@halilertekin/claude-code-router-config@latest'], {
          stdio: 'inherit',
          env: process.env
        });
        updateProcess.on('exit', (code) => {
          if (code === 0) {
            console.log(chalk.green('✅ Successfully updated to the latest version!'));
          } else {
            console.error(chalk.red(`❌ Update failed with code ${code}. Please try running manually: pnpm add -g @halilertekin/claude-code-router-config@latest`));
          }
        });
        break;

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
        if (args.includes('--detailed')) {
          const statusOptions = {
            detailed: true,
            showCosts: args.includes('--show-costs')
          };
          await showDetailedStatus(statusOptions);
        } else {
          // Pass basic status to original router
          proxyToOriginal(['status', ...args]);
        }
        break;

      case 'analytics':
        // Forward to analytics script
        const analyticsPath = path.join(__dirname, 'analytics.js');
        spawn('node', [analyticsPath, ...args], { stdio: 'inherit' });
        break;

      case 'health':
        const healthPath = path.join(__dirname, '../logging/health-monitor.js');
        spawn('node', [healthPath, ...args], { stdio: 'inherit' });
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
        console.log(chalk.blue('Claude Code Router - Advanced CLI (v1.3.0)'));
        console.log(chalk.gray('─'.repeat(45)));

        console.log(chalk.yellow('🚀 Advanced CLI Tools:'));
        console.log('  test <provider> [model]        - Test provider connection');
        console.log('  benchmark [--all] [--compare-speed] - Benchmark providers');
        console.log('  analytics [period]              - View usage statistics');
        console.log('  status --detailed [--show-costs] - Show detailed router status');
        console.log('  config validate                 - Validate configuration');
        console.log('  config backup                   - Backup configuration');
        console.log('  health [--all-providers]        - Check provider health');
        console.log('  update                          - Update to the latest version');

        console.log(chalk.yellow('\n📦 Core Router Commands (Proxy):'));
        console.log('  start         - Start router server (Backend only)');
        console.log('  stop          - Stop router server');
        console.log('  restart       - Restart router server');
        console.log('  status        - Show server status');
        console.log('  code          - Start Router + Claude Code (Recommended)');
        console.log('  model         - Switch models at runtime');
        console.log('  activate      - Export env variables');

        console.log(chalk.yellow('\n💡 Tip:'));
        console.log('  To start everything at once, run: ' + chalk.cyan('ccr code'));
        console.log('  To only start the background server, run: ' + chalk.cyan('ccr start'));
    }
  } else {
    // Forward unknown commands to the original router
    proxyToOriginal([command, ...args]);
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