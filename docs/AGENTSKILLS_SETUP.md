# AgentSkills Setup Guide

## Quick Start

This guide provides step-by-step instructions for integrating AgentSkills into your Claude Code Router configuration.

## Prerequisites

- Working Claude Code Router installation (see Homebrew setup)
- Anthropic API key with Claude Sonnet 4 access
- Node.js 16+ and pnpm installed
- Basic understanding of JSON and JavaScript configuration

## Step 1: Update Configuration Files

### 1.1 Update config.json

Add AgentSkills as a new provider:

```bash
# Backup current config
cp ~/.claude-code-router/config.json ~/.claude-code-router/config.json.backup
```

Edit `~/.claude-code-router/config.json` and add the AgentSkills provider:

```json
{
  "_comment": "Claude Code Router Configuration with AgentSkills Integration",
  "_author": "Configuration by Halil Ertekin",
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 300000,
  "CUSTOM_ROUTER_PATH": "$HOME/.claude-code-router/smart-intent-router.js",

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
    // ... other providers
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

### 1.2 Create Skills Directory

```bash
# Create skills directory
mkdir -p ~/.claude-code-router/skills

# Create skill registry file
cat > ~/.claude-code-router/skills/registry.json << 'EOF'
{
  "version": "1.0.0",
  "skills": [
    {
      "name": "business-panel",
      "description": "Business analysis with expert frameworks",
      "provider": "agentskills",
      "model": "claude-sonnet-4-latest",
      "enabled": true,
      "priority": "highest"
    },
    {
      "name": "code-review",
      "description": "Comprehensive code quality analysis",
      "provider": "agentskills",
      "model": "claude-sonnet-4-latest",
      "enabled": true,
      "priority": "high"
    }
  ]
}
EOF
```

## Step 2: Update Intent Router

### 2.1 Create Enhanced Intent Router

```bash
# Backup current router
cp ~/.claude-code-router/smart-intent-router.js ~/.claude-code-router/smart-intent-router.js.backup
```

Create a new enhanced intent router at `~/.claude-code-router/smart-intent-router.js`:

```javascript
/**
 * Multi-Provider Intent Router with AgentSkills Integration
 * Routes requests based on task type and skill requirements to optimal provider
 *
 *
 * Enhanced with AgentSkills support by Halil Ertekin
 */

const fs = require('fs');
const path = require('path');

// Load skills registry
let skillsRegistry = null;
try {
  const registryPath = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-code-router/skills/registry.json');
  skillsRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
} catch (error) {
  console.log('[Router] Skills registry not found, using standard routing');
}

const INTENTS = {
  // AgentSkills routing - highest priority
  AGENT_SKILLS: {
    patterns: [
      /\b\/sc:[\w-]+\b/i,  // All SuperClaude commands
      /\b(skill:|capability:|expertise:)\w+/i,
      /\b(agent|assistant) with \w+ skill/i
    ],
    route: "agentskills,claude-sonnet-4-latest",
    priority: 100
  },

  // Business Panel - specialized expert analysis
  BUSINESS_PANEL: {
    patterns: [
      /\b\/sc:business-panel\b/i,
      /\b(business analysis|strategic planning|market research)\b/i,
      /\b(porter|christensen|drucker|godin|meadows)\b/i
    ],
    route: "agentskills,business-panel",
    priority: 90,
    fallback: "anthropic,claude-sonnet-4-latest"
  },

  // Code Review - specialized analysis
  CODE_REVIEW: {
    patterns: [
      /\b\/sc:code-review\b/i,
      /\b(review code|code quality|best practices)\b/i,
      /\b(pr review|pull request|code analysis)\b/i
    ],
    route: "agentskills,code-review",
    priority: 85,
    fallback: "openai,gpt-4o"
  },

  // Original intents with adjusted priorities
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

  // ... other existing intents
};

// Helper function to extract content
function extractContent(req) {
  const messages = req.body?.messages || [];
  return messages
    .filter(m => m.role === "user" || m.role === "system")
    .map(m => typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    .join(" ")
    .slice(0, 3000);
}

// Enhanced skill detection
function detectSkills(content) {
  const skills = [];

  // Check for SuperClaude commands
  const scMatch = content.match(/\/sc:([\w-]+)/i);
  if (scMatch) {
    skills.push({
      type: 'superclaude',
      command: scMatch[1],
      confidence: 0.95
    });
  }

  // Check for skill keywords
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

// Enhanced intent detection with skill awareness
function detectIntent(content) {
  const skills = detectSkills(content);
  const scores = {};

  // Score intents
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

  // Factor in skills
  if (skills.length > 0) {
    // Boost AgentSkills intent if skills detected
    if (scores.AGENT_SKILLS) {
      scores.AGENT_SKILLS.score += skills.length * 2;
    }
  }

  // Sort by score, then priority
  const sorted = Object.entries(scores)
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => {
      // Primary sort: score
      if (b[1].score !== a[1].score) {
        return b[1].score - a[1].score;
      }
      // Secondary sort: priority
      return b[1].priority - a[1].priority;
    });

  return sorted.length > 0 ? sorted[0][0] : null;
}

// Main routing function
module.exports = async function router(req, config) {
  const content = extractContent(req);
  const skills = detectSkills(content);
  const intent = detectIntent(content);

  // Log detection for debugging
  if (skills.length > 0) {
    console.log(`[Router] Skills detected: ${skills.map(s => s.name || s.type).join(', ')}`);
  }

  if (intent && INTENTS[intent]) {
    const route = INTENTS[intent].route;
    console.log(`[Router] ${intent} → ${route}`);

    // Check if route uses AgentSkills
    if (route.includes('agentskills') && skills.length > 0) {
      // Enhance request with skill information
      if (!req.body) req.body = {};
      if (!req.body.metadata) req.body.metadata = {};
      req.body.metadata.skills = skills;
      req.body.metadata.intent = intent;
    }

    return route;
  }

  // Fallback
  console.log("[Router] No match → openai,gpt-4o");
  return null;
};

// Export helper functions for testing
module.exports.detectSkills = detectSkills;
module.exports.detectIntent = detectIntent;
module.exports.INTENTS = INTENTS;
```

## Step 3: Create Skill Definitions

### 3.1 Business Panel Skill

Create `~/.claude-code-router/skills/business-panel/SKILL.md`:

```markdown
---
name: "business-panel"
description: "Business analysis with expert frameworks (Porter, Christensen, Drucker, Godin, Meadows)"
version: "1.0.0"
license: "MIT"
compatibility: ["claude-sonnet-4-latest"]
tags: ["business", "strategy", "analysis", "expert-panel"]
allowed_tools: ["web-search", "context7", "sequential-thinking"]
metadata:
  expertise_level: "expert"
  response_time: "slow"
  cost_level: "high"
  experts: ["porter", "christensen", "drucker", "godin", "meadows"]
---

# Business Panel Skill

## Overview
This skill activates a virtual expert panel for comprehensive business analysis using established frameworks and methodologies.

## Expert Capabilities

### Michael Porter - Competitive Strategy
- **Five Forces Analysis**: Industry structure assessment
- **Value Chain Analysis**: Internal capability evaluation
- **Generic Strategies**: Cost leadership, differentiation, focus
- **Competitive Advantage**: Sustainable positioning

### Clayton Christensen - Disruption Theory
- **Jobs-to-be-Done**: Customer need analysis
- **Disruption Patterns**: Industry transformation identification
- **Innovation Metrics**: Growth opportunity assessment
- **Market Entry Strategy**: Disruptive positioning

### Peter Drucker - Management Principles
- **Management by Objectives**: Goal alignment
- **Knowledge Worker Productivity**: Team optimization
- **Innovation and Entrepreneurship**: Growth frameworks
- **Effective Executive**: Leadership development

### Seth Godin - Marketing & Remarkability
- **Purple Cow Theory**: Remarkable product development
- **Permission Marketing**: Customer relationship building
- **Tribes**: Community creation and management
- **Storytelling**: Brand narrative crafting

### Donella Meadows - Systems Thinking
- **Leverage Points**: System intervention identification
- **Feedback Loops**: Pattern recognition
- **System Archetypes**: Common dynamics understanding
- **Sustainability**: Long-term viability analysis

## Usage Patterns

### Trigger Phrases
- "/sc:business-panel"
- "business analysis"
- "strategic planning"
- "market research"
- "competitive analysis"
- "expert panel"

### Analysis Types

1. **Comprehensive Strategic Analysis**
   - Input: Business plan, market data, competitive landscape
   - Process: Multi-expert framework application
   - Output: Integrated strategic recommendations

2. **Market Entry Strategy**
   - Input: Target market, product/service, resources
   - Process: Disruption + competitive analysis
   - Output: Go-to-market strategy with timing and positioning

3. **Organizational Design**
   - Input: Current structure, goals, constraints
   - Process: Systems thinking + management principles
   - Output: Optimized organizational design

## Implementation Notes

### Best Practices
- Use for complex, multi-faceted business challenges
- Combine multiple expert perspectives for comprehensive analysis
- Apply systems thinking for organizational and market problems
- Focus on actionable insights rather than theoretical frameworks

### Limitations
- Requires substantial context for meaningful analysis
- Best with Claude Sonnet 4 for optimal reasoning
- Higher token usage due to comprehensive analysis
- Response time may be longer due to complexity

## Quality Indicators
- Clear framework identification and application
- Integration of multiple expert perspectives
- Actionable, specific recommendations
- Recognition of system interdependencies
- Balanced consideration of short-term and long-term factors
```

### 3.2 Code Review Skill

Create `~/.claude-code-router/skills/code-review/SKILL.md`:

```markdown
---
name: "code-review"
description: "Comprehensive code quality analysis with security, performance, and maintainability focus"
version: "1.0.0"
license: "MIT"
compatibility: ["claude-sonnet-4-latest", "claude-3-5-sonnet-latest"]
tags: ["code", "review", "quality", "security", "performance"]
allowed_tools: ["context7", "sequential-thinking", "lsp"]
metadata:
  expertise_level: "senior-developer"
  response_time: "medium"
  cost_level: "medium"
  focus_areas: ["security", "performance", "maintainability", "patterns"]
---

# Code Review Skill

## Overview
This skill provides comprehensive code analysis covering security vulnerabilities, performance optimization opportunities, maintainability issues, and adherence to best practices.

## Review Dimensions

### Security Analysis
- **Vulnerability Detection**: SQL injection, XSS, CSRF, authentication flaws
- **Data Protection**: Sensitive data handling, encryption, access controls
- **Input Validation**: Sanitization, bounds checking, type safety
- **Dependency Security**: Known vulnerabilities, license compliance

### Performance Optimization
- **Algorithm Efficiency**: Time/space complexity analysis
- **Resource Usage**: Memory, CPU, I/O optimization
- **Caching Strategies**: Implementation opportunities
- **Database Optimization**: Query efficiency, indexing, connection pooling

### Code Quality & Maintainability
- **Design Patterns**: Appropriate pattern usage and anti-patterns
- **Code Organization**: Modularity, coupling, cohesion
- **Documentation**: Code comments, API documentation
- **Testing**: Test coverage, test quality, edge cases

### Best Practices
- **Language-Specific**: Idiomatic code usage per language
- **Framework Guidelines**: Framework-specific conventions
- **Error Handling**: Exception management, graceful degradation
- **Logging**: Appropriate logging levels and information

## Usage Patterns

### Trigger Phrases
- "/sc:code-review"
- "review my code"
- "code quality check"
- "security review"
- "performance analysis"
- "best practices review"

### Review Types

1. **Security-Focused Review**
   - Priority: Critical vulnerabilities first
   - Scope: Authentication, authorization, data protection
   - Output: Security issues with severity ratings and fixes

2. **Performance Review**
   - Priority: Bottlenecks and optimization opportunities
   - Scope: Algorithm efficiency, resource usage
   - Output: Performance issues with optimization suggestions

3. **Comprehensive Review**
   - All dimensions with equal priority
   - Holistic code quality assessment
   - Detailed improvement roadmap

## Review Process

### Analysis Steps
1. **Code Structure Understanding**: Parse and understand architecture
2. **Pattern Recognition**: Identify design patterns and anti-patterns
3. **Issue Detection**: Find security, performance, and quality issues
4. **Impact Assessment**: Rate severity and priority of issues
5. **Recommendation Generation**: Provide actionable improvement suggestions

### Output Format
```
## Code Review Summary

### 🔴 Critical Issues
[High-priority security or functionality issues]

### 🟡 Important Improvements
[Performance optimizations, security enhancements]

### 🟢 Suggestions
[Code quality, maintainability improvements]

### 📊 Metrics
- Security Score: X/10
- Performance Score: X/10
- Maintainability Score: X/10
```

## Implementation Notes

### Supported Languages
- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- C#
- Ruby

### Integration Points
- GitHub/GitLab PR reviews
- CI/CD pipeline integration
- IDE plugins
- Code quality dashboards

### Quality Metrics
- Lines of code analyzed
- Issues found by category
- False positive rate
- Review completion time

## Limitations
- Cannot replace human code review entirely
- May miss business logic issues
- Context-dependent bugs may be overlooked
- Requires sufficient code context for accurate analysis
```

## Step 4: Update Environment Variables

Add to your `~/.env` file:

```bash
# AgentSkills Configuration
export AGENTSKILLS_ENABLED="true"
export AGENTSKILLS_REGISTRY_PATH="$HOME/.claude-code-router/skills"
export AGENTSKILLS_LOG_LEVEL="info"
export AGENTSKILLS_CACHE_TTL="3600"

# Skill-Specific Configuration
export AGENTSKILLS_BUSINESS_PANEL_ENABLED="true"
export AGENTSKILLS_CODE_REVIEW_ENABLED="true"
export AGENTSKILLS_MAX_SKILLS_PER_REQUEST="3"
```

Reload your shell:
```bash
source ~/.zshrc
```

## Step 5: Test the Integration

### 5.1 Test Skill Detection

```bash
# Test SuperClaude command detection
echo "Testing skill detection..."
node -e "
const router = require('$HOME/.claude-code-router/smart-intent-router.js');
const mockReq = {
  body: {
    messages: [{ role: 'user', content: '/sc:business-panel analyze our competitive position' }]
  }
};
router(mockReq, {}).then(route => console.log('Route:', route));
"
```

### 5.2 Test Business Panel Skill

```bash
# Start the router
ccr code

# In another terminal, test with curl
curl -X POST http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "/sc:business-panel Analyze the competitive landscape for electric vehicle startups"}
    ],
    "model": "claude-sonnet-4-latest"
  }'
```

### 5.3 Test Code Review Skill

```bash
# Test code review functionality
curl -X POST http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "/sc:code-review Review this Python code for security issues:\n\n```python\ndef login(username, password):\n    query = \"SELECT * FROM users WHERE username = '\" + username + \"' AND password = '\" + password + \"'\"\n    return db.execute(query)\n```"}
    ],
    "model": "claude-sonnet-4-latest"
  }'
```

## Step 6: Monitor and Optimize

### 6.1 Enable Logging

Add to your `~/.claude-code-router/config.json`:

```json
{
  "LOG": true,
  "LOG_LEVEL": "debug",
  "AGENTSKILLS_LOG_REQUESTS": true,
  "AGENTSKILLS_LOG_ROUTING_DECISIONS": true
}
```

### 6.2 Monitor Performance

Create a monitoring script at `~/.claude-code-router/monitor.js`:

```javascript
const fs = require('fs');

// Log routing decisions
setInterval(() => {
  const logs = fs.readFileSync('/tmp/claude-router.log', 'utf8');
  const agentSkillsRequests = logs.match(/\[Router\].*agentskills/g) || [];

  console.log(`AgentSkills requests in last minute: ${agentSkillsRequests.length}`);

  // Parse skill usage
  const skillUsage = {};
  agentSkillsRequests.forEach(log => {
    const skillMatch = log.match(/Skill route: (\w+)/);
    if (skillMatch) {
      skillUsage[skillMatch[1]] = (skillUsage[skillMatch[1]] || 0) + 1;
    }
  });

  console.log('Skill usage:', skillUsage);
}, 60000);
```

## Troubleshooting

### Common Issues

1. **Skills not loading**
   ```bash
   # Check skills directory
   ls -la ~/.claude-code-router/skills/

   # Verify registry file
   cat ~/.claude-code-router/skills/registry.json
   ```

2. **Router not using AgentSkills**
   ```bash
   # Check intent router syntax
   node -c ~/.claude-code-router/smart-intent-router.js

   # Test routing manually
   node -e "console.log(require('./smart-intent-router.js').detectIntent('/sc:business-panel test'))"
   ```

3. **Skill files not found**
   ```bash
   # Verify skill structure
   find ~/.claude-code-router/skills -name "SKILL.md"

   # Check skill file format
   cat ~/.claude-code-router/skills/business-panel/SKILL.md | head -20
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export AGENTSKILLS_DEBUG=true
export AGENTSKILLS_LOG_LEVEL=debug

# Restart router with verbose output
ccr code --verbose
```

## Next Steps

1. **Add Custom Skills**: Create domain-specific skills for your use cases
2. **Integrate with CI/CD**: Add automated code reviews to your pipeline
3. **Build Skill Marketplace**: Share skills with your team
4. **Monitor Usage**: Track which skills provide most value
5. **Optimize Performance**: Fine-tune routing based on usage patterns

## Support

- **Main Repository**: https://github.com/halilertekin/CC-RouterMultiProvider
- **AgentSkills**: https://github.com/agentskills/agentskills
- **Issues**: Report via GitHub issues
- **Documentation**: See `/docs` directory for more guides

## Attribution

This setup guide is for the [claude-code-router-config](https://github.com/halilertekin/CC-RouterMultiProvider) project.
AgentSkills: https://github.com/agentskills/agentskills
Guide by Halil Ertekin
