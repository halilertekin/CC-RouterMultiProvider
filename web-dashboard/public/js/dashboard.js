class Dashboard {
  constructor() {
    this.apiBase = '/api';
    this.lang = this.detectLanguage();
    this.providers = [];
    this.envKeys = [];
    this.translations = this.buildTranslations();
    this.bindEvents();
    this.setLanguage(this.lang);
    this.refreshAll();
    this.interval = setInterval(() => this.refreshAll(), 30000);
  }

  buildTranslations() {
    return {
      tr: {
        appTitle: 'Claude Code Router',
        appSubtitle: 'Birleşik yönlendirici panosu',
        refresh: 'Yenile',
        connected: 'Bağlı',
        disconnected: 'Bağlantı yok',
        overview: 'Genel Bakış',
        lastUpdated: 'Son güncelleme',
        requests: 'İstekler',
        tokens: 'Token',
        cost: 'Maliyet',
        avgLatency: 'Ort. Gecikme',
        providers: 'Sağlayıcılar',
        quickActions: 'Hızlı İşlemler',
        export: 'Dışa aktar',
        refreshHealth: 'Sağlığı yenile',
        analytics: 'Analitik',
        periodLabel: 'Dönem',
        periodToday: 'Bugün',
        periodWeek: 'Son 7 gün',
        periodMonth: 'Son 30 gün',
        totalRequests: 'Toplam İstek',
        totalTokens: 'Toplam Token',
        totalCost: 'Toplam Maliyet',
        topProviders: 'En Çok Kullanılanlar',
        health: 'Sağlık',
        system: 'Sistem',
        uptime: 'Çalışma Süresi',
        memory: 'Bellek',
        cpu: 'CPU',
        node: 'Node Sürümü',
        config: 'Yapılandırma',
        configSummary: 'Özet',
        providerCount: 'Sağlayıcı sayısı',
        defaultRoute: 'Varsayılan rota',
        logging: 'Loglama',
        configJson: 'Konfigürasyon',
        env: 'Ortam Değişkenleri',
        envHint: 'Anahtarları hızlıca güncelle',
        envStatus: 'Durum',
        envUpdate: 'Güncelle',
        envKeyLabel: 'Anahtar',
        envKeyPlaceholder: 'CUSTOM_KEY',
        envValueLabel: 'Değer',
        envSave: 'Kaydet',
        envSaved: 'Kaydedildi',
        envSaveError: 'Kaydedilemedi',
        envSet: 'Tanımlı',
        envMissing: 'Eksik',
        envPath: 'Dosya',
        envSelect: 'Anahtar seç'
        logOn: 'Açık',
        logOff: 'Kapalı',
        statusHealthy: 'Sağlıklı',
        statusDegraded: 'Degrade',
        statusDown: 'Kapalı',
        statusUnknown: 'Bilinmiyor',
        dataUnavailable: 'Veri yok'
      },
      nl: {
        appTitle: 'Claude Code Router',
        appSubtitle: 'Gecombineerde routerconsole',
        refresh: 'Vernieuwen',
        connected: 'Verbonden',
        disconnected: 'Niet verbonden',
        overview: 'Overzicht',
        lastUpdated: 'Laatst bijgewerkt',
        requests: 'Verzoeken',
        tokens: 'Tokens',
        cost: 'Kosten',
        avgLatency: 'Gem. latentie',
        providers: 'Providers',
        quickActions: 'Snelle acties',
        export: 'Exporteren',
        refreshHealth: 'Status vernieuwen',
        analytics: 'Analyse',
        periodLabel: 'Periode',
        periodToday: 'Vandaag',
        periodWeek: 'Laatste 7 dagen',
        periodMonth: 'Laatste 30 dagen',
        totalRequests: 'Totaal verzoeken',
        totalTokens: 'Totaal tokens',
        totalCost: 'Totale kosten',
        topProviders: 'Meest gebruikt',
        health: 'Status',
        system: 'Systeem',
        uptime: 'Uptime',
        memory: 'Geheugen',
        cpu: 'CPU',
        node: 'Node-versie',
        config: 'Configuratie',
        configSummary: 'Overzicht',
        providerCount: 'Aantal providers',
        defaultRoute: 'Standaard route',
        logging: 'Logging',
        configJson: 'Configuratie',
        env: 'Omgevingsvariabelen',
        envHint: 'Snel sleutels bijwerken',
        envStatus: 'Status',
        envUpdate: 'Bijwerken',
        envKeyLabel: 'Sleutel',
        envKeyPlaceholder: 'CUSTOM_KEY',
        envValueLabel: 'Waarde',
        envSave: 'Opslaan',
        envSaved: 'Opgeslagen',
        envSaveError: 'Opslaan mislukt',
        envSet: 'Ingesteld',
        envMissing: 'Ontbreekt',
        envPath: 'Bestand',
        envSelect: 'Sleutel kiezen'
        logOn: 'Aan',
        logOff: 'Uit',
        statusHealthy: 'Gezond',
        statusDegraded: 'Gedegradeerd',
        statusDown: 'Niet beschikbaar',
        statusUnknown: 'Onbekend',
        dataUnavailable: 'Geen gegevens'
      }
    };
  }

  detectLanguage() {
    const stored = localStorage.getItem('ccr_lang');
    if (stored) return stored;
    const lang = navigator.language || 'tr';
    if (lang.startsWith('nl')) return 'nl';
    if (lang.startsWith('tr')) return 'tr';
    return 'tr';
  }

  t(key) {
    return this.translations[this.lang]?.[key] || key;
  }

  setLanguage(lang) {
    this.lang = lang;
    localStorage.setItem('ccr_lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key));
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    this.updateLastUpdated();
  }

  bindEvents() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.addEventListener('click', () => this.refreshAll());

    const exportBtn = document.getElementById('export-btn');
    exportBtn?.addEventListener('click', () => this.exportAnalytics());

    const refreshHealth = document.getElementById('refresh-health');
    refreshHealth?.addEventListener('click', () => this.loadHealth());

    const envSave = document.getElementById('env-save');
    envSave?.addEventListener('click', () => this.saveEnv());

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.setLanguage(btn.dataset.lang));
    });

    const periodSelect = document.getElementById('analytics-period');
    periodSelect?.addEventListener('change', () => this.loadAnalytics());
  }

  async fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async postJson(path, payload) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async refreshAll() {
    try {
      this.setConnectionStatus(true);
      await Promise.all([
        this.loadOverview(),
        this.loadAnalytics(),
        this.loadHealth(),
        this.loadConfig(),
        this.loadStatus(),
        this.loadEnv()
      ]);
      this.updateLastUpdated();
    } catch (error) {
      this.setConnectionStatus(false);
      console.error('Failed to refresh dashboard', error);
    }
  }

  async loadOverview() {
    const [todayResponse, providersResponse] = await Promise.all([
      this.fetchJson(`${this.apiBase}/analytics/today`),
      this.fetchJson(`${this.apiBase}/health/providers`)
    ]);

    const today = todayResponse.data || {};
    this.providers = providersResponse.data || [];

    document.getElementById('today-requests').textContent = this.formatNumber(today.requests || 0);
    document.getElementById('today-tokens').textContent = this.formatNumber(today.tokens || 0);
    document.getElementById('today-cost').textContent = this.formatCurrency(today.cost || 0);
    document.getElementById('today-latency').textContent = `${today.avgLatency || 0}ms`;

    this.renderProviderList('provider-status-list', this.providers);
  }

  async loadAnalytics() {
    const period = document.getElementById('analytics-period')?.value || 'week';
    const summaryResponse = await this.fetchJson(`${this.apiBase}/analytics/summary?period=${period}`);
    const summary = summaryResponse.data || {};

    document.getElementById('summary-requests').textContent = this.formatNumber(summary.totalRequests || 0);
    document.getElementById('summary-tokens').textContent = this.formatNumber(summary.totalTokens || 0);
    document.getElementById('summary-cost').textContent = this.formatCurrency(summary.totalCost || 0);
    document.getElementById('summary-latency').textContent = `${summary.avgLatency || 0}ms`;

    this.renderTopProviders(summary.providers || {});
  }

  async loadHealth() {
    const systemResponse = await this.fetchJson(`${this.apiBase}/health/system`);
    const system = systemResponse.data || {};

    if (!this.providers.length) {
      const providersResponse = await this.fetchJson(`${this.apiBase}/health/providers`);
      this.providers = providersResponse.data || [];
    }

    this.renderProviderList('health-providers', this.providers);

    document.getElementById('system-uptime').textContent = this.formatDuration(system.uptime || 0);
    document.getElementById('system-memory').textContent = this.formatBytes(system.memory?.heapUsed || 0);
    document.getElementById('system-cpu').textContent = system.cpu ? `${system.cpu.usage}%` : '-';
    document.getElementById('system-node').textContent = system.nodeVersion || '-';
  }

  async loadConfig() {
    const configResponse = await this.fetchJson(`${this.apiBase}/config`);
    const config = configResponse.data || {};

    document.getElementById('config-providers').textContent = (config.Providers || []).length;
    document.getElementById('config-default').textContent = config.Router?.default || '-';
    document.getElementById('config-logging').textContent = config.LOG ? this.t('logOn') : this.t('logOff');

    const configDisplay = document.getElementById('config-display');
    if (configDisplay) {
      configDisplay.textContent = JSON.stringify(config, null, 2);
    }
  }

  async loadStatus() {
    const statusResponse = await this.fetchJson(`${this.apiBase}/status`);
    const status = statusResponse.data || {};
    const version = status.version || 'v2';
    const versionEl = document.getElementById('version');
    if (versionEl) {
      versionEl.textContent = `v${version}`.replace(/^vv/, 'v');
    }
  }

  async loadEnv() {
    const envResponse = await this.fetchJson(`${this.apiBase}/env`);
    const payload = envResponse.data || {};
    this.envKeys = payload.keys || [];
    this.renderEnvList(this.envKeys);
    this.populateEnvSelect(this.envKeys);

    const envPath = document.getElementById('env-path');
    if (envPath && payload.envPath) {
      envPath.textContent = `${this.t('envPath')}: ${payload.envPath}`;
    }
  }

  renderProviderList(targetId, providers) {
    const container = document.getElementById(targetId);
    if (!container) return;

    container.innerHTML = '';
    if (!providers.length) {
      container.innerHTML = `<div class="muted">${this.t('dataUnavailable')}</div>`;
      return;
    }

    providers.forEach((provider) => {
      const statusKey = this.resolveStatus(provider.status || 'unknown');
      const item = document.createElement('div');
      item.className = 'list-item';

      const left = document.createElement('div');
      left.className = 'list-left';

      const dot = document.createElement('span');
      dot.className = `dot ${statusKey}`;

      const name = document.createElement('span');
      name.textContent = provider.name;

      left.appendChild(dot);
      left.appendChild(name);

      const badge = document.createElement('span');
      badge.textContent = this.statusLabel(statusKey);

      item.appendChild(left);
      item.appendChild(badge);
      container.appendChild(item);
    });
  }

  renderTopProviders(providerStats) {
    const container = document.getElementById('top-providers');
    if (!container) return;

    const entries = Object.entries(providerStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    container.innerHTML = '';
    if (!entries.length) {
      container.innerHTML = `<div class="muted">${this.t('dataUnavailable')}</div>`;
      return;
    }

    entries.forEach(([provider, count]) => {
      const item = document.createElement('div');
      item.className = 'list-item';

      const left = document.createElement('div');
      left.className = 'list-left';

      const dot = document.createElement('span');
      dot.className = 'dot ok';

      const name = document.createElement('span');
      name.textContent = provider;

      left.appendChild(dot);
      left.appendChild(name);

      const value = document.createElement('span');
      value.textContent = this.formatNumber(count);

      item.appendChild(left);
      item.appendChild(value);
      container.appendChild(item);
    });
  }

  renderEnvList(keys) {
    const container = document.getElementById('env-list');
    if (!container) return;

    container.innerHTML = '';
    if (!keys.length) {
      container.innerHTML = `<div class="muted">${this.t('dataUnavailable')}</div>`;
      return;
    }

    keys.forEach((item) => {
      const entry = document.createElement('div');
      entry.className = 'list-item';

      const left = document.createElement('div');
      left.className = 'list-left';

      const dot = document.createElement('span');
      dot.className = `dot ${item.present ? 'ok' : 'warn'}`;

      const name = document.createElement('span');
      name.textContent = item.name;

      left.appendChild(dot);
      left.appendChild(name);

      const badge = document.createElement('span');
      badge.textContent = item.present ? this.t('envSet') : this.t('envMissing');

      entry.appendChild(left);
      entry.appendChild(badge);
      container.appendChild(entry);
    });
  }

  populateEnvSelect(keys) {
    const select = document.getElementById('env-key-select');
    if (!select) return;
    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = this.t('envSelect');
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    keys.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.name;
      option.textContent = item.name;
      select.appendChild(option);
    });
  }

  resolveStatus(status) {
    if (['healthy', 'ok'].includes(status)) return 'ok';
    if (['degraded', 'warn', 'warning'].includes(status)) return 'warn';
    if (['down', 'unhealthy', 'error'].includes(status)) return 'down';
    return 'unknown';
  }

  statusLabel(statusKey) {
    switch (statusKey) {
      case 'ok':
        return this.t('statusHealthy');
      case 'warn':
        return this.t('statusDegraded');
      case 'down':
        return this.t('statusDown');
      default:
        return this.t('statusUnknown');
    }
  }

  setConnectionStatus(connected) {
    const badge = document.getElementById('connection-status');
    if (!badge) return;
    badge.textContent = connected ? this.t('connected') : this.t('disconnected');
    badge.classList.toggle('status-ok', connected);
    badge.classList.toggle('status-down', !connected);
  }

  updateLastUpdated() {
    const element = document.getElementById('last-updated');
    if (element) {
      const now = new Date();
      element.textContent = `${this.t('lastUpdated')}: ${now.toLocaleTimeString(this.locale())}`;
    }
  }

  exportAnalytics() {
    const period = document.getElementById('analytics-period')?.value || 'week';
    window.location.href = `${this.apiBase}/analytics/export?format=json&period=${period}`;
  }

  async saveEnv() {
    const select = document.getElementById('env-key-select');
    const custom = document.getElementById('env-key-custom');
    const valueInput = document.getElementById('env-value');
    const result = document.getElementById('env-result');

    const keyCandidate = (custom?.value || select?.value || '').trim();
    const value = valueInput?.value?.trim() || '';

    if (!keyCandidate || !value) {
      if (result) result.textContent = this.t('envSaveError');
      return;
    }

    if (result) result.textContent = '';

    try {
      await this.postJson(`${this.apiBase}/env`, { key: keyCandidate, value });
      if (result) result.textContent = this.t('envSaved');
      if (valueInput) valueInput.value = '';
      if (custom) custom.value = '';
      await this.loadEnv();
    } catch (error) {
      if (result) result.textContent = this.t('envSaveError');
      console.error('Failed to save env', error);
    }
  }

  locale() {
    return this.lang === 'nl' ? 'nl-NL' : 'tr-TR';
  }

  formatNumber(value) {
    return new Intl.NumberFormat(this.locale()).format(value || 0);
  }

  formatCurrency(value) {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  formatDuration(seconds) {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
