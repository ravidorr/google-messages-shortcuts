import globals from 'globals';
import pluginJs from '@eslint/js';
import noEmojiPlugin from 'eslint-plugin-no-emoji';
import noEmDashPlugin from 'eslint-plugin-no-em-dash';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        ...globals.es2021,
        chrome: 'readonly'
      }
    }
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      'no-emoji': noEmojiPlugin,
      'no-em-dash': noEmDashPlugin
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'id-length': ['error', {
        min: 2,
        exceptions: ['i', 'j', 'k', 'x', 'y', '_'],
        properties: 'never'
      }],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'never'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-emoji/no-emoji': 'error',
      'no-em-dash/no-em-dash': 'error'
    }
  },
  {
    files: ['test/**/*.js', 'vitest.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest
      }
    }
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'release/**',
      'output/**'
    ]
  }
];
