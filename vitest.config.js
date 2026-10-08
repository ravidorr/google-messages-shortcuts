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
        'scripts/**/*.{js,mjs}',
        'src/**/*.js'
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        statements: 100,
        functions: 100
      }
    }
  }
});
