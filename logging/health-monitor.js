const { logger } = require('./enhanced-logger');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class HealthMonitor {
  constructor(options = {}) {
    this.providers = new Map();
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.timeout = options.timeout || 10000; // 10 seconds
    this.failureThreshold = options.failureThreshold || 3;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.enabled = options.enabled !== false;

    // Health status storage
    this.healthData = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: this.getCPUUsage()
      },
      providers: {}
    };

    this.intervalId = null;
  }

  // Add provider to monitor
  addProvider(name, config) {
    this.providers.set(name, {
      name,
      ...config,
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      lastSuccess: null,
      lastFailure: null,
      responseTime: null,
      error: null
    });
  }

  // Remove provider from monitoring
  removeProvider(name) {
    this.providers.delete(name);
  }

  // Get current CPU usage (simplified)
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      usage: 100 - (totalIdle / totalTick * 100).toFixed(2),
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown'
    };
  }

  // Perform health check on a provider
  async checkProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      logger.error(`Provider ${providerName} not found for health check`);
      return null;
    }

    const startTime = Date.now();
    let status = 'healthy';
    let error = null;

    try {
      // Check if API key is configured
      const apiKey = process.env[provider.api_key.replace('$', '')];
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      // Simple connectivity check
      const testResult = await this.testProviderConnectivity(provider);

      if (!testResult.success) {
        status = 'unhealthy';
        error = testResult.error;
      }

      const responseTime = Date.now() - startTime;

      // Update provider status
      provider.lastCheck = new Date().toISOString();
      provider.responseTime = responseTime;
      provider.error = error;

      if (status === 'healthy') {
        provider.consecutiveFailures = 0;
        provider.lastSuccess = new Date().toISOString();
        provider.status = 'healthy';
      } else {
        provider.consecutiveFailures++;
        provider.lastFailure = new Date().toISOString();

        if (provider.consecutiveFailures >= this.failureThreshold) {
          provider.status = 'down';
        } else {
          provider.status = 'degraded';
        }
      }

      logger.logHealthCheck(providerName, status, responseTime, error);

      return {
        name: providerName,
        status,
        responseTime,
        error,
        consecutiveFailures: provider.consecutiveFailures
      };

    } catch (err) {
      status = 'unhealthy';
      error = err.message;
      const responseTime = Date.now() - startTime;

      provider.lastCheck = new Date().toISOString();
      provider.responseTime = responseTime;
      provider.consecutiveFailures++;
      provider.lastFailure = new Date().toISOString();
      provider.error = error;

      if (provider.consecutiveFailures >= this.failureThreshold) {
        provider.status = 'down';
      } else {
        provider.status = 'degraded';
      }

      logger.logHealthCheck(providerName, status, responseTime, error);

      return {
        name: providerName,
        status,
        responseTime,
        error,
        consecutiveFailures: provider.consecutiveFailures
      };
    }
  }

  // Test basic connectivity to provider
  async testProviderConnectivity(provider) {
    return new Promise((resolve) => {
      const testPrompt = "Test";
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, this.timeout);

      try {
        // Create a simple test request
        const testRequest = {
          model: provider.models[0],
          messages: [{ role: "user", content: testPrompt }],
          max_tokens: 5
        };

        // Use curl for testing (more reliable than node HTTP for different APIs)
        const curl = spawn('curl', [
          '-s', '-w', '%{http_code}',
          '-o', '/dev/null',
          '-m', Math.floor(this.timeout / 1000),
          '-H', `Authorization: Bearer ${process.env[provider.api_key.replace('$', '')]}`,
          '-H', 'Content-Type: application/json',
          '-d', JSON.stringify(testRequest),
          provider.api_base_url
        ]);

        let output = '';
        curl.stdout.on('data', (data) => {
          output += data.toString();
        });

        curl.on('close', (code) => {
          clearTimeout(timeout);

          if (code === 0 && output.includes('200')) {
            resolve({ success: true });
          } else {
            resolve({
              success: false,
              error: `HTTP Error: ${output.trim() || code}`
            });
          }
        });

        curl.on('error', (err) => {
          clearTimeout(timeout);
          resolve({ success: false, error: err.message });
        });

      } catch (err) {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      }
    });
  }

  // Check all providers
  async checkAllProviders() {
    const results = {};
    const promises = [];

    for (const [name] of this.providers) {
      promises.push(this.checkProvider(name).then(result => {
        results[name] = result;
      }));
    }

    await Promise.all(promises);

    // Update health data
    this.healthData.timestamp = new Date().toISOString();
    this.healthData.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: this.getCPUUsage()
    };

    this.healthData.providers = results;

    return results;
  }

  // Get provider health status
  getProviderHealth(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return null;
    }

    return {
      name: provider.name,
      status: provider.status,
      lastCheck: provider.lastCheck,
      lastSuccess: provider.lastSuccess,
      lastFailure: provider.lastFailure,
      consecutiveFailures: provider.consecutiveFailures,
      responseTime: provider.responseTime,
      error: provider.error,
      isHealthy: provider.status === 'healthy',
      isAvailable: provider.status !== 'down'
    };
  }

  // Get overall system health
  getSystemHealth() {
    const providers = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let downCount = 0;

    for (const [name, provider] of this.providers) {
      providers[name] = this.getProviderHealth(name);

      switch (provider.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'down':
          downCount++;
          break;
      }
    }

    const totalProviders = this.providers.size;
    const systemStatus = downCount === totalProviders ? 'critical' :
                         downCount > 0 ? 'degraded' :
                         degradedCount > 0 ? 'warning' : 'healthy';

    return {
      status: systemStatus,
      timestamp: this.healthData.timestamp,
      system: this.healthData.system,
      providers: {
        total: totalProviders,
        healthy: healthyCount,
        degraded: degradedCount,
        down: downCount,
        details: providers
      },
      recommendations: this.getRecommendations(providers)
    };
  }

  // Get health recommendations
  getRecommendations(providers) {
    const recommendations = [];

    for (const [name, provider] of this.providers) {
      if (provider.status === 'down') {
        recommendations.push({
          type: 'critical',
          provider: name,
          message: `Provider ${name} is down. Check API key and service status.`,
          action: 'verify_api_key'
        });
      } else if (provider.status === 'degraded') {
        recommendations.push({
          type: 'warning',
          provider: name,
          message: `Provider ${name} is experiencing issues (${provider.consecutiveFailures} consecutive failures).`,
          action: 'monitor_closely'
        });
      } else if (provider.responseTime && provider.responseTime > 5000) {
        recommendations.push({
          type: 'performance',
          provider: name,
          message: `Provider ${name} has high response time (${provider.responseTime}ms).`,
          action: 'consider_alternative'
        });
      }
    }

    // System-level recommendations
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2);

    if (parseFloat(memUsagePercent) > 90) {
      recommendations.push({
        type: 'system',
        message: `High memory usage: ${memUsagePercent}%. Consider restarting the service.`,
        action: 'restart_service'
      });
    }

    return recommendations;
  }

  // Start health monitoring
  start() {
    if (!this.enabled || this.intervalId) {
      return;
    }

    logger.info('Starting health monitoring', {
      interval: this.checkInterval,
      timeout: this.timeout,
      providers: this.providers.size
    });

    // Initial check
    this.checkAllProviders().catch(error => {
      logger.error('Initial health check failed', { error: error.message });
    });

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkAllProviders().catch(error => {
        logger.error('Periodic health check failed', { error: error.message });
      });
    }, this.checkInterval);
  }

  // Stop health monitoring
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Health monitoring stopped');
    }
  }

  // Export health data to file
  exportHealthData(format = 'json') {
    const healthData = this.getSystemHealth();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `health-report-${timestamp}.${format}`;
    const filepath = path.join(os.homedir(), '.claude-code-router', 'logs', filename);

    try {
      if (format === 'json') {
        fs.writeFileSync(filepath, JSON.stringify(healthData, null, 2));
      } else if (format === 'csv') {
        // Convert to CSV format
        const headers = ['Provider', 'Status', 'Last Check', 'Response Time', 'Errors'];
        const rows = [headers];

        Object.entries(healthData.providers.details).forEach(([name, provider]) => {
          rows.push([
            name,
            provider.status,
            provider.lastCheck || '',
            provider.responseTime || '',
            provider.error || ''
          ]);
        });

        const csv = rows.map(row => row.join(',')).join('\n');
        fs.writeFileSync(filepath, csv);
      }

      logger.info('Health data exported', { filepath, format });
      return filepath;
    } catch (error) {
      logger.error('Failed to export health data', { error: error.message });
      return null;
    }
  }

  // Generate health report for CLI
  generateHealthReport() {
    const health = this.getSystemHealth();
    const report = [];

    // System summary
    report.push(`\n📊 System Health Status: ${health.status.toUpperCase()}`);
    report.push(`Timestamp: ${health.timestamp}`);
    report.push(`Providers: ${health.providers.healthy}/${health.providers.total} healthy`);

    if (health.recommendations.length > 0) {
      report.push(`\n⚠️  Recommendations:`);
      health.recommendations.forEach(rec => {
        const icon = rec.type === 'critical' ? '🚨' :
                    rec.type === 'warning' ? '⚠️' :
                    rec.type === 'performance' ? '📈' : 'ℹ️';
        report.push(`  ${icon} ${rec.message}`);
      });
    }

    // Provider details
    report.push(`\n🏭 Provider Status:`);
    Object.entries(health.providers.details).forEach(([name, provider]) => {
      const status = provider.isHealthy ? '🟢' :
                    provider.status === 'degraded' ? '🟡' : '🔴';
      const latency = provider.responseTime ? `${provider.responseTime}ms` : 'N/A';

      report.push(`  ${status} ${name}: ${provider.status} (${latency})`);

      if (provider.error) {
        report.push(`    Error: ${provider.error}`);
      }
    });

    // System metrics
    const mem = health.system.memory;
    const memUsage = ((mem.heapUsed / mem.heapTotal) * 100).toFixed(2);
    report.push(`\n💻 System Metrics:`);
    report.push(`  Uptime: ${Math.floor(health.system.uptime / 3600)}h`);
    report.push(`  Memory: ${memUsage}% (${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB)`);
    report.push(`  CPU: ${health.system.cpu.usage}%`);

    return report.join('\n');
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

module.exports = {
  HealthMonitor,
  healthMonitor
};