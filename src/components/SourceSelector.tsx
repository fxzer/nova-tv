import type { SearchResult } from '@/lib/types'
import { AnimatePresence, Reorder } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getVideoResolutionFromM3u8, processImageUrl } from '@/lib/utils'

// 图片错误回退组件
interface ImageWithErrorFallbackProps {
  src: string
  alt: string
  className?: string
}

const ImageWithErrorFallback: React.FC<ImageWithErrorFallbackProps> = ({
  src,
  alt,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [imageSrc, setImageSrc] = useState(src)

  // 处理图片加载错误
  const handleImageError = () => {
    setIsLoading(false)

    // 如果是代理URL且还没重试过，尝试直接使用原始URL
    if (imageSrc.includes('/api/image-proxy?') && retryCount === 0) {
      console.log('代理图片加载失败，尝试原始URL:', src)
      try {
        const url = new URL(imageSrc)
        const originalUrl = url.searchParams.get('url')
        if (originalUrl) {
          setImageSrc(originalUrl)
          setRetryCount(1)
          setIsLoading(true)
          return
        }
      }
      catch (e) {
        console.error('解析代理URL失败:', e)
      }
    }

    setHasError(true)
  }

  // 重置状态当src改变时
  React.useEffect(() => {
    setImageSrc(src)
    setRetryCount(0)
    setIsLoading(true)
    setHasError(false)
  }, [src])

  return (
    <div className="relative w-full h-full">
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center z-10">
          <svg
            className="w-6 h-6 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            >
            </path>
          </svg>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10">
          <svg
            className="w-6 h-6 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            >
            </path>
          </svg>
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`${className} ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={handleImageError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}

// 定义视频信息类型
interface VideoInfo {
  quality: string
  loadSpeed: string
  pingTime: number
  hasError?: boolean // 添加错误状态标识
}

interface SourceSelectorProps {
  /** 当前源 */
  currentSource?: string
  /** 当前ID */
  currentId?: string
  /** 视频标题 */
  videoTitle?: string
  /** 可用源列表 */
  availableSources?: SearchResult[]
  /** 源搜索加载状态 */
  sourceSearchLoading?: boolean
  /** 源搜索错误 */
  sourceSearchError?: string | null
  /** 换源回调 */
  onSourceChange?: (source: string, id: string, title: string) => void
  /** 预计算的测速结果，避免重复测速 */
  precomputedVideoInfo?: Map<string, VideoInfo>
}

/**
 * 纯换源组件，负责播放源的选择和测速
 */
const SourceSelector: React.FC<SourceSelectorProps> = ({
  currentSource,
  currentId,
  videoTitle,
  availableSources = [],
  sourceSearchLoading = false,
  sourceSearchError = null,
  onSourceChange,
  precomputedVideoInfo,
}) => {
  const router = useRouter()

  // 存储每个源的视频信息
  const [videoInfoMap, setVideoInfoMap] = useState<Map<string, VideoInfo>>(
    new Map(),
  )
  const [attemptedSources, setAttemptedSources] = useState<Set<string>>(
    new Set(),
  )

  // 使用 ref 来避免闭包问题
  const attemptedSourcesRef = useRef<Set<string>>(new Set())
  const videoInfoMapRef = useRef<Map<string, VideoInfo>>(new Map())

  // 同步状态到 ref
  useEffect(() => {
    attemptedSourcesRef.current = attemptedSources
  }, [attemptedSources])

  useEffect(() => {
    videoInfoMapRef.current = videoInfoMap
  }, [videoInfoMap])

  // 获取视频信息的函数 - 移除 attemptedSources 依赖避免不必要的重新创建
  const getVideoInfo = useCallback(async (source: SearchResult) => {
    const sourceKey = `${source.source}-${source.id}`

    // 使用 ref 获取最新的状态，避免闭包问题
    if (attemptedSourcesRef.current.has(sourceKey)) {
      return
    }

    // 获取第一集的URL
    if (!source.episodes || source.episodes?.length === 0) {
      return
    }
    const episodeUrl
      = source.episodes?.length > 1 ? source.episodes[1] : source.episodes[0]

    // 标记为已尝试
    setAttemptedSources(prev => new Set(prev).add(sourceKey))

    try {
      const info = await getVideoResolutionFromM3u8(episodeUrl)
      setVideoInfoMap(prev => new Map(prev).set(sourceKey, info))
    }
    catch {
      // 失败时保存错误状态
      setVideoInfoMap(prev =>
        new Map(prev).set(sourceKey, {
          quality: '错误',
          loadSpeed: '未知',
          pingTime: 0,
          hasError: true,
        }),
      )
    }
  }, [])

  // 当有预计算结果时，先合并到videoInfoMap中
  useEffect(() => {
    if (precomputedVideoInfo && precomputedVideoInfo.size > 0) {
      // 原子性地更新两个状态，避免时序问题
      setVideoInfoMap((prev) => {
        const newMap = new Map(prev)
        precomputedVideoInfo.forEach((value, key) => {
          newMap.set(key, value)
        })
        return newMap
      })

      setAttemptedSources((prev) => {
        const newSet = new Set(prev)
        precomputedVideoInfo.forEach((info, key) => {
          if (!info.hasError) {
            newSet.add(key)
          }
        })
        return newSet
      })

      // 同步更新 ref，确保 getVideoInfo 能立即看到更新
      precomputedVideoInfo.forEach((info, key) => {
        if (!info.hasError) {
          attemptedSourcesRef.current.add(key)
        }
      })
    }
  }, [precomputedVideoInfo])

  // 读取本地"优选和测速"开关，默认开启
  const [optimizationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enableOptimization')
      if (saved !== null) {
        try {
          return JSON.parse(saved)
        }
        catch {
          /* ignore */
        }
      }
    }
    return true
  })

  // 当有源数据时，异步获取视频信息 - 移除 attemptedSources 依赖避免循环触发
  useEffect(() => {
    const fetchVideoInfosInBatches = async () => {
      if (
        !optimizationEnabled // 若关闭测速则直接退出
        || availableSources?.length === 0
      ) {
        return
      }

      // 筛选出尚未测速的播放源
      const pendingSources = availableSources.filter((source) => {
        const sourceKey = `${source.source}-${source.id}`
        return !attemptedSourcesRef.current.has(sourceKey)
      })

      if (pendingSources?.length === 0)
        return

      const batchSize = Math.ceil(pendingSources?.length / 2)

      for (let start = 0; start < pendingSources?.length; start += batchSize) {
        const batch = pendingSources.slice(start, start + batchSize)
        await Promise.all(batch.map(getVideoInfo))
      }
    }

    fetchVideoInfosInBatches()
    // 依赖项保持与之前一致
  }, [availableSources, getVideoInfo, optimizationEnabled])

  const handleSourceClick = useCallback(
    (source: SearchResult) => {
      onSourceChange?.(source.source, source.id, source.title)
    },
    [onSourceChange],
  )

  return (
    <div className="flex flex-col h-full">
      {/* 内容区域 */}
      <div className="flex flex-col h-full px-6">
        {sourceSearchLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              搜索中...
            </span>
          </div>
        )}

        {sourceSearchError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-2">⚠️</div>
              <p className="text-sm text-red-600 dark:text-red-400">
                {sourceSearchError}
              </p>
            </div>
          </div>
        )}

        {!sourceSearchLoading
          && !sourceSearchError
          && availableSources?.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-gray-400 text-2xl mb-2">📺</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                暂无可用的换源
              </p>
            </div>
          </div>
        )}

        {!sourceSearchLoading
          && !sourceSearchError
          && availableSources?.length > 0 && (
          <div className="flex-1 overflow-y-auto pb-10">
            {/* 源数量显示 */}
            <div className="px-2 py-1 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                共
                {' '}
                {availableSources?.length}
                {' '}
                个
              </span>
            </div>
            <Reorder.Group
              axis="y"
              values={availableSources}
              onReorder={() => {}}
            >
              <AnimatePresence>
                {availableSources
                  .sort((a, b) => {
                    const aIsCurrent
                      = a.source?.toString() === currentSource?.toString()
                        && a.id?.toString() === currentId?.toString()
                    const bIsCurrent
                      = b.source?.toString() === currentSource?.toString()
                        && b.id?.toString() === currentId?.toString()
                    if (aIsCurrent && !bIsCurrent)
                      return -1
                    if (!aIsCurrent && bIsCurrent)
                      return 1
                    return 0
                  })
                  .map((source, index) => {
                    const isCurrentSource
                      = source.source?.toString()
                        === currentSource?.toString()
                        && source.id?.toString() === currentId?.toString()
                    return (
                      <Reorder.Item
                        key={`${source.source}-${source.id}`}
                        value={source}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                          layout: { duration: 0.4 },
                        }}
                      >
                        <div
                          onClick={() =>
                            !isCurrentSource && handleSourceClick(source)}
                          className={`flex items-start gap-3 p-2 rounded-lg transition-all select-none duration-200 relative border mb-2
                          ${
                      isCurrentSource
                        ? 'bg-green-500/15 dark:bg-green-500/20 border-green-500/50 shadow-lg'
                        : 'hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer border-transparent hover:shadow-md'
                      }`.trim()}
                        >
                          {/* 封面 */}
                          <div className="flex-shrink-0 h-20 aspect-[2/3]  bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                            {source.episodes && source.episodes?.length > 0
                              ? (
                                  <ImageWithErrorFallback
                                    src={processImageUrl(source.poster)}
                                    alt={source.title}
                                    className="w-full h-full object-cover"
                                  />
                                )
                              : (
                            // 无封面时的默认占位符
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg
                                      className="w-6 h-6 text-gray-400 dark:text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      >
                                      </path>
                                    </svg>
                                  </div>
                                )}
                          </div>

                          {/* 信息区域 */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                            {/* 标题和分辨率 - 顶部 */}
                            <div className="flex items-start justify-between gap-3 h-6">
                              <div className="flex-1 min-w-0 relative group/title">
                                <h3 className="font-medium text-base truncate text-gray-900 dark:text-gray-100 leading-none">
                                  {source.title}
                                </h3>
                                {/* 标题级别的 tooltip - 第一个元素不显示 */}
                                {index !== 0 && (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover/title:opacity-100 group-hover/title:visible transition-all duration-200 ease-out delay-100 whitespace-nowrap z-10 pointer-events-none">
                                    {source.title}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const sourceKey = `${source.source}-${source.id}`
                                const videoInfo = videoInfoMap.get(sourceKey)

                                if (
                                  videoInfo
                                  && videoInfo.quality !== '未知'
                                ) {
                                  if (videoInfo.hasError) {
                                    return (
                                      <div className="bg-gray-500/10 dark:bg-gray-400/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-xs flex-shrink-0 min-w-[50px] text-center">
                                        测速失败
                                      </div>
                                    )
                                  }
                                  else {
                                    // 根据分辨率设置不同颜色：2K、4K为紫色，1080p、720p为绿色，其他为黄色
                                    const isUltraHigh = ['4K', '2K'].includes(
                                      videoInfo.quality,
                                    )
                                    const isHigh = ['1080p', '720p'].includes(
                                      videoInfo.quality,
                                    )
                                    const textColorClasses = isUltraHigh
                                      ? 'text-purple-600 dark:text-purple-400'
                                      : isHigh
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-yellow-600 dark:text-yellow-400'

                                    return (
                                      <div
                                        className={`bg-gray-500/10 dark:bg-gray-400/20 ${textColorClasses} px-1.5 py-0.5 rounded text-xs flex-shrink-0 min-w-[50px] text-center`}
                                      >
                                        {videoInfo.quality}
                                      </div>
                                    )
                                  }
                                }

                                return null
                              })()}
                            </div>

                            {/* 源名称和集数信息 - 垂直居中 */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs p-1 text-nowrap border border-gray-500/60 rounded text-gray-700 dark:text-gray-300">
                                {source.source_name}
                              </span>
                              {source.episodes?.length > 1 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  {source.episodes?.length}
                                  {' '}
                                  集
                                </span>
                              )}
                            </div>

                            {/* 网络信息 - 底部 */}
                            <div className="flex items-end h-6">
                              {(() => {
                                const sourceKey = `${source.source}-${source.id}`
                                const videoInfo = videoInfoMap.get(sourceKey)
                                if (videoInfo) {
                                  if (!videoInfo.hasError) {
                                    return (
                                      <div className="flex items-end gap-3 text-xs">
                                        <div className="text-green-600 dark:text-green-400 font-medium text-xs">
                                          {videoInfo.loadSpeed}
                                        </div>
                                        <div className="text-orange-600 dark:text-orange-400 font-medium text-xs">
                                          {videoInfo.pingTime}
                                          ms
                                        </div>
                                      </div>
                                    )
                                  }
                                  else {
                                    return (
                                      <div className="text-gray-500/70  font-medium text-xs">
                                        无测速数据
                                      </div>
                                    ) // 占位div
                                  }
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </Reorder.Item>
                    )
                  })}
              </AnimatePresence>
            </Reorder.Group>
            <div className="flex-shrink-0 mt-auto pt-2 border-t border-gray-400 dark:border-gray-700">
              <button
                onClick={() => {
                  if (videoTitle) {
                    router.push(
                      `/search?q=${encodeURIComponent(videoTitle)}`,
                    )
                  }
                }}
                className="w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors py-2"
              >
                影片匹配有误？点击去搜索
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SourceSelector
