import type { AxiosProgressEvent } from 'axios'
import type { SearchResult } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { useCallback, useState } from 'react'

// 进度状态类型
export interface ProgressState {
  stage: 'searching' | 'preferring' | 'fetching' | 'ready' | 'idle'
  progress: number // 0-100
  message: string
  detail: string
  estimatedTime?: number
}

// 搜索结果的响应类型
interface SearchResponse {
  results: SearchResult[]
}

// 视频详情的响应类型
type DetailResponse = SearchResult

// 自定义 Hook: 带进度的搜索
export function useProgressiveSearch() {
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: 'idle',
    progress: 0,
    message: '',
    detail: '',
  })

  const searchSources = useCallback(
    async (
      query: string,
      onProgress?: (state: ProgressState) => void,
    ): Promise<SearchResult[]> => {
      setProgressState({
        stage: 'searching',
        progress: 0,
        message: '🔍 正在搜索播放源...',
        detail: '正在连接影视资源站...',
        estimatedTime: 5,
      })

      try {
        const response = await axios.get<SearchResponse>(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          {
            onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded / progressEvent.total) * 100,
                )

                let stageProgress = 0
                let stageMessage = ''
                let stageDetail = ''

                if (percentCompleted < 25) {
                  stageProgress = 5 + percentCompleted * 0.2
                  stageMessage = '🔍 正在搜索播放源...'
                  stageDetail = '正在连接影视资源站...'
                }
                else if (percentCompleted < 50) {
                  stageProgress = 10 + (percentCompleted - 25) * 0.4
                  stageMessage = '🔍 正在解析搜索结果...'
                  stageDetail = '正在处理搜索数据...'
                }
                else if (percentCompleted < 75) {
                  stageProgress = 20 + (percentCompleted - 50) * 0.4
                  stageMessage = '🔍 正在筛选播放源...'
                  stageDetail = '正在过滤匹配的结果...'
                }
                else {
                  stageProgress = 30
                  stageMessage = '🔍 搜索完成'
                  stageDetail = '找到匹配的播放源'
                }

                const newProgressState = {
                  stage: 'searching' as const,
                  progress: stageProgress,
                  message: stageMessage,
                  detail: stageDetail,
                }

                setProgressState(newProgressState)
                onProgress?.(newProgressState)
              }
            },
          },
        )

        const results = response.data.results
        const finalState = {
          stage: 'searching' as const,
          progress: 30,
          message: '🔍 搜索完成',
          detail: `找到 ${results?.length} 个匹配的播放源`,
        }

        setProgressState(finalState)
        onProgress?.(finalState)

        return results
      }
      catch (error) {
        const errorState = {
          stage: 'idle' as const,
          progress: 0,
          message: '搜索失败',
          detail: error instanceof Error ? error.message : '未知错误',
        }
        setProgressState(errorState)
        onProgress?.(errorState)
        throw error
      }
    },
    [],
  )

  const fetchVideoDetails = useCallback(
    async (
      source: string,
      id: string,
      onProgress?: (state: ProgressState) => void,
    ): Promise<SearchResult> => {
      setProgressState({
        stage: 'fetching',
        progress: 70,
        message: '🎬 正在获取视频详情...',
        detail: '正在获取影片详细信息...',
        estimatedTime: 2,
      })

      try {
        const response = await axios.get<DetailResponse>(
          `/api/detail?source=${source}&id=${id}`,
          {
            onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded / progressEvent.total) * 100,
                )

                let stageProgress = 70
                let stageMessage = ''
                let stageDetail = ''

                if (percentCompleted < 50) {
                  stageProgress = 70 + percentCompleted * 0.3
                  stageMessage = '🎬 正在获取视频详情...'
                  stageDetail = '正在获取影片详细信息...'
                }
                else if (percentCompleted < 80) {
                  stageProgress = 75 + (percentCompleted - 50) * 0.2
                  stageMessage = '🎬 正在解析视频信息...'
                  stageDetail = '正在处理视频数据...'
                }
                else {
                  stageProgress = 85
                  stageMessage = '🎬 详情获取完成'
                  stageDetail = '正在准备播放器...'
                }

                const newProgressState = {
                  stage: 'fetching' as const,
                  progress: stageProgress,
                  message: stageMessage,
                  detail: stageDetail,
                }

                setProgressState(newProgressState)
                onProgress?.(newProgressState)
              }
            },
          },
        )

        const detailData = response.data as SearchResult
        const finalState = {
          stage: 'fetching' as const,
          progress: 90,
          message: '🎬 详情获取完成',
          detail: '正在准备播放器...',
        }

        setProgressState(finalState)
        onProgress?.(finalState)

        return detailData
      }
      catch (error) {
        const errorState = {
          stage: 'idle' as const,
          progress: 0,
          message: '获取详情失败',
          detail: error instanceof Error ? error.message : '未知错误',
        }
        setProgressState(errorState)
        onProgress?.(errorState)
        throw error
      }
    },
    [],
  )

  const markReady = useCallback(
    (onProgress?: (state: ProgressState) => void) => {
      const readyState = {
        stage: 'ready' as const,
        progress: 100,
        message: '✨ 准备就绪',
        detail: '播放器初始化完成，即将开始播放...',
      }

      setProgressState(readyState)
      onProgress?.(readyState)
    },
    [],
  )

  const resetProgress = useCallback(() => {
    setProgressState({
      stage: 'idle',
      progress: 0,
      message: '',
      detail: '',
    })
  }, [])

  return {
    progressState,
    searchSources,
    fetchVideoDetails,
    markReady,
    resetProgress,
  }
}

// TanStack Query 封装
export function useSearchQuery(query: string, enabled = false) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await axios.get<SearchResponse>(
        `/api/search?q=${encodeURIComponent(query.trim())}`,
      )
      return response.data.results
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: 2,
  })
}

export function useDetailQuery(source: string, id: string, enabled = false) {
  return useQuery({
    queryKey: ['detail', source, id],
    queryFn: async () => {
      const response = await axios.get<DetailResponse>(
        `/api/detail?source=${source}&id=${id}`,
      )
      return response.data as SearchResult
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
    retry: 2,
  })
}
