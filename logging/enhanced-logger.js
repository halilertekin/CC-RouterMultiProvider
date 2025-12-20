const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const { spawn } = require('child_process');

class EnhancedLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(os.homedir(), '.claude-code-router', 'logs');
    this.level = options.level || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableMetrics = options.enableMetrics !== false;
    this.enableAnalytics = options.enableAnalytics !== false;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;

    // Initialize log directory
    this.initLogDirectory();

    // Current date for log rotation
    this.currentDate = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logDir, `claude-router-${this.currentDate}.log`);
    this.metricsFile = path.join(this.logDir, 'metrics.json');
    this.errorFile = path.join(this.logDir, 'errors.log');
  }

  initLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Log levels with numeric values for filtering
  static levels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5
  };

  // Check if we should log at this level
  shouldLog(level) {
    return EnhancedLogger.levels[level] <= EnhancedLogger.levels[this.level];
  }

  // Format log entry
  formatEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      pid,
      message,
      ...meta
    };

    // Format for console
    const consoleMessage = `[${timestamp}] ${level.toUpperCase()} ${message}`;

    return { entry, consoleMessage };
  }

  // Write to file with rotation
  writeToFile(entry) {
    if (!this.enableFile) return;

    try {
      // Check if we need to rotate log file
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxFileSize) {
          this.rotateLog();
        }
      }

      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Log rotation
  rotateLog() {
    const baseName = path.join(this.logDir, `claude-router-${this.currentDate}`);

    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${baseName}.${i}.log`;
      const newFile = `${baseName}.${i + 1}.log`;

      if (fs.existsSync(oldFile)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldFile); // Delete oldest
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current log to .1
    if (fs.existsSync(this.logFile)) {
      fs.renameSync(this.logFile, `${baseName}.1.log`);
    }
  }

  // Log to console with colors
  writeToConsole(level, consoleMessage) {
    if (!this.enableConsole) return;

    let coloredMessage;
    switch (level) {
      case 'fatal':
        coloredMessage = chalk.red.bold(consoleMessage);
        break;
      case 'error':
        coloredMessage = chalk.red(consoleMessage);
        break;
      case 'warn':
        coloredMessage = chalk.yellow(consoleMessage);
        break;
      case 'info':
        coloredMessage = chalk.blue(consoleMessage);
        break;
      case 'debug':
        coloredMessage = chalk.magenta(consoleMessage);
        break;
      case 'trace':
        coloredMessage = chalk.gray(consoleMessage);
        break;
      default:
        coloredMessage = consoleMessage;
    }

    console.log(coloredMessage);
  }

  // Log entry method
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const { entry, consoleMessage } = this.formatEntry(level, message, meta);

    // Write to console
    this.writeToConsole(level, consoleMessage);

    // Write to file
    this.writeToFile(entry);

    // Handle errors specially
    if (level === 'error' || level === 'fatal') {
      this.logError(entry);
    }

    // Update metrics
    if (this.enableMetrics) {
      this.updateMetrics(level, meta);
    }

    // Send to analytics if enabled
    if (this.enableAnalytics && meta.provider && meta.model) {
      this.sendToAnalytics(entry);
    }
  }

  // Log errors to separate file
  logError(entry) {
    try {
      const errorLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.errorFile, errorLine);
    } catch (error) {
      console.error('Failed to write to error log:', error);
    }
  }

  // Update metrics
  updateMetrics(level, meta) {
    try {
      let metrics = {};

      if (fs.existsSync(this.metricsFile)) {
        metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
      }

      const now = new Date().toISOString();

      // Initialize metrics structure
      if (!metrics.requests) metrics.requests = { total: 0, byLevel: {}, byProvider: {} };
      if (!metrics.latency) metrics.latency = { avg: 0, min: Infinity, max: 0, samples: [] };
      if (!metrics.errors) metrics.errors = { total: 0, byProvider: {} };
      if (!metrics.costs) metrics.costs = { total: 0, byProvider: {} };
      if (!metrics.uptime) metrics.uptime = { start: metrics.uptime?.start || now, lastActivity: now };

      // Update request counts
      metrics.requests.total++;
      metrics.requests.byLevel[level] = (metrics.requests.byLevel[level] || 0) + 1;

      if (meta.provider) {
        metrics.requests.byProvider[meta.provider] = (metrics.requests.byProvider[meta.provider] || 0) + 1;
      }

      // Update latency
      if (meta.latency) {
        metrics.latency.samples.push(meta.latency);
        metrics.latency.min = Math.min(metrics.latency.min, meta.latency);
        metrics.latency.max = Math.max(metrics.latency.max, meta.latency);

        // Keep only last 1000 samples for performance
        if (metrics.latency.samples.length > 1000) {
          metrics.latency.samples = metrics.latency.samples.slice(-1000);
        }

        metrics.latency.avg = Math.round(
          metrics.latency.samples.reduce((a, b) => a + b, 0) / metrics.latency.samples.length
        );
      }

      // Update errors
      if (level === 'error' || level === 'fatal') {
        metrics.errors.total++;
        if (meta.provider) {
          metrics.errors.byProvider[meta.provider] = (metrics.errors.byProvider[meta.provider] || 0) + 1;
        }
      }

      // Update costs
      if (meta.cost) {
        metrics.costs.total += meta.cost;
        if (meta.provider) {
          metrics.costs.byProvider[meta.provider] = (metrics.costs.byProvider[meta.provider] || 0) + meta.cost;
        }
      }

      // Update uptime
      metrics.uptime.lastActivity = now;

      fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  // Send to analytics module
  sendToAnalytics(entry) {
    if (!entry.meta || !entry.meta.provider || !entry.meta.model) return;

    try {
      const analyticsPath = path.join(__dirname, '..', 'cli', 'analytics.js');

      // Call analytics module if available
      const child = spawn('node', [analyticsPath, 'record',
        entry.meta.provider,
        entry.meta.model,
        entry.meta.inputTokens || 0,
        entry.meta.outputTokens || 0,
        entry.meta.latency || 0,
        entry.success !== false
      ], {
        stdio: 'ignore',
        detached: true
      });

      child.unref();
    } catch (error) {
      // Silently fail analytics - don't break logging
    }
  }

  // Convenience methods
  fatal(message, meta = {}) {
    this.log('fatal', message, { ...meta, stack: new Error().stack });
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  // Request logging with standard format
  logRequest(provider, model, inputTokens, outputTokens, latency, success, cost = null) {
    this.info('API Request', {
      event: 'api_request',
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latency,
      success,
      cost,
      timestamp: new Date().toISOString()
    });
  }

  // Route decision logging
  logRoute(request, selectedProvider, selectedModel, reason, alternatives = []) {
    this.debug('Route Decision', {
      event: 'route_decision',
      requestId: request.id || 'unknown',
      requestType: request.type || 'unknown',
      selectedProvider,
      selectedModel,
      reason,
      alternatives,
      timestamp: new Date().toISOString()
    });
  }

  // Health check logging
  logHealthCheck(provider, status, latency = null, error = null) {
    const level = status === 'healthy' ? 'info' : 'warn';
    this.log(level, `Health Check - ${provider}`, {
      event: 'health_check',
      provider,
      status,
      latency,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Get metrics summary
  getMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        return JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
      }
    } catch (error) {
      console.error('Failed to read metrics:', error);
    }
    return null;
  }

  // Get recent logs
  getRecentLogs(count = 100, level = null) {
    try {
      if (!fs.existsSync(this.logFile)) return [];

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Filter by level if specified
      if (level) {
        return logs.filter(log => log.level === level.toUpperCase()).slice(-count);
      }

      return logs.slice(-count);
    } catch (error) {
      console.error('Failed to read recent logs:', error);
      return [];
    }
  }

  // Clean old logs
  cleanup() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      files.forEach(file => {
        if (file.endsWith('.log') || file.endsWith('.json')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }
}

// Export singleton instance
const logger = new EnhancedLogger();

module.exports = {
  EnhancedLogger,
  logger
};