import js from '@eslint/js';
import globals from 'globals';
import noEmojiPlugin from 'eslint-plugin-no-emoji';
import noEmDashPlugin from 'eslint-plugin-no-em-dash';
import tseslint from 'typescript-eslint';

const typedConfigs = tseslint.configs.strictTypeChecked.map((config) => ({
  ...config,
  files: ['**/*.ts']
}));

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.claude/**',
      'coverage/**',
      'dist/**',
      'release/**',
      '.lighthouseci/**',
      'vitest.config.ts'
    ]
  },
  js.configs.recommended,
  ...typedConfigs,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        ...globals.node,
        ...globals.vitest,
        chrome: 'readonly'
      }
    },
    plugins: {
      'no-emoji': noEmojiPlugin,
      'no-em-dash': noEmDashPlugin
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-emoji/no-emoji': 'error',
      'no-em-dash/no-em-dash': 'error'
    }
  }
);
