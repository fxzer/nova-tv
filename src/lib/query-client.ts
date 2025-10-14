import { QueryClient } from '@tanstack/react-query'

// 创建 TanStack Query 客户端实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据缓存时间：5分钟
      staleTime: 5 * 60 * 1000,
      // 缓存时间：10分钟
      gcTime: 10 * 60 * 1000,
      // 重试次数
      retry: (failureCount, error) => {
        // 网络错误重试3次，其他错误重试1次
        if (error instanceof Error && error.message.includes('Network Error')) {
          return failureCount < 3
        }
        return failureCount < 1
      },
      // 重试延迟
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口聚焦时不自动重新获取
      refetchOnWindowFocus: false,
      // 网络重连时不自动重新获取
      refetchOnReconnect: true,
    },
    mutations: {
      // 突变重试次数
      retry: 1,
    },
  },
})
