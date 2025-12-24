#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('../cli/chalk-safe');

class PluginManager {
  constructor(options = {}) {
    this.pluginsDir = options.pluginsDir || path.join(os.homedir(), '.claude-code-router', 'plugins');
    this.plugins = new Map();
    this.hooks = new Map();
    this.middleware = [];

    this.initPluginDirectory();
  }

  initPluginDirectory() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  // Plugin structure validation
  validatePlugin(plugin) {
    const required = ['name', 'version', 'description', 'main'];
    const missing = required.filter(field => !plugin[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate plugin structure
    if (!plugin.provider && !plugin.hooks && !plugin.middleware) {
      throw new Error('Plugin must define at least provider, hooks, or middleware');
    }

    return true;
  }

  // Load a plugin from directory or file
  async loadPlugin(pluginPath) {
    try {
      const fullPath = path.isAbsolute(pluginPath)
        ? pluginPath
        : path.join(this.pluginsDir, pluginPath);

      const pluginJsonPath = path.join(fullPath, 'plugin.json');

      if (!fs.existsSync(pluginJsonPath)) {
        throw new Error(`Plugin configuration not found: ${pluginJsonPath}`);
      }

      const pluginConfig = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
      this.validatePlugin(pluginConfig);

      // Load plugin main file
      const mainPath = path.join(fullPath, pluginConfig.main);
      if (!fs.existsSync(mainPath)) {
        throw new Error(`Plugin main file not found: ${mainPath}`);
      }

      const PluginClass = require(mainPath);
      const plugin = new PluginClass(pluginConfig);

      // Initialize plugin
      if (typeof plugin.initialize === 'function') {
        await plugin.initialize();
      }

      // Register plugin
      this.plugins.set(pluginConfig.name, {
        instance: plugin,
        config: pluginConfig,
        path: fullPath
      });

      // Register hooks
      if (plugin.hooks) {
        Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
          this.registerHook(hookName, handler, pluginConfig.name);
        });
      }

      // Register middleware
      if (plugin.middleware) {
        this.middleware.push({
          name: pluginConfig.name,
          handler: plugin.middleware
        });
      }

      console.log(chalk.green(`✅ Plugin loaded: ${pluginConfig.name} v${pluginConfig.version}`));
      return plugin;

    } catch (error) {
      console.error(chalk.red(`❌ Failed to load plugin ${pluginPath}:`), error.message);
      throw error;
    }
  }

  // Load all plugins from directory
  async loadAllPlugins() {
    if (!fs.existsSync(this.pluginsDir)) {
      console.log(chalk.yellow('⚠️  No plugins directory found'));
      return;
    }

    const pluginDirs = fs.readdirSync(this.pluginsDir)
      .filter(item => {
        const itemPath = path.join(this.pluginsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

    console.log(chalk.blue(`Loading ${pluginDirs.length} plugins...`));

    const results = [];
    for (const dir of pluginDirs) {
      try {
        const plugin = await this.loadPlugin(dir);
        results.push({ success: true, plugin: plugin.config.name });
      } catch (error) {
        results.push({ success: false, plugin: dir, error: error.message });
      }
    }

    console.log(chalk.green(`\n✅ Successfully loaded ${results.filter(r => r.success).length} plugins`));
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log(chalk.red(`❌ Failed to load ${failed.length} plugins:`));
      failed.forEach(f => {
        console.log(chalk.red(`  - ${f.plugin}: ${f.error}`));
      });
    }

    return results;
  }

  // Unload a plugin
  async unloadPlugin(pluginName) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    const pluginData = this.plugins.get(pluginName);
    const plugin = pluginData.instance;

    // Cleanup plugin
    if (typeof plugin.cleanup === 'function') {
      await plugin.cleanup();
    }

    // Remove hooks
    this.removeHooksByPlugin(pluginName);

    // Remove middleware
    this.middleware = this.middleware.filter(mw => mw.name !== pluginName);

    // Remove from plugins
    this.plugins.delete(pluginName);

    console.log(chalk.yellow(`⏏️  Plugin unloaded: ${pluginName}`));
  }

  // Reload a plugin
  async reloadPlugin(pluginName) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    const pluginPath = this.plugins.get(pluginName).path;
    await this.unloadPlugin(pluginName);
    await this.loadPlugin(pluginPath);
  }

  // Get loaded plugins
  getLoadedPlugins() {
    return Array.from(this.plugins.entries()).map(([name, data]) => ({
      name,
      config: data.config,
      loaded: true
    }));
  }

  // Get plugin by name
  getPlugin(pluginName) {
    const pluginData = this.plugins.get(pluginName);
    return pluginData ? pluginData.instance : null;
  }

  // Register hook
  registerHook(hookName, handler, pluginName) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({
      handler,
      plugin: pluginName
    });
  }

  // Remove hooks by plugin
  removeHooksByPlugin(pluginName) {
    for (const [hookName, hooks] of this.hooks.entries()) {
      this.hooks.set(hookName, hooks.filter(hook => hook.plugin !== pluginName));
    }
  }

  // Execute hook
  async executeHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return [];
    }

    const hooks = this.hooks.get(hookName);
    const results = [];

    for (const hook of hooks) {
      try {
        const result = await hook.handler(...args);
        results.push({ plugin: hook.plugin, result });
      } catch (error) {
        console.error(chalk.red(`Hook error in ${hookName} (${hook.plugin}):`), error.message);
        results.push({ plugin: hook.plugin, error: error.message });
      }
    }

    return results;
  }

  // Apply middleware to request
  async applyMiddleware(req, res, next) {
    let index = 0;

    const runNext = async () => {
      if (index >= this.middleware.length) {
        return next();
      }

      const middleware = this.middleware[index++];
      try {
        await middleware.handler(req, res, runNext);
      } catch (error) {
        console.error(chalk.red(`Middleware error (${middleware.name}):`), error.message);
        next(error);
      }
    };

    await runNext();
  }

  // Create plugin scaffold
  createPlugin(pluginName, options = {}) {
    const {
      type = 'provider', // provider, hooks, middleware
      author = 'Anonymous',
      description = ''
    } = options;

    const pluginDir = path.join(this.pluginsDir, pluginName);

    if (fs.existsSync(pluginDir)) {
      throw new Error(`Plugin directory already exists: ${pluginName}`);
    }

    fs.mkdirSync(pluginDir, { recursive: true });

    // Create plugin.json
    const pluginConfig = {
      name: pluginName,
      version: '1.0.0',
      description,
      author,
      type,
      main: 'index.js',
      keywords: [],
      dependencies: {},
      created: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(pluginConfig, null, 2)
    );

    // Create main file based on type
    let mainContent = '';

    switch (type) {
      case 'provider':
        mainContent = this.getProviderTemplate(pluginName);
        break;
      case 'hooks':
        mainContent = this.getHooksTemplate(pluginName);
        break;
      case 'middleware':
        mainContent = this.getMiddlewareTemplate(pluginName);
        break;
    }

    fs.writeFileSync(path.join(pluginDir, 'index.js'), mainContent);

    // Create README
    const readmeContent = this.getReadmeTemplate(pluginName, pluginConfig);
    fs.writeFileSync(path.join(pluginDir, 'README.md'), readmeContent);

    console.log(chalk.green(`✅ Plugin scaffold created: ${pluginName}`));
    console.log(chalk.blue(`📁 Location: ${pluginDir}`));

    return pluginDir;
  }

  // Plugin templates
  getProviderTemplate(pluginName) {
    return `class ${pluginName}Provider {
  constructor(config) {
    this.name = config.name;
    this.apiBase = config.apiBase || 'https://api.example.com/v1';
    this.models = config.models || ['model-1', 'model-2'];
    this.pricing = config.pricing || { input: 0.01, output: 0.02 };
  }

  async initialize() {
    console.log(\`Initializing \${this.name} plugin...\`);
    // Initialize connections, validate API keys, etc.
  }

  async cleanup() {
    console.log(\`Cleaning up \${this.name} plugin...\`);
    // Close connections, cleanup resources
  }

  // Required methods for provider plugins
  async createRequest(prompt, options = {}) {
    const model = options.model || this.models[0];
    return {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7
    };
  }

  async parseResponse(response) {
    return response;
  }

  // Optional: Custom methods
  async checkHealth() {
    // Check if the provider is accessible
    return true;
  }

  getCapabilities() {
    return {
      chat: true,
      tools: false,
      vision: false
    };
  }
}

module.exports = ${pluginName}Provider;
`;
  }

  getHooksTemplate(pluginName) {
    return `class ${pluginName}Hooks {
  constructor(config) {
    this.name = config.name;
  }

  // Plugin initialization
  async initialize() {
    console.log(\`Initializing \${this.name} hooks...\`);
  }

  // Plugin cleanup
  async cleanup() {
    console.log(\`Cleaning up \${this.name} hooks...\`);
  }

  // Define hooks
  get hooks() {
    return {
      // Called before request
      'beforeRequest': async (req, config) => {
        console.log(\`Before request hook: \${req.method || 'Unknown'}\`);
        return req;
      },

      // Called after request
      'afterRequest': async (req, response, latency) => {
        console.log(\`After request hook: \${latency}ms\`);
        return { req, response, latency };
      },

      // Called on error
      'onError': async (req, error) => {
        console.error(\`Error hook: \${error.message}\`);
        return error;
      }
    };
  }
}

module.exports = ${pluginName}Hooks;
`;
  }

  getMiddlewareTemplate(pluginName) {
    return `class ${pluginName}Middleware {
  constructor(config) {
    this.name = config.name;
    this.options = config.options || {};
  }

  async initialize() {
    console.log(\`Initializing \${this.name} middleware...\`);
  }

  async cleanup() {
    console.log(\`Cleaning up \${this.name} middleware...\`);
  }

  // Middleware function
  async middleware(req, res, next) {
    // Add custom headers, logging, rate limiting, etc.
    console.log(\`\${this.name} middleware processing request\`);

    // Continue to next middleware
    await next();
  }
}

module.exports = ${pluginName}Middleware;
`;
  }

  getReadmeTemplate(pluginName, config) {
    return `# ${pluginName} Plugin

${config.description}

## Installation

1. Place this plugin in your Claude Code Router plugins directory
2. Restart Claude Code Router
3. The plugin will be automatically loaded

## Configuration

Edit \`plugin.json\` to customize the plugin settings.

## Usage

This plugin provides:
- Type: ${config.type}
- Version: ${config.version}
- Author: ${config.author}

## Development

Modify \`index.js\` to extend the plugin functionality.

## Support

For issues or questions, contact: ${config.author}
`;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new PluginManager();

  switch (command) {
    case 'list':
      const plugins = manager.getLoadedPlugins();
      if (plugins.length === 0) {
        console.log(chalk.yellow('No plugins loaded'));
      } else {
        console.log(chalk.blue('\nLoaded Plugins:'));
        plugins.forEach(plugin => {
          console.log(`  📦 ${plugin.name} v${plugin.config.version}`);
          console.log(`     ${plugin.config.description}`);
        });
      }
      break;

    case 'load':
      const pluginName = args[1];
      if (!pluginName) {
        console.error(chalk.red('Please specify plugin name'));
        process.exit(1);
      }
      try {
        await manager.loadPlugin(pluginName);
      } catch (error) {
        console.error(chalk.red('Failed to load plugin:'), error.message);
        process.exit(1);
      }
      break;

    case 'unload':
      const unloadName = args[1];
      if (!unloadName) {
        console.error(chalk.red('Please specify plugin name'));
        process.exit(1);
      }
      try {
        await manager.unloadPlugin(unloadName);
      } catch (error) {
        console.error(chalk.red('Failed to unload plugin:'), error.message);
        process.exit(1);
      }
      break;

    case 'reload':
      const reloadName = args[1];
      if (!reloadName) {
        console.error(chalk.red('Please specify plugin name'));
        process.exit(1);
      }
      try {
        await manager.reloadPlugin(reloadName);
      } catch (error) {
        console.error(chalk.red('Failed to reload plugin:'), error.message);
        process.exit(1);
      }
      break;

    case 'create':
      const createName = args[1];
      const options = {};

      // Parse options
      const typeIndex = args.indexOf('--type');
      if (typeIndex !== -1) {
        options.type = args[typeIndex + 1];
      }

      const authorIndex = args.indexOf('--author');
      if (authorIndex !== -1) {
        options.author = args[authorIndex + 1];
      }

      const descIndex = args.indexOf('--description');
      if (descIndex !== -1) {
        options.description = args.slice(descIndex + 1).join(' ');
      }

      if (!createName) {
        console.error(chalk.red('Please specify plugin name'));
        console.log(chalk.blue('\nUsage: ccr plugin create <name> [--type provider|hooks|middleware] [--author <author>] [--description <description>]'));
        process.exit(1);
      }

      try {
        manager.createPlugin(createName, options);
      } catch (error) {
        console.error(chalk.red('Failed to create plugin:'), error.message);
        process.exit(1);
      }
      break;

    case 'load-all':
      await manager.loadAllPlugins();
      break;

    default:
      console.log(chalk.blue('Claude Code Router - Plugin Manager'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.yellow('Available commands:'));
      console.log('');
      console.log('Plugin Management:');
      console.log('  ccr plugin list                     - List loaded plugins');
      console.log('  ccr plugin load <name>               - Load a plugin');
      console.log('  ccr plugin unload <name>             - Unload a plugin');
      console.log('  ccr plugin reload <name>             - Reload a plugin');
      console.log('  ccr plugin create <name> [options]   - Create plugin scaffold');
      console.log('  ccr plugin load-all                 - Load all plugins');
      console.log('');
      console.log('Plugin Creation Options:');
      console.log('  --type <provider|hooks|middleware>  Plugin type');
      console.log('  --author <name>                     Author name');
      console.log('  --description <text>                Plugin description');
      console.log('');
      console.log('Examples:');
      console.log('  ccr plugin create my-provider --type provider');
      console.log('  ccr plugin create logger --type middleware --author "John Doe"');
  }
}

// Export for use in other modules
module.exports = {
  PluginManager
};

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}