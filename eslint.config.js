import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: {},
})

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'public/**/*.js',
      '*.config.js',
      'start.js',
    ],
  },
  {
    rules: {
      // 根据你的需求，放宽一些规则
      '@typescript-eslint/no-explicit-any': 'warn', // any 类型改为警告
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 未使用变量改为警告
      '@typescript-eslint/no-require-imports': 'off', // 关闭 require 导入检查
      '@typescript-eslint/no-unused-expressions': 'off', // 关闭未使用表达式检查
    },
  },
]