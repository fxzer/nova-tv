import type { SearchResult } from '@/lib/types'

import { useCallback, useState } from 'react'
import { getVideoResolutionFromM3u8 } from '@/lib/utils'

// 优选进度状态
export interface PreferProgressState {
  stage: 'testing' | 'analyzing' | 'completed' | 'idle'
  progress: number // 30-70 范围
  message: string
  detail: string
  testedSources: number
  totalSources: number
  currentSourceName?: string
}

// 播放源测速结果
interface SourceTestResult {
  source: SearchResult
  testResult: {
    quality: string
    loadSpeed: string
    pingTime: number
  }
}

// 自定义 Hook: 带进度的播放源优选
export function useProgressivePrefer() {
  const [preferProgressState, setPreferProgressState]
    = useState<PreferProgressState>({
      stage: 'idle',
      progress: 30,
      message: '',
      detail: '',
      testedSources: 0,
      totalSources: 0,
    })

  const preferBestSource = useCallback(
    async (
      sources: SearchResult[],
      onProgress?: (state: PreferProgressState) => void,
    ): Promise<SearchResult> => {
      if (sources.length === 1) {
        const singleSourceState = {
          stage: 'completed' as const,
          progress: 70,
          message: '✅ 使用唯一可用播放源',
          detail: `使用播放源: ${sources[0].source_name}`,
          testedSources: 1,
          totalSources: 1,
          currentSourceName: sources[0].source_name,
        }

        setPreferProgressState(singleSourceState)
        onProgress?.(singleSourceState)
        return sources[0]
      }

      // 初始化状态
      const initialState = {
        stage: 'testing' as const,
        progress: 35,
        message: '⚡ 正在测试播放源质量...',
        detail: `准备测试 ${sources.length} 个播放源`,
        testedSources: 0,
        totalSources: sources.length,
      }

      setPreferProgressState(initialState)
      onProgress?.(initialState)

      // 将播放源分批测试
      const batchSize = Math.ceil(sources.length / 2)
      const allResults: Array<SourceTestResult | null> = []

      for (let start = 0; start < sources.length; start += batchSize) {
        const batchIndex = Math.floor(start / batchSize)
        const totalBatches = Math.ceil(sources.length / batchSize)
        const batchSources = sources.slice(start, start + batchSize)

        // 更新批次进度
        const batchState = {
          stage: 'testing' as const,
          progress: 35 + (batchIndex / totalBatches) * 20,
          message: '⚡ 正在测试播放源质量...',
          detail: `正在测试第 ${batchIndex + 1}/${totalBatches} 批播放源...`,
          testedSources: start,
          totalSources: sources.length,
        }

        setPreferProgressState(batchState)
        onProgress?.(batchState)

        // 并发测试当前批次
        const batchResults = await Promise.allSettled(
          batchSources.map(async (source) => {
            try {
              // 更新当前测试的播放源
              const testingState = {
                stage: 'testing' as const,
                progress: 35 + (batchIndex / totalBatches) * 20,
                message: '⚡ 正在测试播放源质量...',
                detail: `测试 ${source.source_name} 的播放质量...`,
                testedSources: start + batchSources.indexOf(source),
                totalSources: sources.length,
                currentSourceName: source.source_name,
              }

              setPreferProgressState(testingState)
              onProgress?.(testingState)

              // 检查是否有第一集的播放地址
              if (!source.episodes || source.episodes.length === 0) {
                return null
              }

              const episodeUrl
                = source.episodes.length > 1
                  ? source.episodes[1]
                  : source.episodes[0]

              const testResult = await getVideoResolutionFromM3u8(episodeUrl)

              return {
                source,
                testResult,
              }
            }
            catch {
              return null
            }
          }),
        )

        // 处理批次结果
        const batchSuccessfulResults = batchResults
          .filter(
            result => result.status === 'fulfilled' && result.value !== null,
          )
          .map(
            result =>
              (result as PromiseFulfilledResult<SourceTestResult>).value,
          )

        allResults.push(...batchSuccessfulResults)

        // 更新批次完成状态
        const batchCompletedState = {
          stage: 'testing' as const,
          progress: 35 + ((batchIndex + 1) / totalBatches) * 20,
          message: '⚡ 正在测试播放源质量...',
          detail: `第 ${batchIndex + 1}/${totalBatches} 批测试完成，成功 ${
            batchSuccessfulResults.length
          } 个`,
          testedSources: start + batchSources.length,
          totalSources: sources.length,
        }

        setPreferProgressState(batchCompletedState)
        onProgress?.(batchCompletedState)
      }

      // 分析阶段
      const analyzingState = {
        stage: 'analyzing' as const,
        progress: 65,
        message: '⚡ 正在分析播放源质量...',
        detail: '正在计算最佳播放源评分...',
        testedSources: allResults.length,
        totalSources: sources.length,
      }

      setPreferProgressState(analyzingState)
      onProgress?.(analyzingState)

      // 过滤出成功的结果
      const successfulResults = allResults.filter(
        Boolean,
      ) as SourceTestResult[]

      if (successfulResults.length === 0) {
        const failState = {
          stage: 'completed' as const,
          progress: 70,
          message: '⚠️ 所有播放源测试失败',
          detail: '使用默认播放源',
          testedSources: 0,
          totalSources: sources.length,
        }

        setPreferProgressState(failState)
        onProgress?.(failState)
        return sources[0]
      }

      // 计算播放源评分
      const resultsWithScore = successfulResults.map(result => ({
        ...result,
        score: calculateSourceScore(result.testResult),
      }))

      // 按评分排序
      resultsWithScore.sort((a, b) => b.score - a.score)

      // 最佳播放源
      const bestSource = resultsWithScore[0].source

      const completedState = {
        stage: 'completed' as const,
        progress: 70,
        message: '✅ 已选择最佳播放源',
        detail: `使用 ${
          bestSource.source_name
        } (评分: ${resultsWithScore[0].score.toFixed(2)})`,
        testedSources: successfulResults.length,
        totalSources: sources.length,
        currentSourceName: bestSource.source_name,
      }

      setPreferProgressState(completedState)
      onProgress?.(completedState)

      return bestSource
    },
    [],
  )

  const resetPreferProgress = useCallback(() => {
    setPreferProgressState({
      stage: 'idle',
      progress: 30,
      message: '',
      detail: '',
      testedSources: 0,
      totalSources: 0,
    })
  }, [])

  return {
    preferProgressState,
    preferBestSource,
    resetPreferProgress,
  }
}

// 计算播放源综合评分
function calculateSourceScore(testResult: {
  quality: string
  loadSpeed: string
  pingTime: number
}): number {
  let score = 0

  // 分辨率评分 (40% 权重)
  const qualityScore = (() => {
    switch (testResult.quality) {
      case '4K':
        return 100
      case '2K':
        return 85
      case '1080p':
        return 75
      case '720p':
        return 60
      case '480p':
        return 40
      case 'SD':
        return 20
      default:
        return 0
    }
  })()
  score += qualityScore * 0.4

  // 下载速度评分 (40% 权重)
  const speedScore = (() => {
    const speedStr = testResult.loadSpeed
    if (speedStr === '未知' || speedStr === '测量中...')
      return 30

    const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/)
    if (!match)
      return 30

    const value = Number.parseFloat(match[1])
    const unit = match[2]
    const speedKBps = unit === 'MB/s' ? value * 1024 : value

    // 假设最大速度为 2MB/s
    const speedRatio = Math.min(speedKBps / 2048, 1)
    return speedRatio * 100
  })()
  score += speedScore * 0.4

  // 网络延迟评分 (20% 权重)
  const pingScore = (() => {
    const ping = testResult.pingTime
    if (ping <= 0)
      return 0

    // 延迟越低评分越高，假设最大延迟为 2000ms
    const pingRatio = Math.max(0, 1 - ping / 2000)
    return pingRatio * 100
  })()
  score += pingScore * 0.2

  return Math.round(score * 100) / 100
}
