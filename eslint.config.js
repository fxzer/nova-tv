import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  formatter: true,
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
}, {
  rules: {
    // 自定义规则
    'no-console': 'warn',

    // 禁用不兼容的规则
    'node/prefer-global/process': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'ts/no-use-before-define': 'off',
    'unused-imports/no-unused-vars': 'off',
    'no-restricted-globals': 'off',
    'style/eol-last': 'off',

    // 基本代码质量规则
    'no-cond-assign': 'error',
    'no-empty': 'warn',
    'no-eval': 'warn',
    'eqeqeq': 'warn',

    // 样式规则
    'style/operator-linebreak': 'off',
    'style/multiline-ternary': 'off',
  },
})
