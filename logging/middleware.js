const { logger } = require('./enhanced-logger');

// Express middleware for HTTP requests
function httpLogger(options = {}) {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Add request ID to request object
    req.requestId = requestId;
    req.logData = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    // Log request start
    logger.info('HTTP Request Started', {
      event: 'http_request_start',
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.info('HTTP Request Completed', {
        event: 'http_request_complete',
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        responseSize: chunk ? chunk.length : 0
      });

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

// Request/response interceptor for API calls
function apiInterceptor(provider, model) {
  return {
    beforeRequest: (request) => {
      const requestId = generateRequestId();
      const startTime = Date.now();

      logger.info('API Request Starting', {
        event: 'api_request_start',
        requestId,
        provider,
        model,
        requestSize: JSON.stringify(request).length,
        timestamp: new Date().toISOString()
      });

      return { requestId, startTime };
    },

    afterRequest: (context, response, success) => {
      const endTime = Date.now();
      const duration = endTime - context.startTime;

      const meta = {
        event: 'api_request_complete',
        requestId: context.requestId,
        provider,
        model,
        duration,
        success,
        responseSize: JSON.stringify(response).length,
        timestamp: new Date().toISOString()
      };

      // Extract token usage if available
      if (response.usage) {
        meta.inputTokens = response.usage.prompt_tokens || response.usage.input_tokens || 0;
        meta.outputTokens = response.usage.completion_tokens || response.usage.output_tokens || 0;
        meta.totalTokens = meta.inputTokens + meta.outputTokens;
      }

      // Extract cost if available
      if (response.cost !== undefined) {
        meta.cost = response.cost;
      }

      const level = success ? 'info' : 'error';
      logger.log(level, `API Request ${success ? 'Succeeded' : 'Failed'}`, meta);
    },

    onError: (context, error) => {
      const endTime = Date.now();
      const duration = endTime - context.startTime;

      logger.error('API Request Failed', {
        event: 'api_request_error',
        requestId: context.requestId,
        provider,
        model,
        duration,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Router decision logger
function routeLogger() {
  return {
    logDecision: (request, provider, model, reason, alternatives = []) => {
      logger.logRoute(request, provider, model, reason, alternatives);
    },

    logFallback: (originalProvider, newProvider, reason) => {
      logger.warn('Route Fallback', {
        event: 'route_fallback',
        originalProvider,
        newProvider,
        reason,
        timestamp: new Date().toISOString()
      });
    },

    logProviderHealth: (provider, isHealthy, latency = null, error = null) => {
      logger.logHealthCheck(provider, isHealthy ? 'healthy' : 'unhealthy', latency, error);
    }
  };
}

// Performance monitor
function performanceMonitor() {
  const metrics = {
    requests: 0,
    errors: 0,
    totalLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    providerStats: {},
    lastCleanup: Date.now()
  };

  return {
    recordRequest: (provider, latency, success) => {
      metrics.requests++;
      metrics.totalLatency += latency;
      metrics.minLatency = Math.min(metrics.minLatency, latency);
      metrics.maxLatency = Math.max(metrics.maxLatency, latency);

      if (!success) {
        metrics.errors++;
      }

      // Provider-specific stats
      if (!metrics.providerStats[provider]) {
        metrics.providerStats[provider] = {
          requests: 0,
          errors: 0,
          totalLatency: 0,
          avgLatency: 0
        };
      }

      const providerStat = metrics.providerStats[provider];
      providerStat.requests++;
      providerStat.totalLatency += latency;
      providerStat.avgLatency = Math.round(providerStat.totalLatency / providerStat.requests);

      if (!success) {
        providerStat.errors++;
      }

      // Log performance issues
      if (latency > 10000) { // 10 seconds
        logger.warn('Slow Request Detected', {
          event: 'slow_request',
          provider,
          latency,
          threshold: 10000
        });
      }
    },

    getMetrics: () => {
      const avgLatency = metrics.requests > 0 ? Math.round(metrics.totalLatency / metrics.requests) : 0;
      const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) : 0;

      return {
        totalRequests: metrics.requests,
        totalErrors: metrics.errors,
        errorRate: parseFloat(errorRate),
        avgLatency,
        minLatency: metrics.minLatency === Infinity ? 0 : metrics.minLatency,
        maxLatency: metrics.maxLatency,
        providerStats: metrics.providerStats
      };
    },

    reset: () => {
      metrics.requests = 0;
      metrics.errors = 0;
      metrics.totalLatency = 0;
      metrics.minLatency = Infinity;
      metrics.maxLatency = 0;
      metrics.lastCleanup = Date.now();
    }
  };
}

// Utility functions
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Log formatter for different outputs
function formatLogForOutput(logs, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(logs, null, 2);

    case 'csv':
      if (logs.length === 0) return '';
      const headers = Object.keys(logs[0]);
      const csvRows = [headers.join(',')];
      logs.forEach(log => {
        const values = headers.map(header => {
          const value = log[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        });
        csvRows.push(values.join(','));
      });
      return csvRows.join('\n');

    case 'table':
      if (logs.length === 0) return 'No logs to display';
      const cols = Object.keys(logs[0]);
      const maxWidths = cols.map(col =>
        Math.max(col.length, ...logs.map(log => String(log[col] || '').length))
      );

      let table = cols.map((col, i) => col.padEnd(maxWidths[i])).join(' | ') + '\n';
      table += '-'.repeat(table.length) + '\n';

      logs.forEach(log => {
        const row = cols.map((col, i) =>
          String(log[col] || '').padEnd(maxWidths[i])
        ).join(' | ');
        table += row + '\n';
      });

      return table;

    default:
      return logs.map(log => JSON.stringify(log)).join('\n');
  }
}

// Search and filter logs
function searchLogs(query, options = {}) {
  const { level, provider, startDate, endDate, limit = 100 } = options;

  const logs = logger.getRecentLogs(limit * 10); // Get more to filter

  let filtered = logs;

  // Filter by level
  if (level) {
    filtered = filtered.filter(log => log.level === level.toUpperCase());
  }

  // Filter by provider
  if (provider) {
    filtered = filtered.filter(log =>
      log.provider === provider ||
      log.message?.toLowerCase().includes(provider.toLowerCase())
    );
  }

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    filtered = filtered.filter(log => new Date(log.timestamp) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    filtered = filtered.filter(log => new Date(log.timestamp) <= end);
  }

  // Text search
  if (query) {
    const searchTerms = query.toLowerCase().split(' ');
    filtered = filtered.filter(log => {
      const text = JSON.stringify(log).toLowerCase();
      return searchTerms.every(term => text.includes(term));
    });
  }

  return filtered.slice(0, limit);
}

// Real-time log streaming
function streamLogs(options = {}) {
  const { level, provider, follow = false } = options;

  return {
    start: (callback) => {
      let lastPosition = 0;

      const readNewLogs = () => {
        try {
          if (fs.existsSync(logger.logFile)) {
            const stats = fs.statSync(logger.logFile);
            if (stats.size > lastPosition) {
              const content = fs.readFileSync(logger.logFile, 'utf8');
              const newContent = content.slice(lastPosition);
              lastPosition = stats.size;

              const lines = newContent.trim().split('\n').filter(line => line);
              const logs = lines.map(line => {
                try {
                  return JSON.parse(line);
                } catch {
                  return null;
                }
              }).filter(Boolean);

              // Filter and send logs
              logs.forEach(log => {
                if (level && log.level !== level.toUpperCase()) return;
                if (provider && log.provider !== provider) return;
                callback(log);
              });
            }
          }
        } catch (error) {
          console.error('Error streaming logs:', error);
        }
      };

      // Initial read
      readNewLogs();

      // Set up file watcher if following
      if (follow) {
        const fs = require('fs');
        fs.watchFile(logger.logFile, { interval: 1000 }, readNewLogs);
      }

      return {
        stop: () => {
          if (follow) {
            fs.unwatchFile(logger.logFile);
          }
        }
      };
    }
  };
}

module.exports = {
  httpLogger,
  apiInterceptor,
  routeLogger,
  performanceMonitor,
  formatLogForOutput,
  searchLogs,
  streamLogs,
  generateRequestId
};