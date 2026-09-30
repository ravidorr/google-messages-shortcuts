import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'background.js',
        'content.js',
        'popup.js',
        'src/**/*.js'
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        statements: 90,
        functions: 100
      }
    }
  }
});
