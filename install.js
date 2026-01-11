#!/usr/bin/env node

/**
 * Claude Code Router Config - Interactive Installer
 * Unified router + configuration package
 *
 * Configuration by Halil Ertekin
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-code-router');
const packageDir = __dirname;
const argv = new Set(process.argv.slice(2));
const envIsTrue = (value) => /^(1|true|yes|y)$/i.test(value || '');
const forceOverwrite =
  argv.has('--overwrite') ||
  argv.has('--force') ||
  envIsTrue(process.env.CCR_CONFIG_OVERWRITE);
const nonInteractive =
  argv.has('--no-prompt') ||
  argv.has('--non-interactive') ||
  envIsTrue(process.env.CCR_CONFIG_NO_PROMPT) ||
  envIsTrue(process.env.CI);
const canPrompt = Boolean(process.stdin.isTTY) && !nonInteractive;

async function checkRequirements() {
  console.log(chalk.blue('📋 Checking requirements...'));

  // Check Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 16) {
    console.error(chalk.red(`❌ Node.js ${majorVersion} detected. Node.js 16+ required.`));
    process.exit(1);
  }
  console.log(chalk.green(`✅ Node.js ${nodeVersion}`));

  // Check for npm (for optional updates)
  try {
    execSync('npm --version', { stdio: 'ignore' });
    console.log(chalk.green('✅ npm found'));
  } catch {
    console.log(chalk.yellow('⚠️  npm not found (optional)'));
  }
}

async function setupConfig() {
  console.log(chalk.blue('⚙️  Setting up configuration...'));

  // Ensure config directory exists
  await fs.ensureDir(configDir);

  // Copy config files
  const configFiles = ['config.json', 'intent-router.js', 'smart-intent-router.js'];
  for (const file of configFiles) {
    const src = path.join(packageDir, 'config', file);
    const dest = path.join(configDir, file);

    if (await fs.pathExists(dest)) {
      if (forceOverwrite) {
        console.log(chalk.yellow(`⚠️  Overwriting ${file} (forced)`));
      } else if (!canPrompt) {
        console.log(
          chalk.yellow(
            `⚠️  Skipping ${file} (non-interactive). Set CCR_CONFIG_OVERWRITE=1 to overwrite.`
          )
        );
        continue;
      } else {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${file} exists. Overwrite?`,
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow(`⚠️  Skipping ${file}`));
          continue;
        }
      }
    }

    await fs.copy(src, dest);
    console.log(chalk.green(`✅ ${file} copied`));
  }

  // Copy .env.example if .env doesn't exist
  const envFile = path.join(process.env.HOME || process.env.USERPROFILE, '.env');
  const envExample = path.join(packageDir, '.env.example');

  if (!(await fs.pathExists(envFile))) {
    await fs.copy(envExample, envFile);
    console.log(chalk.green('✅ .env file created from example'));
  } else {
    console.log(chalk.yellow('⚠️  .env file already exists'));
  }
}

async function showNextSteps() {
  console.log(chalk.green('\n🎉 Installation complete!'));
  console.log(chalk.blue('\n📝 Next steps:'));
  console.log('\n1. Edit your API keys in ~/.env file:');
  console.log(chalk.gray('   nano ~/.env'));

  console.log('\n2. Add environment variables to your shell (~/.zshrc or ~/.bashrc):');
  console.log(chalk.cyan(`
   # Claude Code Router (safe .env load)
   set -a
   source ~/.env
   set +a
   export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
   export NO_PROXY="127.0.0.1"
   `));

  console.log('\n3. Reload your shell:');
  console.log(chalk.gray('   source ~/.zshrc'));

  console.log('\n4. Start the router:');
  console.log(chalk.gray('   ccr start'));
  console.log(chalk.gray('   ccr code'));

  console.log(chalk.blue('\n📚 Documentation:'));
  console.log(chalk.gray('   https://github.com/halilertekin/claude-code-router-config'));

  console.log(chalk.blue('\n🔑 Get API keys:'));
  console.log(chalk.gray('   OpenAI:     https://platform.openai.com/api-keys'));
  console.log(chalk.gray('   Anthropic:  https://console.anthropic.com/settings/keys'));
  console.log(chalk.gray('   Gemini:     https://aistudio.google.com/apikey'));
  console.log(chalk.gray('   Qwen:       https://dashscope.console.aliyun.com/apiKey'));
  console.log(chalk.gray('   GLM:        https://open.bigmodel.cn/usercenter/apikeys'));
  console.log(chalk.gray('   OpenRouter: https://openrouter.ai/keys'));
  console.log(chalk.gray('   Copilot:    https://github.com/settings/tokens'));

  console.log(chalk.yellow('\n⭐ Info:'));
  console.log(chalk.gray('   Unified router + config package'));
}

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Claude Code Router Config Installer\n'));

  await checkRequirements();
  await setupConfig();
  await showNextSteps();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkRequirements, setupConfig };
