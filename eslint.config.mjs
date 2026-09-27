import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginCypress from 'eslint-plugin-cypress';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'cypress/screenshots/**',
      'cypress/videos/**',
      'cypress/downloads/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['cypress/**/*.ts'],
    extends: [pluginCypress.configs.recommended],
    rules: {
      /* The habits that make Cypress suites flaky, as build failures rather than review
         comments: a sleep instead of waiting on state, and acting on a chain that may have
         re-rendered underneath it. */
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/unsafe-to-chain-command': 'error',
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-force': 'error',
      'cypress/no-pause': 'error',
      'cypress/no-debug': 'error',
      'no-console': 'error',
      /* Chai property assertions (`expect(x).to.be.true`) read as bare expressions. */
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['app/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        queueMicrotask: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        HTMLElement: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
