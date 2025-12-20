# AgentSkills Kurulum Rehberi

## Hızlı Başlangıç

Bu rehber, AgentSkills'i Claude Code Router yapılandırmanıza entegre etmek için adım adım talimatlar sağlar.

## Ön Koşullar

- Çalışan Claude Code Router kurulumu (Homebrew kurulumuna bakın)
- Claude Sonnet 4 erişimi olan Anthropic API anahtarı
- Yüklü Node.js 16+ ve pnpm
- JSON ve JavaScript yapılandırması hakkında temel bilgi

## Adım 1: Yapılandırma Dosyalarını Güncelleyin

### 1.1 config.json Dosyasını Güncelleyin

AgentSkills'i yeni bir sağlayıcı olarak ekleyin:

```bash
# Mevcut yapılandırmayı yedekle
cp ~/.claude-code-router/config.json ~/.claude-code-router/config.json.backup
```

`~/.claude-code-router/config.json` dosyasını düzenleyin ve AgentSkills sağlayıcısını ekleyin:

```json
{
  "_comment": "AgentSkills Entegrasyonlu Claude Code Router Yapılandırması",
  "_attribution": "Orijinal proje: https://github.com/musistudio/claude-code-router",
  "_author": "Yapılandırma: Halil Ertekin",
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 300000,
  "CUSTOM_ROUTER_PATH": "$HOME/.claude-code-router/intent-router.js",

  "Providers": [
    {
      "name": "openai",
      "api_base_url": "https://api.openai.com/v1/chat/completions",
      "api_key": "$OPENAI_API_KEY",
      "models": ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini", "o1", "o1-mini"],
      "transformer": { "use": [] }
    },
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "$ANTHROPIC_API_KEY",
      "models": ["claude-sonnet-4-latest", "claude-3-5-sonnet-latest"],
      "transformer": { "use": ["Anthropic"] }
    },
    {
      "name": "agentskills",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "$ANTHROPIC_API_KEY",
      "models": ["claude-sonnet-4-latest"],
      "transformer": { "use": ["Anthropic"] },
      "skills_enabled": true,
      "skills_registry": "$HOME/.claude-code-router/skills"
    }
    // ... diğer sağlayıcılar
  ],

  "Router": {
    "default": "openai,gpt-4o",
    "background": "qwen,qwen-turbo",
    "think": "anthropic,claude-sonnet-4-latest",
    "longContext": "gemini,gemini-2.5-flash",
    "longContextThreshold": 60000,
    "skills": "agentskills,claude-sonnet-4-latest"
  }
}
```

### 1.2 Skills Dizinini Oluşturun

```bash
# Skills dizinini oluştur
mkdir -p ~/.claude-code-router/skills

# Skill kayıt dosyasını oluştur
cat > ~/.claude-code-router/skills/registry.json << 'EOF'
{
  "version": "1.0.0",
  "skills": [
    {
      "name": "business-panel",
      "description": "Uzman çerçevelerle iş analizi",
      "provider": "agentskills",
      "model": "claude-sonnet-4-latest",
      "enabled": true,
      "priority": "highest"
    },
    {
      "name": "code-review",
      "description": "Kapsamlı kod kalitesi analizi",
      "provider": "agentskills",
      "model": "claude-sonnet-4-latest",
      "enabled": true,
      "priority": "high"
    }
  ]
}
EOF
```

## Adım 2: Intent Router'ı Güncelleyin

### 2.1 Gelişmiş Intent Router Oluşturun

```bash
# Mevcut router'ı yedekle
cp ~/.claude-code-router/intent-router.js ~/.claude-code-router/intent-router.js.backup
```

`~/.claude-code-router/intent-router.js` dosyasında yeni gelişmiş intent router oluşturun:

```javascript
/**
 * AgentSkills Entegrasyonlu Çoklu Sağlayıcı Intent Router
- İsteğin görev türüne ve beceri gereksinimlerine göre optimal sağlayıcıya yönlendirme
 *
 * Bu router @musistudio/claude-code-router ile kullanım için tasarlanmıştır
 * Orijinal proje: https://github.com/musistudio/claude-code-router
 *
 * AgentSkills desteği ile geliştiren: Halil Ertekin
 */

const fs = require('fs');
const path = require('path');

// Skills kayıt defterini yükle
let skillsRegistry = null;
try {
  const registryPath = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-code-router/skills/registry.json');
  skillsRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
} catch (error) {
  console.log('[Router] Skills kayıt defteri bulunamadı, standart yönlendirme kullanılıyor');
}

const INTENTS = {
  // AgentSkills yönlendirmesi - en yüksek öncelik
  AGENT_SKILLS: {
    patterns: [
      /\b\/sc:[\w-]+\b/i,  // Tüm SuperClaude komutları
      /\b(skill:|capability:|expertise:)\w+/i,
      /\b(agent|assistant) with \w+ skill/i
    ],
    route: "agentskills,claude-sonnet-4-latest",
    priority: 100
  },

  // Business Panel - uzman analizi
  BUSINESS_PANEL: {
    patterns: [
      /\b\/sc:business-panel\b/i,
      /\b(iş analizi|stratejik planlama|pazar araştırması)\b/i,
      /\b(porter|christensen|drucker|godin|meadows)\b/i
    ],
    route: "agentskills,business-panel",
    priority: 90,
    fallback: "anthropic,claude-sonnet-4-latest"
  },

  // Code Review - uzman analizi
  CODE_REVIEW: {
    patterns: [
      /\b\/sc:code-review\b/i,
      /\b(kodu incele|kod kalitesi|en iyi uygulamalar)\b/i,
      /\b(pr review|pull request|kod analizi)\b/i
    ],
    route: "agentskills,code-review",
    priority: 85,
    fallback: "openai,gpt-4o"
  },

  // Orijinal intent'ler ayarlanmış önceliklerle
  CODING: {
    patterns: [
      /\b(implement|refactor|debug|fix|write|code|function|class|method|bug|error|compile|syntax)\b/i,
      /\b(typescript|javascript|python|rust|go|java|react|vue|angular|swift|kotlin)\b/i,
      /\b(api|endpoint|database|query|migration|schema|test|unit test)\b/i,
      /\b(codex|o1|reasoning)\b/i
    ],
    route: "openai,gpt-4o",
    priority: 80
  },

  REASONING: {
    patterns: [
      /\b(architect|design|analyze|plan|strategy|structure|system|trade-?off)\b/i,
      /\b(why|explain|reason|understand|compare|evaluate|consider|review)\b/i,
      /\b(decision|approach|best practice|pattern|principle|philosophy)\b/i
    ],
    route: "anthropic,claude-sonnet-4-latest",
    priority: 75
  },

  // ... diğer mevcut intent'ler
};

// İçerik çıkarma yardımcı fonksiyonu
function extractContent(req) {
  const messages = req.body?.messages || [];
  return messages
    .filter(m => m.role === "user" || m.role === "system")
    .map(m => typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    .join(" ")
    .slice(0, 3000);
}

// Gelişmiş beceri tespiti
function detectSkills(content) {
  const skills = [];

  // SuperClaude komutlarını kontrol et
  const scMatch = content.match(/\/sc:([\w-]+)/i);
  if (scMatch) {
    skills.push({
      type: 'superclaude',
      command: scMatch[1],
      confidence: 0.95
    });
  }

  // Beceri anahtar kelimelerini kontrol et
  if (skillsRegistry) {
    skillsRegistry.skills.forEach(skill => {
      if (skill.enabled && content.toLowerCase().includes(skill.name.toLowerCase())) {
        skills.push({
          type: 'skill',
          name: skill.name,
          provider: skill.provider,
          model: skill.model,
          confidence: 0.8
        });
      }
    });
  }

  return skills.sort((a, b) => b.confidence - a.confidence);
}

// Beceri farkındalığı ile gelişmiş intent tespiti
function detectIntent(content) {
  const skills = detectSkills(content);
  const scores = {};

  // Intent'leri puanla
  for (const [intent, config] of Object.entries(INTENTS)) {
    scores[intent] = {
      score: config.patterns.reduce((score, pattern) => {
        const matches = (content.match(pattern) || []).length;
        return score + matches;
      }, 0),
      priority: config.priority || 0,
      config: config
    };
  }

  // Becerileri faktöre ekle
  if (skills.length > 0) {
    // Beceriler tespit edilirse AgentSkills intent'ini artır
    if (scores.AGENT_SKILLS) {
      scores.AGENT_SKILLS.score += skills.length * 2;
    }
  }

  // Önce skora, sonra önceliğe göre sırala
  const sorted = Object.entries(scores)
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => {
      // Birincil sıralama: skor
      if (b[1].score !== a[1].score) {
        return b[1].score - a[1].score;
      }
      // İkincil sıralama: öncelik
      return b[1].priority - a[1].priority;
    });

  return sorted.length > 0 ? sorted[0][0] : null;
}

// Ana yönlendirme fonksiyonu
module.exports = async function router(req, config) {
  const content = extractContent(req);
  const skills = detectSkills(content);
  const intent = detectIntent(content);

  // Hata ayıklama için tespiti logla
  if (skills.length > 0) {
    console.log(`[Router] Beceriler tespit edildi: ${skills.map(s => s.name || s.type).join(', ')}`);
  }

  if (intent && INTENTS[intent]) {
    const route = INTENTS[intent].route;
    console.log(`[Router] ${intent} → ${route}`);

    // Rotanın AgentSkills kullanıp kullanmadığını kontrol et
    if (route.includes('agentskills') && skills.length > 0) {
      // İsteği beceri bilgileriyle zenginleştir
      if (!req.body) req.body = {};
      if (!req.body.metadata) req.body.metadata = {};
      req.body.metadata.skills = skills;
      req.body.metadata.intent = intent;
    }

    return route;
  }

  // Fallback
  console.log("[Router] Eşleşme yok → openai,gpt-4o");
  return null;
};

// Test için yardımcı fonksiyonları dışa aktar
module.exports.detectSkills = detectSkills;
module.exports.detectIntent = detectIntent;
module.exports.INTENTS = INTENTS;
```

## Adım 3: Beceri Tanımlamaları Oluşturun

### 3.1 Business Panel Becerisi

`~/.claude-code-router/skills/business-panel/SKILL.md` dosyasını oluşturun:

```markdown
---
name: "business-panel"
description: "Uzman çerçevelerle iş analizi (Porter, Christensen, Drucker, Godin, Meadows)"
version: "1.0.0"
license: "MIT"
compatibility: ["claude-sonnet-4-latest"]
tags: ["iş", "strateji", "analiz", "uzman-panel"]
allowed_tools: ["web-search", "context7", "sequential-thinking"]
metadata:
  expertise_level: "expert"
  response_time: "slow"
  cost_level: "high"
  experts: ["porter", "christensen", "drucker", "godin", "meadows"]
---

# Business Panel Becerisi

## Genel Bakış
Bu beceri, kuruluş çerçevelerini ve metodolojilerini kullanarak kapsamlı iş analizi için sanal bir uzman paneli aktive eder.

## Uzman Yetenekleri

### Michael Porter - Rekabet Stratejisi
- **Beş Güç Analizi**: Sektör yapısı değerlendirmesi
- **Değer Zinciri Analizi**: İç yetenek değerlendirmesi
- **Genel Stratejiler**: Maliyet liderliği, farklılaşma, odaklanma
- **Rekabet Avantajı**: Sürdürülebilir konumlandırma

### Clayton Christensen - Yıkım Teorisi
- **Jobs-to-be-Done**: Müşteri ihtiyacı analizi
- **Yıkım Paternleri**: Sektör dönüşümü tanımlaması
- **İnovasyon Metrikleri**: Büyüme fırsatı değerlendirmesi
- **Pazar Giriş Stratejisi**: Yıkıcı konumlandırma

### Peter Drucker - Yönetim İlkeleri
- **Yönetimle Hedef belirleme**: Hedef uyumu
- **Bilgi İşçi Verimliliği**: Takım optimizasyonu
- **İnovasyon ve Girişimcilik**: Büyüme çerçeveleri
- **Etkili Yönetici**: Liderlik gelişimi

### Seth Godin - Pazarlama ve Farklılaşma
- **Purple Cow Teorisi**: Farklı ürün geliştirme
- **İzinli Pazarlama**: Müşteri ilişkisi kurma
- **Kabileler**: Topluluk oluşturma ve yönetme
- **Hikaye Anlatımı**: Marka anlatısı oluşturma

### Donella Meadows - Sistem Düşüncesi
- **Kaldıraç Noktaları**: Sistem müdahalesi tanımlaması
- **Geri Besleme Döngüleri**: Patern tanıma
- **Sistem Arketipleri**: Yaygın dinamikler anlayışı
- **Sürdürülebilirlik**: Uzun vadeli yapılabilirlik analizi

## Kullanım Paternleri

### Tetikleyici İfadeler
- "/sc:business-panel"
- "iş analizi"
- "stratejik planlama"
- "pazar araştırması"
- "rekabet analizi"
- "uzman panel"

### Analiz Türleri

1. **Kapsamlı Stratejik Analiz**
   - Girdi: İş planı, pazar verileri, rekabet ortamı
   - Süreç: Çoklu uzman çerçevesi uygulaması
   - Çıktı: Entegre stratejik öneriler

2. **Pazar Giriş Stratejisi**
   - Girdi: Hedef pazar, ürün/hizmet, kaynaklar
   - Süreç: Yıkım + rekabet analizi
   - Çıktı: Zamanlama ve konumlandırma ile pazar stratejisi

3. **Organizasyonel Tasarım**
   - Girdi: Mevcut yapı, hedefler, kısıtlamalar
   - Süreç: Sistem düşüncesi + yönetim ilkeleri
   - Çıktı: Optimize edilmiş organizasyonel tasarım

## Uygulama Notları

### En İyi Uygulamalar
- Karmaşık, çok yönlü iş zorlukları için kullanın
- Kapsamlı analiz için çoklu uzman perspektiflerini birleştirin
- Organizasyonel ve pazar sorunları için sistem düşüncesini uygulayın
- Teorik çerçeveler yerine eyleme geçirilebilir içgörülere odaklanın

### Sınırlamalar
- Anlamlı analiz için önemli bağlam gerektirir
- Optimal akıl yürütme için Claude Sonnet 4 ile en iyi sonucu verir
- Kapsamlı analiz nedeniyle daha yüksek token kullanımı
- Karmaşıklık nedeniyle yanıt süresi daha uzun olabilir
```

### 3.2 Code Review Becerisi

`~/.claude-code-router/skills/code-review/SKILL.md` dosyasını oluşturun:

```markdown
---
name: "code-review"
description: "Güvenlik, performans ve sürdürülebilirlik odaklı kapsamlı kod kalitesi analizi"
version: "1.0.0"
license: "MIT"
compatibility: ["claude-sonnet-4-latest", "claude-3-5-sonnet-latest"]
tags: ["kod", "inceleme", "kalite", "güvenlik", "performans"]
allowed_tools: ["context7", "sequential-thinking", "lsp"]
metadata:
  expertise_level: "senior-developer"
  response_time: "medium"
  cost_level: "medium"
  focus_areas: ["security", "performance", "maintainability", "patterns"]
---

# Code Review Becerisi

## Genel Bakış
Bu beceri, güvenlik açıkları, performans optimizasyon fırsatları, sürdürülebilirlik sorunları ve en iyi uygulamalara uyum konusunda kapsamlı kod analizi sağlar.

## İnceleme Boyutları

### Güvenlik Analizi
- **Güvenlik Ağı Tespiti**: SQL injection, XSS, CSRF, kimlik doğrulama kusurları
- **Veri Koruma**: Hassas veri işleme, şifreleme, erişim kontrolleri
- **Girdi Doğrulama**: Temizleme, sınır kontrolü, tip güvenliği
- **Bağımlılık Güvenliği**: Bilinen açıklar, lisans uyumu

### Performans Optimizasyonu
- **Algoritmik Verimlilik**: Zaman/alan karmaşıklığı analizi
- **Kaynak Kullanımı**: Bellek, CPU, G/Ç optimizasyonu
- **Önbellekleme Stratejileri**: Uygulama fırsatları
- **Veritabanı Optimizasyonu**: Sorgu verimliliği, indeksleme, bağlantı havuzu

### Kod Kalitesi ve Sürdürülebilirlik
- **Tasarım Paternleri**: Uygun patern kullanımı ve anti-paternler
- **Kod Organizasyonu**: Modülerlik, bağlılık, cohesion
- **Dokümantasyon**: Kod yorumları, API dokümantasyonu
- **Test Etme**: Test kapsamı, test kalitesi, kenar durumlar

### En İyi Uygulamalar
- **Dile Özel**: Dil başına idiyomatik kod kullanımı
- **Çerçeve Yönergeleri**: Çerçeveye özgü kurallar
- **Hata Yönetimi**: İstisna yönetimi, zararlı düşüş
- **Günlükleme**: Uygun günlük seviyeleri ve bilgiler

## Kullanım Paternleri

### Tetikleyici İfadeler
- "/sc:code-review"
- "kodumu incele"
- "kod kalitesi kontrolü"
- "güvenlik incelemesi"
- "performans analizi"
- "en iyi uygulamalar incelemesi"

### İnceleme Türleri

1. **Güvenlik Odaklı İnceleme**
   - Öncelik: Kritik güvenlik açıkları ilk
   - Kapsam: Kimlik doğrulama, yetkilendirme, veri koruma
   - Çıktı: Şiddet derecelendirmesi ve düzeltmeleri olan güvenlik sorunları

2. **Performans İncelemesi**
   - Öncelik: Darboğazlar ve optimizasyon fırsatları
   - Kapsam: Algoritmik verimlilik, kaynak kullanımı
   - Çıktı: Optimizasyon önerileri olan performans sorunları

3. **Kapsamlı İnceleme**
   - Eşit öncelikli tüm boyutlar
   - Bütünsel kod kalitesi değerlendirmesi
   - Detaylı iyileştirme yol haritası

## İnceleme Süreci

### Analiz Adımları
1. **Kod Yapısı Anlama**: Ayrıştırma ve mimari anlama
2. **Patern Tanıma**: Tasarım paternleri ve anti-pernler
3. **Sorun Tespiti**: Güvenlik, performans ve kalite sorunlarını bul
4. **Etki Değerlendirmesi**: Sorunların şiddetini ve önceliğini değerlendir
5. **Öneri Üretimi**: Eyleme geçirilebilir iyileştirme önerileri sağla

### Çıktı Formatı
```
## Kod İnceleme Özeti

### 🔴 Kritik Sorunlar
[Yüksek öncelikli güvenlik veya işlevsellik sorunları]

### 🟡 Önemli İyileştirmeler
[Performans optimizasyonları, güvenlik iyileştirmeleri]

### 🟢 Öneriler
[Kod kalitesi, sürdürülebilirlik iyileştirmeleri]

### 📊 Metrikler
- Güvenlik Skoru: X/10
- Performans Skoru: X/10
- Sürdürülebilirlik Skoru: X/10
```

## Uygulama Notları

### Desteklenen Diller
- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- C#
- Ruby

### Entegrasyon Noktaları
- GitHub/GitLab PR incelemeleri
- CI/CD pipeline entegrasyonu
- IDE eklentileri
- Kod kalitesi panelleri

### Kalite Metrikleri
- Analiz edilen kod satırları
- Kategori başına bulunan sorunlar
- Yanlış pozitif oranı
- İnceleme tamamlanma süresi

## Sınırlamalar
- İnsan kod incelemesini tamamen yerine geçemez
- İş mantığı sorunlarını kaçıran olabilir
- Bağlama bağlı hataları gözden kaçırabilir
- Doğru analiz için yeterli kod bağlamı gerektirir
```

## Adım 4: Ortam Değişkenlerini Güncelleyin

`~/.env` dosyanıza ekleyin:

```bash
# AgentSkills Yapılandırması
export AGENTSKILLS_ENABLED="true"
export AGENTSKILLS_REGISTRY_PATH="$HOME/.claude-code-router/skills"
export AGENTSKILLS_LOG_LEVEL="info"
export AGENTSKILLS_CACHE_TTL="3600"

# Beceriye Özel Yapılandırma
export AGENTSKILLS_BUSINESS_PANEL_ENABLED="true"
export AGENTSKILLS_CODE_REVIEW_ENABLED="true"
export AGENTSKILLS_MAX_SKILLS_PER_REQUEST="3"
```

Shell'inizi yeniden yükleyin:
```bash
source ~/.zshrc
```

## Adım 5: Entegrasyonu Test Edin

### 5.1 Beceri Tespitini Test Edin

```bash
# SuperClaude komut tespitini test et
echo "Beceri tespiti test ediliyor..."
node -e "
const router = require('$HOME/.claude-code-router/intent-router.js');
const mockReq = {
  body: {
    messages: [{ role: 'user', content: '/sc:business-panel rekabet konumumuzu analiz edin' }]
  }
};
router(mockReq, {}).then(route => console.log('Rota:', route));
"
```

### 5.2 Business Panel Becerisini Test Edin

```bash
# Router'ı başlat
ccr code

# Başka bir terminalde, curl ile test et
curl -X POST http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "/sc:business-panel Elektrikli araç startupları için rekabet ortamını analiz edin"}
    ],
    "model": "claude-sonnet-4-latest"
  }'
```

### 5.3 Code Review Becerisini Test Edin

```bash
# Kod inceleme işlevselliğini test et
curl -X POST http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "/sc:code-review Bu Python kodunu güvenlik açıklarından inceleyin:\n\n```python\ndef login(username, password):\n    query = \"SELECT * FROM users WHERE username = '\" + username + \"' AND password = '\" + password + \"'\"\n    return db.execute(query)\n```"}
    ],
    "model": "claude-sonnet-4-latest"
  }'
```

## Adım 6: İzleyin ve Optimize Edin

### 6.1 Günlüklemeyi Etkinleştirin

`~/.claude-code-router/config.json` dosyanıza ekleyin:

```json
{
  "LOG": true,
  "LOG_LEVEL": "debug",
  "AGENTSKILLS_LOG_REQUESTS": true,
  "AGENTSKILLS_LOG_ROUTING_DECISIONS": true
}
```

### 6.2 Performansı İzleyin

`~/.claude-code-router/monitor.js` dosyasında izleme script'i oluşturun:

```javascript
const fs = require('fs');

// Yönlendirme kararlarını günlükle
setInterval(() => {
  const logs = fs.readFileSync('/tmp/claude-router.log', 'utf8');
  const agentSkillsRequests = logs.match(/\[Router\].*agentskills/g) || [];

  console.log(`Son dakikada AgentSkills istekleri: ${agentSkillsRequests.length}`);

  // Beceri kullanımını ayrıştır
  const skillUsage = {};
  agentSkillsRequests.forEach(log => {
    const skillMatch = log.match(/Skill route: (\w+)/);
    if (skillMatch) {
      skillUsage[skillMatch[1]] = (skillUsage[skillMatch[1]] || 0) + 1;
    }
  });

  console.log('Beceri kullanımı:', skillUsage);
}, 60000);
```

## Sorun Giderme

### Yaygın Sorunlar

1. **Beceriler yüklenmiyor**
   ```bash
   # Skills dizinini kontrol et
   ls -la ~/.claude-code-router/skills/

   # Kayıt dosyasını doğrula
   cat ~/.claude-code-router/skills/registry.json
   ```

2. **Router AgentSkills kullanmıyor**
   ```bash
   # Intent router sözdizimini kontrol et
   node -c ~/.claude-code-router/intent-router.js

   # Yönlendirmeyi manuel olarak test et
   node -e "console.log(require('./intent-router.js').detectIntent('/sc:business-panel test'))"
   ```

3. **Skill dosyaları bulunamadı**
   ```bash
   # Beceri yapısını doğrula
   find ~/.claude-code-router/skills -name "SKILL.md"

   # Beceri dosya formatını kontrol et
   cat ~/.claude-code-router/skills/business-panel/SKILL.md | head -20
   ```

### Hata Ayıklama Modu

Hata ayıklama günlüklemesini etkinleştirin:

```bash
# Hata ayıklama ortamını ayarla
export AGENTSKILLS_DEBUG=true
export AGENTSKILLS_LOG_LEVEL=debug

# Router'ı ayrıntılı çıktıyla yeniden başlat
ccr code --verbose
```

## Sonraki Adımlar

1. **Özel Beceriler Ekleyin**: Kullanım durumlarınız için domaine özel beceriler oluşturun
2. **CI/CD ile Entegre Edin**: Pipeline'ınıza otomatik kod incelemeleri ekleyin
3. **Beceri Market Place'i Oluşturun**: Becerileri ekibinizle paylaşın
4. **Kullanımı İzleyin**: Hangi becerilerin en çok değer sağladığını takip edin
5. **Performansı Optimize Edin**: Kullanım paternlerine göre yönlendirmeyi ince ayar yapın

## Destek

- **Ana Depo**: https://github.com/halilertekin/CC-RouterMultiProvider
- **AgentSkills**: https://github.com/agentskills/agentskills
- **Sorunlar**: GitHub issue'ları üzerinden bildirin
- **Dokümantasyon**: Daha fazla rehber için `/docs` dizinine bakın

## Atıf

Bu kurulum rehberi [claude-code-router-config](https://github.com/halilertekin/CC-RouterMultiProvider) projesi içindir.
Orijinal proje: https://github.com/musistudio/claude-code-router
AgentSkills: https://github.com/agentskills/agentskills
Rehber: Halil Ertekin