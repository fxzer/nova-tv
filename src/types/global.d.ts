// 运行时配置类型
interface RuntimeConfig {
  CUSTOM_CATEGORIES?: Array<{
    name: string
    type: 'movie' | 'tv'
    query: string
  }>
  STORAGE_TYPE?: string
  IMAGE_PROXY?: string
  DOUBAN_PROXY?: string
  DISABLE_YELLOW_FILTER?: boolean
  ENABLE_REGISTER?: boolean
}

// Window 接口扩展
declare global {
  interface Window {
    RUNTIME_CONFIG?: RuntimeConfig
  }
}

export {}
