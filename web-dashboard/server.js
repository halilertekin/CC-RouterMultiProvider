#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');

class DashboardServer {
  constructor(options = {}) {
    this.port = options.port || 3457;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // API Routes
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'Claude Code Router Dashboard',
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/api/config', (req, res) => {
      try {
        const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          res.json({ success: true, data: config });
        } else {
          res.status(404).json({ success: false, error: 'Configuration not found' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/providers', (req, res) => {
      try {
        const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          res.json({ success: true, data: config.Providers || [] });
        } else {
          res.status(404).json({ success: false, error: 'Providers not found' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/analytics', (req, res) => {
      try {
        const analyticsPath = path.join(os.homedir(), '.claude-code-router', 'analytics', 'usage.json');
        if (fs.existsSync(analyticsPath)) {
          const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
          res.json({ success: true, data: analytics });
        } else {
          res.json({ success: true, data: { requests: [], daily: {}, monthly: {} } });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/status', (req, res) => {
      const status = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: require('../package.json').version,
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch()
      };
      res.json({ success: true, data: status });
    });

    // Serve the main dashboard HTML
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Catch all other routes
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.port, () => {
          console.log(chalk.green(`🚀 Dashboard server started on port ${this.port}`));
          console.log(chalk.blue(`📊 Open http://localhost:${this.port} to view dashboard`));

          // Try to open browser
          this.openBrowser().catch(() => {
            console.log(chalk.yellow('Could not open browser automatically'));
          });

          resolve(server);
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            reject(new Error(`Port ${this.port} is already in use`));
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async openBrowser() {
    const { spawn } = require('child_process');
    const opener = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';

    spawn(opener, [`http://localhost:${this.port}`], { detached: true }).unref();

    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log(chalk.yellow('Dashboard server stopped'));
          resolve();
        });
      });
    }
  }
}

// API routes for analytics and monitoring
class DashboardAPI {
  static setupAnalyticsRoutes(app) {
    const analyticsRouter = express.Router();

    // Get analytics summary
    analyticsRouter.get('/summary', async (req, res) => {
      try {
        const { getAnalyticsSummary } = require('../cli/analytics');
        const summary = getAnalyticsSummary('week');
        res.json({ success: true, data: summary });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get today's analytics
    analyticsRouter.get('/today', async (req, res) => {
      try {
        const { getTodayAnalytics } = require('../cli/analytics');
        const today = getTodayAnalytics();
        res.json({ success: true, data: today });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Export analytics
    analyticsRouter.get('/export', async (req, res) => {
      try {
        const { exportAnalytics } = require('../cli/analytics');
        const format = req.query.format || 'json';
        const period = req.query.period || 'all';
        const filepath = exportAnalytics(format, period);

        res.download(filepath, (err) => {
          if (err) {
            res.status(500).json({ success: false, error: 'Export failed' });
          } else {
            // Clean up the temporary file
            fs.unlink(filepath, () => {});
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.use('/api/analytics', analyticsRouter);
  }

  static setupHealthRoutes(app) {
    const healthRouter = express.Router();

    // Check provider health
    healthRouter.get('/providers', async (req, res) => {
      try {
        const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          const providers = config.Providers || [];

          const healthChecks = await Promise.all(
            providers.map(async (provider) => {
              try {
                const { testProvider } = require('../cli/commands');
                const isHealthy = await testProvider(provider.name);
                return {
                  name: provider.name,
                  status: isHealthy ? 'healthy' : 'unhealthy',
                  models: provider.models,
                  lastChecked: new Date().toISOString()
                };
              } catch (error) {
                return {
                  name: provider.name,
                  status: 'error',
                  error: error.message,
                  lastChecked: new Date().toISOString()
                };
              }
            })
          );

          res.json({ success: true, data: healthChecks });
        } else {
          res.status(404).json({ success: false, error: 'Configuration not found' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // System health
    healthRouter.get('/system', async (req, res) => {
      try {
        const health = {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: os.platform(),
          nodeVersion: process.version,
          timestamp: new Date().toISOString()
        };

        res.json({ success: true, data: health });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.use('/api/health', healthRouter);
  }

  static setupConfigRoutes(app) {
    const configRouter = express.Router();

    // Get current configuration
    configRouter.get('/current', async (req, res) => {
      try {
        const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          res.json({ success: true, data: config });
        } else {
          res.status(404).json({ success: false, error: 'Configuration not found' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get available templates
    configRouter.get('/templates', async (req, res) => {
      try {
        const templatesDir = path.join(__dirname, '../templates');
        const templates = [];

        if (fs.existsSync(templatesDir)) {
          const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

          for (const file of files) {
            const templatePath = path.join(templatesDir, file);
            const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
            templates.push({
              name: file.replace('.json', ''),
              ...template
            });
          }
        }

        res.json({ success: true, data: templates });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.use('/api/config', configRouter);
  }
}

// CLI function to start dashboard
async function startDashboard(options = {}) {
  const dashboard = new DashboardServer(options);

  // Setup additional API routes
  DashboardAPI.setupAnalyticsRoutes(dashboard.app);
  DashboardAPI.setupHealthRoutes(dashboard.app);
  DashboardAPI.setupConfigRoutes(dashboard.app);

  try {
    const server = await dashboard.start();
    return server;
  } catch (error) {
    console.error(chalk.red('Failed to start dashboard:'), error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  DashboardServer,
  DashboardAPI,
  startDashboard
};

// Run server if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    options.port = parseInt(args[portIndex + 1]);
  }

  startDashboard(options);
}