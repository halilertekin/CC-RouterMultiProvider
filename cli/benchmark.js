#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Load provider configurations
function loadProviders() {
  const configPath = path.join(require('os').homedir(), '.claude-code-router', 'config.json');
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.Providers;
  } catch (error) {
    console.error(chalk.red('❌ Failed to load provider configuration'));
    return [];
  }
}

// Perform speed test for a provider
async function speedTest(providerName, modelName) {
  return new Promise((resolve) => {
    const testPrompt = "Hello, can you respond with just 'OK'?";
    const startTime = Date.now();

    // Use ccr to send a test request
    const child = spawn('ccr', ['code', '--test'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        CCR_TEST_PROVIDER: providerName,
        CCR_TEST_MODEL: modelName,
        CCR_TEST_PROMPT: testPrompt
      }
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      const success = code === 0 && output.includes('OK');

      resolve({
        provider: providerName,
        model: modelName,
        latency,
        success,
        timestamp: new Date().toISOString()
      });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({
        provider: providerName,
        model: modelName,
        latency: 30000,
        success: false,
        error: 'Timeout',
        timestamp: new Date().toISOString()
      });
    }, 30000);
  });
}

// Run comprehensive benchmark
async function runBenchmark(options = {}) {
  const {
    iterations = 3,
    warmup = true,
    output = 'console',
    providers = [],
    models = []
  } = options;

  const providersList = loadProviders();
  const targetProviders = providers.length > 0
    ? providersList.filter(p => providers.includes(p.name))
    : providersList;

  console.log(chalk.blue('🏃‍♂️ Claude Code Router Benchmark'));
  console.log(chalk.gray(`Running ${iterations} iterations per provider/model`));
  console.log(chalk.gray('─'.repeat(60)));

  const results = [];

  for (const provider of targetProviders) {
    const modelsToTest = models.length > 0
      ? provider.models.filter(m => models.includes(m))
      : [provider.models[0]]; // Test primary model only by default

    for (const model of modelsToTest) {
      console.log(chalk.yellow(`\n🔍 Testing ${provider.name} - ${model}`));

      // Warmup
      if (warmup) {
        await speedTest(provider.name, model);
        console.log(chalk.gray('  Warmup completed'));
      }

      // Main benchmark
      const runs = [];
      for (let i = 0; i < iterations; i++) {
        process.stdout.write(chalk.gray(`  Run ${i + 1}/${iterations}... `));
        const result = await speedTest(provider.name, model);

        if (result.success) {
          console.log(chalk.green(`${result.latency}ms`));
          runs.push(result.latency);
        } else {
          console.log(chalk.red('Failed'));
        }
      }

      // Calculate statistics
      if (runs.length > 0) {
        const avgLatency = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
        const minLatency = Math.min(...runs);
        const maxLatency = Math.max(...runs);
        const successRate = (runs.length / iterations) * 100;

        const stats = {
          provider: provider.name,
          model,
          avgLatency,
          minLatency,
          maxLatency,
          successRate,
          iterations,
          timestamp: new Date().toISOString()
        };

        results.push(stats);

        // Display results
        console.log(chalk.green(`  ✅ Average: ${avgLatency}ms`));
        console.log(chalk.blue(`     Range: ${minLatency}ms - ${maxLatency}ms`));
        console.log(chalk.blue(`     Success Rate: ${successRate}%`));
      } else {
        console.log(chalk.red(`  ❌ All runs failed`));
      }
    }
  }

  // Summary
  console.log(chalk.blue('\n📊 Benchmark Summary'));
  console.log(chalk.gray('─'.repeat(60)));

  if (results.length > 0) {
    // Sort by average latency
    results.sort((a, b) => a.avgLatency - b.avgLatency);

    results.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${result.provider}/${result.model}: ${result.avgLatency}ms (${result.successRate}% success)`);
    });

    // Performance classification
    const fastest = results[0];
    const slowest = results[results.length - 1];
    const speedRatio = (slowest.avgLatency / fastest.avgLatency).toFixed(1);

    console.log(chalk.yellow(`\n📈 Performance Insights:`));
    console.log(`  Fastest: ${fastest.provider}/${fastest.model} (${fastest.avgLatency}ms)`);
    console.log(`  Slowest: ${slowest.provider}/${slowest.model} (${slowest.avgLatency}ms)`);
    console.log(`  Speed Ratio: ${speedRatio}x`);
  } else {
    console.log(chalk.red('No successful tests completed'));
  }

  // Export results
  if (output === 'json' || output === 'file') {
    const reportPath = path.join(process.cwd(), `benchmark-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(chalk.blue(`\n💾 Results saved to: ${reportPath}`));
  }

  return results;
}

// Load test (stress test)
async function loadTest(provider, model, options = {}) {
  const { concurrent = 5, duration = 30 } = options;
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);

  console.log(chalk.blue(`🔥 Load Testing ${provider}/${model}`));
  console.log(chalk.gray(`Concurrent requests: ${concurrent}, Duration: ${duration}s`));

  const results = [];
  const promises = [];

  // Run concurrent requests
  for (let i = 0; i < concurrent; i++) {
    promises.push((async () => {
      let requestCount = 0;
      let totalLatency = 0;
      let errors = 0;

      while (Date.now() < endTime) {
        const requestStart = Date.now();
        const result = await speedTest(provider, model);
        const requestEnd = Date.now();

        requestCount++;
        totalLatency += (requestEnd - requestStart);

        if (!result.success) {
          errors++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        thread: i,
        requests: requestCount,
        avgLatency: Math.round(totalLatency / requestCount),
        errors,
        errorRate: (errors / requestCount) * 100
      };
    })());
  }

  const threadResults = await Promise.all(promises);

  // Aggregate results
  const totalRequests = threadResults.reduce((sum, r) => sum + r.requests, 0);
  const totalErrors = threadResults.reduce((sum, r) => sum + r.errors, 0);
  const avgLatency = Math.round(
    threadResults.reduce((sum, r) => sum + r.avgLatency * r.requests, 0) / totalRequests
  );
  const requestsPerSecond = Math.round(totalRequests / duration);
  const errorRate = (totalErrors / totalRequests) * 100;

  console.log(chalk.green('\n📊 Load Test Results:'));
  console.log(`  Total Requests: ${totalRequests}`);
  console.log(`  Requests/Second: ${requestsPerSecond}`);
  console.log(`  Average Latency: ${avgLatency}ms`);
  console.log(`  Error Rate: ${errorRate}%`);

  return {
    provider,
    model,
    duration,
    concurrent,
    totalRequests,
    requestsPerSecond,
    avgLatency,
    errorRate,
    threadResults
  };
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'speed':
      const provider = args[1];
      const model = args[2];
      if (!provider) {
        console.error(chalk.red('Usage: ccr benchmark speed <provider> [model]'));
        process.exit(1);
      }
      await speedTest(provider, model);
      break;

    case 'full':
      const iterations = parseInt(args[1]) || 3;
      const providers = args.filter(arg => arg.startsWith('--provider=')).map(arg => arg.split('=')[1]);
      const models = args.filter(arg => arg.startsWith('--model=')).map(arg => arg.split('=')[1]);
      const output = args.includes('--json') ? 'json' : 'console';
      const warmup = !args.includes('--no-warmup');

      await runBenchmark({
        iterations,
        providers,
        models,
        output,
        warmup
      });
      break;

    case 'load':
      const loadProvider = args[1];
      const loadModel = args[2];
      const concurrent = parseInt(args.find(arg => arg.startsWith('--concurrent='))?.split('=')[1]) || 5;
      const duration = parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1]) || 30;

      if (!loadProvider) {
        console.error(chalk.red('Usage: ccr benchmark load <provider> <model> [--concurrent=N] [--duration=N]'));
        process.exit(1);
      }

      await loadTest(loadProvider, loadModel, { concurrent, duration });
      break;

    default:
      console.log(chalk.blue('Claude Code Router - Benchmark CLI'));
      console.log(chalk.gray('─'.repeat(45)));
      console.log(chalk.yellow('Available commands:'));
      console.log('');
      console.log('Speed Testing:');
      console.log('  ccr benchmark speed <provider> [model]           - Single speed test');
      console.log('  ccr benchmark full [iterations] [options]        - Full benchmark');
      console.log('');
      console.log('Load Testing:');
      console.log('  ccr benchmark load <provider> <model> [options]  - Stress test');
      console.log('');
      console.log('Options:');
      console.log('  --provider=<name>    Test specific provider');
      console.log('  --model=<name>       Test specific model');
      console.log('  --json              Output results as JSON');
      console.log('  --no-warmup         Skip warmup requests');
      console.log('  --concurrent=N      Number of concurrent requests (load test)');
      console.log('  --duration=N        Test duration in seconds (load test)');
      console.log('');
      console.log('Examples:');
      console.log('  ccr benchmark speed openai gpt-4o');
      console.log('  ccr benchmark full 5 --provider=openai --provider=anthropic');
      console.log('  ccr benchmark load openai gpt-4o --concurrent=10 --duration=60');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runBenchmark,
  loadTest,
  speedTest
};