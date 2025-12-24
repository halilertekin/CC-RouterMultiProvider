const fs = require('fs');
const path = require('path');

/**
 * Safely loads chalk and provides fallbacks for missing methods.
 * This handles ESM/CJS interop and pnpm global install issues.
 */
function getSafeChalk() {
  let chalk;
  try {
    chalk = require('chalk');
    if (chalk.default) chalk = chalk.default;
  } catch (e) {
    // Fallback if chalk is missing
    chalk = {};
  }

  // Ensure common methods exist as fallbacks
  const methods = ['blue', 'red', 'green', 'yellow', 'gray', 'cyan', 'magenta', 'bold'];
  const safeChalk = { ...chalk };

  methods.forEach(method => {
    if (typeof safeChalk[method] !== 'function') {
      safeChalk[method] = (str) => str || '';
    }
  });

  return safeChalk;
}

module.exports = getSafeChalk();
