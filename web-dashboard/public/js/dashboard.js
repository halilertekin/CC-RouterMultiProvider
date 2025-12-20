// Dashboard JavaScript
class Dashboard {
  constructor() {
    this.apiBase = '/api';
    this.currentTab = 'overview';
    this.refreshInterval = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
    this.startAutoRefresh();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Analytics period change
    const periodSelect = document.getElementById('analytics-period');
    if (periodSelect) {
      periodSelect.addEventListener('change', () => {
        this.loadAnalyticsData();
      });
    }

    // Config template change
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
      templateSelect.addEventListener('change', () => {
        this.updateTemplatePreview();
      });
    }
  }

  switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    this.currentTab = tabName;

    // Load tab-specific data
    this.loadTabData(tabName);
  }

  async loadTabData(tabName) {
    switch (tabName) {
      case 'overview':
        await this.loadOverviewData();
        break;
      case 'analytics':
        await this.loadAnalyticsData();
        break;
      case 'health':
        await this.loadHealthData();
        break;
      case 'config':
        await this.loadConfigData();
        break;
    }
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.loadOverviewData(),
        this.loadConfigData()
      ]);
    } catch (error) {
      this.showError('Failed to load initial data');
    }
  }

  async loadOverviewData() {
    try {
      const [todayResponse, providersResponse] = await Promise.all([
        fetch(`${this.apiBase}/analytics/today`),
        fetch(`${this.apiBase}/health/providers`)
      ]);

      const today = await todayResponse.json();
      const providers = await providersResponse.json();

      this.updateTodayStats(today.data);
      this.updateProviderStatus(providers.data);
      this.updateLastUpdated();
    } catch (error) {
      console.error('Failed to load overview data:', error);
    }
  }

  async loadAnalyticsData() {
    try {
      const period = document.getElementById('analytics-period')?.value || 'week';
      const response = await fetch(`${this.apiBase}/analytics/summary`);
      const data = await response.json();

      this.updateAnalyticsDisplay(data.data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  async loadHealthData() {
    try {
      const [providersResponse, systemResponse] = await Promise.all([
        fetch(`${this.apiBase}/health/providers`),
        fetch(`${this.apiBase}/health/system`)
      ]);

      const providers = await providersResponse.json();
      const system = await systemResponse.json();

      this.updateHealthProviders(providers.data);
      this.updateSystemHealth(system.data);
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  }

  async loadConfigData() {
    try {
      const [configResponse, templatesResponse] = await Promise.all([
        fetch(`${this.apiBase}/config/current`),
        fetch(`${this.apiBase}/config/templates`)
      ]);

      const config = await configResponse.json();
      const templates = await templatesResponse.json();

      this.updateConfigDisplay(config.data);
      this.updateTemplateOptions(templates.data);
    } catch (error) {
      console.error('Failed to load config data:', error);
    }
  }

  updateTodayStats(data) {
    if (!data) return;

    document.getElementById('today-requests').textContent = data.requests || 0;
    document.getElementById('today-tokens').textContent = this.formatNumber(data.tokens || 0);
    document.getElementById('today-cost').textContent = `$${(data.cost || 0).toFixed(4)}`;
    document.getElementById('today-latency').textContent = `${data.avgLatency || 0}ms`;
  }

  updateProviderStatus(providers) {
    const container = document.getElementById('provider-status-grid');
    if (!container) return;

    container.innerHTML = '';

    providers.forEach(provider => {
      const statusDiv = document.createElement('div');
      statusDiv.className = `provider-status ${provider.status}`;
      statusDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.5rem;">${provider.name}</div>
        <div style="font-size: 0.875rem; color: var(--text-secondary);">${provider.status}</div>
      `;
      container.appendChild(statusDiv);
    });
  }

  updateAnalyticsDisplay(data) {
    if (!data) return;

    const container = document.getElementById('detailed-stats');
    if (!container) return;

    const showDetailed = document.getElementById('show-detailed')?.checked;
    const showCosts = document.getElementById('show-costs')?.checked;

    let html = `
      <div class="metric">
        <span class="label">Total Requests</span>
        <span class="value">${this.formatNumber(data.totalRequests || 0)}</span>
      </div>
      <div class="metric">
        <span class="label">Total Tokens</span>
        <span class="value">${this.formatNumber(data.totalTokens || 0)}</span>
      </div>
    `;

    if (showCosts) {
      html += `
        <div class="metric">
          <span class="label">Total Cost</span>
          <span class="value">$${(data.totalCost || 0).toFixed(4)}</span>
        </div>
      `;
    }

    html += `
      <div class="metric">
        <span class="label">Average Latency</span>
        <span class="value">${data.avgLatency || 0}ms</span>
      </div>
    `;

    if (showDetailed && data.providers) {
      html += '<h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Provider Breakdown</h4>';
      Object.entries(data.providers).forEach(([provider, count]) => {
        html += `
          <div class="metric">
            <span class="label">${provider}</span>
            <span class="value">${this.formatNumber(count)}</span>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  }

  updateHealthProviders(providers) {
    const container = document.getElementById('health-providers');
    if (!container) return;

    container.innerHTML = '';

    providers.forEach(provider => {
      const statusClass = provider.status === 'healthy' ? 'status-healthy' : 'status-unhealthy';
      const statusDiv = document.createElement('div');
      statusDiv.className = `metric`;
      statusDiv.innerHTML = `
        <span class="label">${provider.name}</span>
        <span class="status-badge ${statusClass}">${provider.status}</span>
      `;
      container.appendChild(statusDiv);
    });
  }

  updateSystemHealth(data) {
    if (!data) return;

    document.getElementById('system-uptime').textContent = this.formatDuration(data.uptime);
    document.getElementById('system-memory').textContent = this.formatBytes(data.memory?.used || 0);
    document.getElementById('system-node').textContent = data.nodeVersion || '-';
  }

  updateConfigDisplay(config) {
    const container = document.getElementById('config-display');
    if (!container) return;

    container.innerHTML = `
      <pre style="background: var(--background); padding: 1rem; border-radius: var(--radius); overflow-x: auto;">
        ${JSON.stringify(config, null, 2)}
      </pre>
    `;

    // Update provider config
    const providerContainer = document.getElementById('provider-config');
    if (providerContainer && config.Providers) {
      providerContainer.innerHTML = '';
      config.Providers.forEach(provider => {
        providerContainer.innerHTML += `
          <div class="metric">
            <span class="label">${provider.name}</span>
            <span class="value">${provider.models.length} models</span>
          </div>
        `;
      });
    }

    // Update router config
    const routerContainer = document.getElementById('router-config');
    if (routerContainer && config.Router) {
      routerContainer.innerHTML = '';
      Object.entries(config.Router).forEach(([key, value]) => {
        routerContainer.innerHTML += `
          <div class="metric">
            <span class="label">${key}</span>
            <span class="value">${JSON.stringify(value)}</span>
          </div>
        `;
      });
    }
  }

  updateTemplateOptions(templates) {
    const select = document.getElementById('template-select');
    if (!select) return;

    // Keep current selection
    const currentValue = select.value;

    // Clear existing options (except the first one)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.name;
      option.textContent = template.description || template.name;
      select.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (currentValue) {
      select.value = currentValue;
    }
  }

  async refreshData() {
    this.showLoading();
    try {
      await this.loadTabData(this.currentTab);
      this.showSuccess('Data refreshed');
    } catch (error) {
      this.showError('Failed to refresh data');
    }
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadTabData(this.currentTab);
    }, 30000); // Refresh every 30 seconds
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Utility methods
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatBytes(bytes) {
    if (bytes >= 1073741824) {
      return (bytes / 1073741824).toFixed(2) + ' GB';
    } else if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return bytes + ' B';
  }

  formatDuration(seconds) {
    if (seconds >= 3600) {
      return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
    } else if (seconds >= 60) {
      return Math.floor(seconds / 60) + 'm ' + Math.floor(seconds % 60) + 's';
    }
    return Math.floor(seconds) + 's';
  }

  updateLastUpdated() {
    const element = document.getElementById('last-updated');
    if (element) {
      element.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }

  showLoading() {
    document.getElementById('connection-status').textContent = 'Loading...';
    document.getElementById('connection-status').className = 'status-badge status-warning';
  }

  showSuccess(message) {
    document.getElementById('connection-status').textContent = message;
    document.getElementById('connection-status').className = 'status-badge status-healthy';
  }

  showError(message) {
    document.getElementById('connection-status').textContent = message;
    document.getElementById('connection-status').className = 'status-badge status-unhealthy';
  }
}

// Global functions for button clicks
window.dashboard = null;

async function refreshData() {
  if (window.dashboard) {
    await window.dashboard.refreshData();
  }
}

async function testAllProviders() {
  try {
    const response = await fetch('/api/health/providers');
    const data = await response.json();
    alert(`Provider tests completed:\n${data.data.map(p => `${p.name}: ${p.status}`).join('\n')}`);
  } catch (error) {
    alert('Failed to test providers');
  }
}

function openConfig() {
  alert('Configuration editor would open here');
}

function viewLogs() {
  alert('Log viewer would open here');
}

async function exportAnalytics() {
  try {
    const format = prompt('Export format (json/csv):', 'json');
    if (format) {
      window.location.href = `/api/analytics/export?format=${format}`;
    }
  } catch (error) {
    alert('Failed to export analytics');
  }
}

async function refreshHealthStatus() {
  try {
    const response = await fetch('/api/health/providers');
    const data = await response.json();
    alert('Health status refreshed');
  } catch (error) {
    alert('Failed to refresh health status');
  }
}

async function runHealthChecks() {
  alert('Running comprehensive health checks...');
}

function applyTemplate() {
  const select = document.getElementById('template-select');
  if (select && select.value) {
    alert(`Applying template: ${select.value}`);
  }
}

function backupConfig() {
  alert('Configuration backup would be created here');
}

function validateConfig() {
  alert('Configuration validation would run here');
}

function editConfig() {
  alert('Configuration editor would open here');
}

function reloadConfig() {
  alert('Configuration would be reloaded here');
}

function updateTemplatePreview() {
  const select = document.getElementById('template-select');
  if (select && select.value) {
    console.log(`Template preview: ${select.value}`);
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function showModal(title, content, actionText = null, actionCallback = null) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalAction = document.getElementById('modal-action');

  modalTitle.textContent = title;
  modalBody.innerHTML = content;

  if (actionText && actionCallback) {
    modalAction.textContent = actionText;
    modalAction.style.display = 'block';
    modalAction.onclick = actionCallback;
  } else {
    modalAction.style.display = 'none';
  }

  modal.classList.remove('hidden');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.dashboard) {
    window.dashboard.stopAutoRefresh();
  }
});