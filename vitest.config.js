import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'background.js',
        'content.js',
        'popup.js',
        'scripts/**/*.js',
        'src/**/*.js'
      ],
      thresholds: {
        lines: 90,
        branches: 100,
        statements: 90,
        functions: 100
      }
    }
  }
});
