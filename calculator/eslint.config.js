import js from '@eslint/js';
import pluginSecurity from 'eslint-plugin-security';
import globals from 'globals';

export default [
  js.configs.recommended,
  pluginSecurity.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        Chart: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  {
    files: ['sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    ignores: [
      'node_modules/',
      '.lighthouseci/',
      'lhr-*.html',
      'lhr-*.json',
    ],
  },
];
