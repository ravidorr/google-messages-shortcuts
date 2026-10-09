import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    setupFiles: ['./test/setup.js'],
    exclude: ['node_modules/**', '.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: [
        'background.js',
        'content.js',
        'page-world-bridge-main.js',
        'page-world-bridge.js',
        'popup.js',
        'scripts/**/*.{js,mjs}',
        'src/**/*.js'
      ],
      exclude: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  }
});
