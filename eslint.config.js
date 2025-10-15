import antfu from '@antfu/eslint-config'

export default antfu({
  nextjs: true,
  formatters: true,
  rules: {
    'no-console': 'warn',
  },
})
