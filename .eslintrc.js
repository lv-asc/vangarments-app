module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-useless-escape': 'warn',
    'prefer-const': 'warn',
    'no-var': 'warn',
    'no-case-declarations': 'off',
    'no-prototype-builtins': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'no-useless-catch': 'off',
    'no-empty-pattern': 'off',
  },
  overrides: [
    {
      files: ['packages/web/**/*'],
      extends: ['next/core-web-vitals'],
      env: {
        browser: true,
      },
      settings: {
        next: {
          rootDir: 'packages/web/',
        },
      },
      rules: {
        'react/no-unescaped-entities': 'off',
        '@next/next/no-img-element': 'off',
        'react-hooks/exhaustive-deps': 'warn',
        'react/display-name': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
};