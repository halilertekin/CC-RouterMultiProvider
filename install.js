#!/usr/bin/env node

/**
 * Claude Code Router Config - Interactive Installer
 * For use with @musistudio/claude-code-router
 *
 * Original project: https://github.com/musistudio/claude-code-router
 * Configuration by Halil Ertekin
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-code-router');
const packageDir = __dirname;

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

  // Check for pnpm
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    console.log(chalk.green('✅ pnpm found'));
    return 'pnpm';
  } catch {
    try {
      execSync('npm --version', { stdio: 'ignore' });
      console.log(chalk.yellow('⚠️  pnpm not found, using npm'));
      return 'npm';
    } catch {
      console.error(chalk.red('❌ Neither pnpm nor npm found'));
      process.exit(1);
    }
  }
}

async function installRouter(packageManager) {
  console.log(chalk.blue('📦 Installing claude-code-router...'));

  try {
    const command = `${packageManager} add -g @musistudio/claude-code-router`;
    console.log(chalk.gray(`Running: ${command}`));
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green('✅ claude-code-router installed'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to install claude-code-router'));
    console.error(error.message);
    process.exit(1);
  }
}

async function setupConfig() {
  console.log(chalk.blue('⚙️  Setting up configuration...'));

  // Ensure config directory exists
  await fs.ensureDir(configDir);

  // Copy config files
  const configFiles = ['config.json', 'intent-router.js'];
  for (const file of configFiles) {
    const src = path.join(packageDir, 'config', file);
    const dest = path.join(configDir, file);

    if (await fs.pathExists(dest)) {
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
   # Claude Code Router
   export $(cat ~/.env | xargs)
   export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
   export NO_PROXY="127.0.0.1"
   `));

  console.log('\n3. Reload your shell:');
  console.log(chalk.gray('   source ~/.zshrc'));

  console.log('\n4. Start the router:');
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

  console.log(chalk.yellow('\n⭐ Attribution:'));
  console.log(chalk.gray('   This config is for @musistudio/claude-code-router'));
  console.log(chalk.gray('   Original: https://github.com/musistudio/claude-code-router'));
}

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Claude Code Router Config Installer\n'));

  const packageManager = await checkRequirements();
  await installRouter(packageManager);
  await setupConfig();
  await showNextSteps();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkRequirements, installRouter, setupConfig };