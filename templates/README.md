# Configuration Templates

This directory contains pre-configured templates optimized for different use cases. Each template provides a complete configuration with optimized provider selection, routing rules, and settings.

## Available Templates

### 1. 🚀 `performance-optimized.json`
**Best for**: Real-time applications, chatbots, time-sensitive tasks
- **Priority**: Speed and low latency
- **Expected Latency**: 500-2000ms
- **Cost Profile**: Low to Medium
- **Primary Provider**: Gemini Flash (fastest)
- **Fallback**: OpenAI Mini, Qwen Turbo

### 2. 💰 `cost-optimized.json`
**Best for**: Budget-conscious users, bulk processing, non-critical tasks
- **Priority**: Maximum cost savings
- **Expected Savings**: 70-90% vs premium models
- **Cost Profile**: Very Low
- **Primary Provider**: Qwen Turbo (cheapest)
- **Features**: Budget tracking and alerts

### 3. 🎯 `quality-focused.json`
**Best for**: Critical applications, complex reasoning, professional work
- **Priority**: Highest quality and accuracy
- **Expected Latency**: 3-10 seconds
- **Cost Profile**: High
- **Primary Provider**: Claude Sonnet 4 (best reasoning)
- **Features**: Enhanced reasoning, chain-of-thought

### 4. 💻 `development.json`
**Best for**: Developers, coding assistance, software engineering
- **Priority**: Code generation and debugging
- **Specialized**: Coding models and frameworks
- **Cost Profile**: Medium
- **Primary Provider**: OpenAI GPT-4o Mini (best for coding)
- **Features**: Code context awareness, project intelligence

### 5. ⚖️ `balanced.json` **(Default)**
**Best for**: General use, mixed workloads, everyday tasks
- **Priority**: Balanced cost-performance-quality
- **Expected Latency**: 2-4 seconds
- **Cost Profile**: Medium
- **Primary Provider**: OpenAI GPT-4o (versatile)
- **Features**: Adaptive routing, auto-optimization

## Usage

### Apply a Template:
```bash
# Using CLI (recommended)
ccr config template performance-optimized
ccr config template cost-optimized
ccr config template quality-focused
ccr config template development
ccr config template balanced

# Manual copy
cp templates/performance-optimized.json ~/.claude-code-router/config.json
```

### Compare Templates:
```bash
# See quick comparison
ccr config compare --all

# Compare specific templates
ccr config compare performance-optimized cost-optimized
```

## Template Features

### Performance Optimization
- Request timeout settings
- Retry policies
- Connection pooling
- Caching strategies

### Cost Management
- Budget limits and alerts
- Cost tracking
- Provider cost analysis
- Usage optimization

### Quality Enhancement
- Temperature settings
- Model-specific parameters
- Prompt optimization
- Response validation

### Development Tools
- Code context awareness
- Language-specific optimization
- Debug mode
- Testing configurations

## Customization

Templates can be customized by:
1. Copying a template as a base
2. Modifying providers and models
3. Adjusting routing rules
4. Fine-tuning parameters
5. Adding custom features

Example customization:
```json
{
  "customSetting": {
    "myPreference": true,
    "specificModel": "claude-sonnet-4-latest"
  }
}
```

## Switching Templates

To switch between templates:
```bash
# Backup current config
ccr config backup

# Apply new template
ccr config template quality-focused

# Verify configuration
ccr config validate

# Test providers
ccr benchmark full
```

## Recommendations

| Use Case | Recommended Template |
|----------|---------------------|
| **Chat Applications** | performance-optimized |
| **Data Processing** | cost-optimized |
| **Research & Analysis** | quality-focused |
| **Software Development** | development |
| **General Purpose** | balanced |

## Tips

1. **Start with balanced** if unsure - it works well for most cases
2. **Monitor costs** when using quality-focused templates
3. **Test latency** with performance-optimized for your specific use case
4. **Customize** templates based on your actual usage patterns
5. **Backup** configurations before switching templates

## Template Comparison

| Feature | Performance | Cost | Quality | Development | Balanced |
|---------|-------------|------|---------|--------------|----------|
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Cost** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Quality** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Coding** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Best For** | Speed | Budget | Accuracy | Development | Everything |

Choose the template that best matches your priorities and use case!