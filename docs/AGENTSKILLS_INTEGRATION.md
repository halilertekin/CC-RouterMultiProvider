# AgentSkills Integration Guide

## Overview

[AgentSkills](https://github.com/agentskills/agentskills) is an open format for giving AI agents new capabilities and expertise. This document outlines how to integrate AgentSkills into the Claude Code Router configuration to create an intelligent, skill-aware routing system.

## What is AgentSkills?

AgentSkills provides:
- **Standardized skill format**: YAML frontmatter + markdown for skill definition
- **Dynamic skill loading**: Discover and load skills at runtime
- **Skill distribution**: Share specialized capabilities across different agents
- **Interoperability**: Works with multiple AI providers and systems

## Integration Architecture

### Current vs Enhanced Routing

**Current System:**
```
User Request → Intent Detection → Provider Selection → API Call
```

**Enhanced with AgentSkills:**
```
User Request → Intent/Skill Detection → Skill-Provider Matching → Enhanced API Call
```

### Key Components

1. **Skill Registry**: Database of available skills and their provider compatibility
2. **Skill Detection**: Analyze requests for skill requirements
3. **Provider-Skill Mapping**: Match skills to optimal providers
4. **Hybrid Routing**: Combine intent-based and skill-based routing

## Implementation Strategy

### Phase 1: Foundation Setup

1. **Add AgentSkills Provider Configuration**
   - Extend `config.json` with AgentSkills provider
   - Define skill compatibility matrix
   - Set up skill-specific endpoints

2. **Create Skill Registry**
   - Initialize skill metadata storage
   - Define skill categories and types
   - Create skill-provider mapping database

### Phase 2: Skill Detection

1. **Request Analysis**
   - Extract skill requirements from user input
   - Identify SuperClaude commands and their skill needs
   - Parse skill-specific keywords and patterns

2. **Skill Matching Algorithm**
   - Score providers based on skill compatibility
   - Consider provider strengths and specializations
   - Handle skill combinations and conflicts

### Phase 3: Enhanced Routing

1. **Hybrid Decision Engine**
   - Combine intent-based routing with skill matching
   - Priority system for specialized skills
   - Fallback to standard routing when skills unavailable

2. **Dynamic Skill Loading**
   - Load skills on-demand from registry
   - Cache frequently used skills
   - Update skill definitions periodically

## Configuration Examples

### Provider Configuration with AgentSkills

```json
{
  "name": "agentskills",
  "api_base_url": "https://api.anthropic.com/v1/messages",
  "api_key": "$ANTHROPIC_API_KEY",
  "models": ["claude-sonnet-4-latest"],
  "transformer": { "use": ["Anthropic"] },
  "skills": [
    {
      "name": "business-analysis",
      "description": "Strategic business analysis and planning",
      "compatibility": ["claude-sonnet-4-latest"],
      "priority": "high",
      "patterns": [
        "/sc:business-panel",
        "strategic analysis",
        "market research",
        "competitive analysis"
      ],
      "experts": ["porter", "christensen", "drucker", "meadows"]
    },
    {
      "name": "code-review",
      "description": "Comprehensive code quality analysis",
      "compatibility": ["claude-sonnet-4-latest", "claude-3-5-sonnet-latest"],
      "priority": "medium",
      "patterns": [
        "/sc:code-review",
        "review code",
        "code quality",
        "best practices"
      ],
      "focus": ["security", "performance", "maintainability", "patterns"]
    },
    {
      "name": "system-architecture",
      "description": "System design and architecture planning",
      "compatibility": ["claude-sonnet-4-latest"],
      "priority": "high",
      "patterns": [
        "architecture",
        "system design",
        "scalability",
        "microservices"
      ],
      "considerations": ["scalability", "maintainability", "security", "performance"]
    }
  ]
}
```

### Enhanced Intent Router

```javascript
/**
 * Enhanced Intent Router with AgentSkills Integration
 */

const INTENTS = {
  // Existing intents...
  CODING: { /* ... */ },
  REASONING: { /* ... */ },

  // AgentSkills-specific intents
  AGENT_SKILLS: {
    patterns: [
      /\b\/sc:[\w-]+\b/i,  // SuperClaude commands
      /\b(skill:|capability:|expertise:)\w+/i,
      /\b(agent|assistant) with \w+ skill/i
    ],
    route: "agentskills,claude-sonnet-4-latest",
    priority: "high",
    fallback: "anthropic,claude-sonnet-4-latest"
  },

  BUSINESS_PANEL: {
    patterns: [
      /\b\/sc:business-panel\b/i,
      /\b(business analysis|strategic planning|market research)\b/i,
      /\b(porter|christensen|drucker|godin|meadows)\b/i
    ],
    route: "agentskills,business-analysis",
    priority: "highest",
    fallback: "anthropic,claude-sonnet-4-latest"
  },

  CODE_REVIEW: {
    patterns: [
      /\b\/sc:code-review\b/i,
      /\b(review code|code quality|best practices)\b/i,
      /\b(refactor|optimize|improve) code/i
    ],
    route: "agentskills,code-review",
    priority: "high",
    fallback: "openai,gpt-4o"
  }
};

// Skill-based routing function
function routeWithSkills(req, config) {
  const content = extractContent(req);
  const detectedSkills = detectRequiredSkills(content);
  const intent = detectIntent(content);

  // Priority 1: Direct skill matches
  if (detectedSkills.length > 0) {
    const bestSkill = selectBestSkill(detectedSkills, config.skills);
    if (bestSkill) {
      console.log(`[Router] Skill route: ${bestSkill.name} → ${bestSkill.route}`);
      return bestSkill.route;
    }
  }

  // Priority 2: Intent-based routing
  if (intent && INTENTS[intent]) {
    const route = INTENTS[intent].route;
    console.log(`[Router] Intent route: ${intent} → ${route}`);
    return route;
  }

  // Priority 3: Default fallback
  console.log("[Router] Fallback → openai,gpt-4o");
  return null;
}

// Skill detection algorithm
function detectRequiredSkills(content) {
  const skills = [];

  // Check for SuperClaude commands
  const scMatch = content.match(/\/sc:([\w-]+)/i);
  if (scMatch) {
    skills.push({
      type: 'superclaude',
      command: scMatch[1],
      confidence: 0.9
    });
  }

  // Check for domain-specific keywords
  const domainPatterns = {
    'business': /\b(business|strategy|market|competitive|analysis)\b/i,
    'security': /\b(security|vulnerability|exploit|penetration)\b/i,
    'performance': /\b(performance|optimization|speed|latency)\b/i,
    'architecture': /\b(architecture|design|system|scalability)\b/i
  };

  for (const [domain, pattern] of Object.entries(domainPatterns)) {
    if (pattern.test(content)) {
      skills.push({
        type: 'domain',
        domain: domain,
        confidence: 0.7
      });
    }
  }

  return skills.sort((a, b) => b.confidence - a.confidence);
}
```

### Environment Configuration

```bash
# AgentSkills Configuration
export AGENTSKILLS_API_KEY="your_anthropic_api_key"
export AGENTSKILLS_BASE_URL="https://api.anthropic.com/v1/messages"
export AGENTSKILLS_MODEL="claude-sonnet-4-latest"

# Skill Registry Configuration
export AGENTSKILLS_REGISTRY_PATH="$HOME/.claude-code-router/skills"
export AGENTSKILLS_REGISTRY_URL="https://registry.anthropic.com/skills"
export AGENTSKILLS_CACHE_TTL="3600"
export AGENTSKILLS_UPDATE_INTERVAL="86400"

# Skill Routing Configuration
export AGENTSKILLS_ROUTING_ENABLED="true"
export AGENTSKILLS_FALLBACK_ENABLED="true"
export AGENTSKILLS_LOG_LEVEL="info"
export AGENTSKILLS_METRICS_ENABLED="true"
```

## Skill Definition Format

### Skill Structure

```
skill-name/
├── SKILL.md              # Required: Skill definition
├── scripts/              # Optional: Helper scripts
│   ├── validate.js       # Validation logic
│   └── transform.js      # Data transformation
├── references/           # Optional: Reference materials
│   ├── guide.md          # Usage guide
│   └── examples.md       # Examples
└── assets/              # Optional: Images, diagrams
    └── workflow.png      # Visual workflow
```

### Skill Definition Example

```markdown
---
name: "business-analysis"
description: "Strategic business analysis and competitive intelligence"
version: "1.0.0"
license: "MIT"
compatibility: ["claude-sonnet-4-latest"]
tags: ["business", "strategy", "analysis"]
allowed_tools: ["web-search", "context7", "sequential-thinking"]
metadata:
  expertise_level: "expert"
  response_time: "slow"
  cost_level: "high"
---

# Business Analysis Skill

## Overview
This skill provides comprehensive business analysis capabilities including:
- Competitive analysis using Porter's Five Forces
- Disruption analysis using Christensen's framework
- Systems thinking using Meadows' approach
- Strategic planning and market research

## Usage Patterns

### Trigger Phrases
- "business analysis"
- "competitive strategy"
- "market research"
- "strategic planning"
- "/sc:business-panel"

### Expert Frameworks
- **Porter**: Industry analysis, competitive positioning
- **Christensen**: Disruption analysis, jobs-to-be-done
- **Drucker**: Management principles, organizational effectiveness
- **Meadows**: Systems thinking, leverage points
- **Godin**: Marketing, remarkable products

## Configuration
```json
{
  "experts": ["porter", "christensen", "drucker", "meadows", "godin"],
  "analysis_depth": "comprehensive",
  "time_horizon": "strategic",
  "focus_areas": ["competition", "innovation", "systems"]
}
```

## Implementation Notes
- Requires strong analytical capabilities
- Benefits from large context windows
- Works best with Claude Sonnet 4 or higher
```

## Integration Benefits

### Enhanced Capabilities

1. **Specialized Expertise**
   - Domain-specific knowledge routing
   - Expert framework integration
   - Specialized tool usage

2. **Improved Accuracy**
   - Right model for right task
   - Reduced hallucinations in specialized domains
   - Context-aware responses

3. **Better User Experience**
   - Transparent skill usage
   - Consistent expert voices
   - Predictable response quality

### Operational Benefits

1. **Performance Optimization**
   - Efficient resource utilization
   - Reduced unnecessary API calls
   - Optimized routing decisions

2. **Cost Management**
   - Route to cost-effective providers
   - Avoid over-provisioning for simple tasks
   - Track skill-specific costs

3. **Scalability**
   - Add new skills without code changes
   - Community skill contributions
   - Dynamic skill loading

## Migration Guide

### From Current Setup

1. **Backup Configuration**
   ```bash
   cp ~/.claude-code-router/config.json ~/.claude-code-router/config.json.backup
   cp ~/.claude-code-router/intent-router.js ~/.claude-code-router/intent-router.js.backup
   ```

2. **Add AgentSkills Provider**
   - Extend `config.json` with AgentSkills configuration
   - Add skill compatibility matrix
   - Update provider priorities

3. **Update Intent Router**
   - Add skill detection logic
   - Implement hybrid routing
   - Add fallback mechanisms

4. **Test Integration**
   - Verify skill detection works
   - Test routing decisions
   - Monitor performance

### Testing Procedure

1. **Unit Tests**
   ```bash
   # Test skill detection
   node -e "
   const { detectRequiredSkills } = require('./intent-router.js');
   console.log(detectRequiredSkills('/sc:business-panel analyze market'));
   "
   ```

2. **Integration Tests**
   ```bash
   # Test full routing
   ccr test --request "analyze competitive landscape"
   ```

3. **Performance Tests**
   ```bash
   # Benchmark routing decisions
   time ccr test --request "business strategy analysis"
   ```

## Monitoring and Analytics

### Metrics to Track

1. **Skill Usage**
   - Most requested skills
   - Skill success rates
   - User satisfaction scores

2. **Routing Performance**
   - Decision latency
   - Routing accuracy
   - Fallback frequency

3. **Cost Analysis**
   - Skill-specific costs
   - Provider utilization
   - ROI by skill type

### Logging Configuration

```javascript
// Enable detailed logging
const LOG_CONFIG = {
  skill_detection: true,
  routing_decisions: true,
  performance_metrics: true,
  error_tracking: true
};
```

## Future Enhancements

### Planned Features

1. **Skill Marketplace**
   - Community skill sharing
   - Skill rating system
   - Automated skill discovery

2. **Advanced Routing**
   - Machine learning-based routing
   - User preference learning
   - Context-aware routing

3. **Performance Optimization**
   - Skill pre-loading
   - Intelligent caching
   - Parallel processing

### Roadmap

- **Q1 2025**: Basic skill detection and routing
- **Q2 2025**: Advanced skill registry and marketplace
- **Q3 2025**: ML-based routing optimization
- **Q4 2025**: Full skill ecosystem integration

## Security Considerations

### Skill Validation

1. **Code Review**
   - Validate all skill code
   - Check for malicious patterns
   - Verify API usage

2. **Sandboxing**
   - Isolate skill execution
   - Limit system access
   - Monitor resource usage

3. **Access Control**
   - User permissions for skills
   - Skill usage quotas
   - Audit logging

## Attribution

This integration guide is for the [claude-code-router-config](https://github.com/halilertekin/CC-RouterMultiProvider) project.
Original project: https://github.com/musistudio/claude-code-router
AgentSkills: https://github.com/agentskills/agentskills
Configuration by Halil Ertekin