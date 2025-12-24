const { testProvider } = require('../cli/commands');

describe('CLI Commands Loading', () => {
  test('should export testProvider function', () => {
    expect(typeof testProvider).toBe('function');
  });
});
