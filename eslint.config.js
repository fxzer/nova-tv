// 临时简化的 ESLint 配置，避免 JSDoc 插件问题
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'public/sw.js',
      'public/workbox-*.js',
      'node_modules',
      '.next',
      'dist',
      'scripts',
      'build',
      'coverage',
      'temp',
      '.vscode',
      '.idea',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 基本规则
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-eval': 'warn',
      'eqeqeq': 'warn',
      'no-cond-assign': 'error',
      'no-empty': 'warn',

      // React 规则
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
]
