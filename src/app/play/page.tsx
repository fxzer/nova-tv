'use client'

import type { SearchResult } from '@/lib/types'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import BackButton from '@/components/BackButton'
import FavoriteButton from '@/components/FavoriteButton'
import PageLayout from '@/components/PageLayout'
import PlayDetailInfo from '@/components/PlayDetailInfo'
import PlayErrorState from '@/components/PlayErrorState'
import PlayLoadingState from '@/components/PlayLoadingState'
import PlayPanel from '@/components/PlayPanel'
import SourceLoadingOverlay from '@/components/SourceLoadingOverlay'
import { useProgressiveSearch } from '@/hooks/useProgressiveFetch'
import { useProgressivePrefer } from '@/hooks/useProgressivePrefer'
import {
  deleteFavorite,
  deletePlayRecord,
  deleteSkipConfig,
  generateStorageKey,
  getAllPlayRecords,
  getSkipConfig,
  isFavorited,
  saveFavorite,
  savePlayRecord,
  saveSkipConfig,
  subscribeToDataUpdates,
} from '@/lib/db.client'
import { processImageUrlWithFallback } from '@/lib/utils'

// 扩展 HTMLVideoElement 类型以支持 hls 属性
declare global {
  interface HTMLVideoElement {
    hls?: any
  }
}

function formatTime(seconds: number): string {
  if (seconds === 0)
    return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.round(seconds % 60)

  if (hours === 0) {
    // 不到一小时，格式为 00:00
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }
  else {
    // 超过一小时，格式为 00:00:00
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}
function PlayPageClient() {
  const searchParams = useSearchParams()

  // -----------------------------------------------------------------------------
  // 状态变量（State）
  // -----------------------------------------------------------------------------
  // 动态导入状态
  const artplayerRef = useRef<any>(null)
  const hlsRef = useRef<any>(null)
  const [_, setLibrariesLoaded] = useState(false)

  // 动态导入客户端库
  useEffect(() => {
    const importLibraries = async () => {
      try {
        const [artplayerModule, hlsModule] = await Promise.all([
          import('artplayer'),
          import('hls.js'),
        ])
        artplayerRef.current = artplayerModule.default
        hlsRef.current = hlsModule.default
        setLibrariesLoaded(true)
      }
      catch (err) {
        console.error('Failed to import player libraries:', err)
      }
    }

    importLibraries()
  }, [])

  // 使用进度跟踪 hooks
  const { searchSources, fetchVideoDetails, markReady }
    = useProgressiveSearch()
  const { preferBestSource } = useProgressivePrefer()

  // 组合加载状态 - 初始就是 loading 状态
  const [loading, setLoading] = useState(true)
  const [loadingStage, setLoadingStage] = useState<
    'searching' | 'preferring' | 'fetching' | 'ready'
  >('searching')
  const [loadingMessage, setLoadingMessage] = useState('正在初始化...')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [stageDetail, setStageDetail] = useState('')
  const [estimatedTime, setEstimatedTime] = useState<number>()

  // 进度状态更新函数
  const updateProgressState = (state: any) => {
    setLoadingStage(state.stage as any)
    setLoadingMessage(state.message)
    setLoadingProgress(state.progress)
    setStageDetail(state.detail)
    setEstimatedTime(state.estimatedTime)
  }
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<SearchResult | null>(null)

  // 收藏状态
  const [favorited, setFavorited] = useState(false)

  // 跳过片头片尾配置
  const [skipConfig, setSkipConfig] = useState<{
    enable: boolean
    intro_time: number
    outro_time: number
  }>({
    enable: false,
    intro_time: 0,
    outro_time: 0,
  })
  const skipConfigRef = useRef(skipConfig)
  useEffect(() => {
    skipConfigRef.current = skipConfig
  }, [
    skipConfig,
    skipConfig.enable,
    skipConfig.intro_time,
    skipConfig.outro_time,
  ])

  // 跳过检查的时间间隔控制
  const lastSkipCheckRef = useRef(0)

  // 去广告开关（从 localStorage 继承，默认 true）
  const [blockAdEnabled, setBlockAdEnabled] = useState<boolean>(true)
  const blockAdEnabledRef = useRef(blockAdEnabled)
  useEffect(() => {
    blockAdEnabledRef.current = blockAdEnabled
  }, [blockAdEnabled])

  // 视频基本信息
  const [videoTitle, setVideoTitle] = useState(searchParams.get('title') || '')
  const [videoYear, setVideoYear] = useState(searchParams.get('year') || '')
  const [videoCover, setVideoCover] = useState('')
  // 当前源和ID
  const [currentSource, setCurrentSource] = useState(
    searchParams.get('source') || '',
  )
  const [currentId, setCurrentId] = useState(searchParams.get('id') || '')

  // 搜索所需信息
  const [searchTitle] = useState(searchParams.get('stitle') || '')

  // 是否需要优选
  const [needPrefer, setNeedPrefer] = useState(
    searchParams.get('prefer') === 'true',
  )
  const needPreferRef = useRef(needPrefer)
  useEffect(() => {
    needPreferRef.current = needPrefer
  }, [needPrefer])
  // 集数相关
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0)

  const currentSourceRef = useRef(currentSource)
  const currentIdRef = useRef(currentId)
  const videoTitleRef = useRef(videoTitle)
  const videoYearRef = useRef(videoYear)
  const detailRef = useRef<SearchResult | null>(detail)
  const currentEpisodeIndexRef = useRef(currentEpisodeIndex)

  // 同步最新值到 refs
  useEffect(() => {
    currentSourceRef.current = currentSource
    currentIdRef.current = currentId
    detailRef.current = detail
    currentEpisodeIndexRef.current = currentEpisodeIndex
    videoTitleRef.current = videoTitle
    videoYearRef.current = videoYear
  }, [
    currentSource,
    currentId,
    detail,
    currentEpisodeIndex,
    videoTitle,
    videoYear,
  ])

  // 视频播放地址
  const [videoUrl, setVideoUrl] = useState('')

  // 总集数
  const totalEpisodes = detail?.episodes?.length || 0

  // 用于记录是否需要在播放器 ready 后跳转到指定进度
  const resumeTimeRef = useRef<number | null>(null)
  // 上次使用的音量，默认 0.7
  const lastVolumeRef = useRef<number>(0.7)
  // 上次使用的播放速率，默认 1.0
  const lastPlaybackRateRef = useRef<number>(1.0)
  const artPlayerRef = useRef<any>(null)
  const lastSaveTimeRef = useRef<number>(0)

  // 保存播放进度
  const saveCurrentPlayProgress = async () => {
    if (
      !artPlayerRef.current
      || !currentSourceRef.current
      || !currentIdRef.current
      || !videoTitleRef.current
      || !detailRef.current?.source_name
    ) {
      return
    }

    const player = artPlayerRef.current
    const currentTime = player.currentTime || 0
    const duration = player.duration || 0

    // 如果播放时间太短（少于5秒）或者视频时长无效，不保存
    if (currentTime < 1 || !duration) {
      return
    }

    try {
      await savePlayRecord(currentSourceRef.current, currentIdRef.current, {
        title: videoTitleRef.current,
        source_name: detailRef.current?.source_name || '',
        year: detailRef.current?.year,
        cover: detailRef.current?.poster || '',
        index: currentEpisodeIndexRef.current + 1, // 转换为1基索引
        total_episodes: detailRef.current?.episodes?.length || 1,
        play_time: Math.floor(currentTime),
        total_time: Math.floor(duration),
        save_time: Date.now(),
        search_title: searchTitle,
      })

      lastSaveTimeRef.current = Date.now()
    }
    catch (err) {
      console.error('保存播放进度失败:', err)
    }
  }
  // 换源相关状态
  const [availableSources, setAvailableSources] = useState<SearchResult[]>([])
  const [sourceSearchLoading] = useState(false)
  const [sourceSearchError] = useState<string | null>(null)

  // 优选和测速开关
  const [optimizationEnabled, setOptimizationEnabled] = useState<boolean>(true)

  // 保存优选时的测速结果，避免EpisodeSelector重复测速
  const [precomputedVideoInfo] = useState<
    Map<string, { quality: string, loadSpeed: string, pingTime: number }>
  >(new Map())

  // 折叠状态（仅在 lg 及以上屏幕有效）
  const [isEpisodeSelectorCollapsed, setIsEpisodeSelectorCollapsed]
    = useState(false)

  // 换源加载状态 - 初始不需要，只在换源时使用
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoLoadingStage, setVideoLoadingStage] = useState<
    'initing' | 'sourceChanging'
  >('initing')

  // 切换集数加载状态
  const [isEpisodeChanging, setIsEpisodeChanging] = useState(false)

  // 播放进度保存相关
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const artRef = useRef<HTMLDivElement | null>(null)

  // -----------------------------------------------------------------------------
  // 工具函数（Utils）
  // -----------------------------------------------------------------------------

  // 优选进度状态更新函数
  const updatePreferProgressState = (state: any) => {
    setLoadingStage('preferring')
    setLoadingMessage(state.message)
    setLoadingProgress(state.progress)
    setStageDetail(state.detail)
    setEstimatedTime(state.estimatedTime)
  }

  // 更新视频地址
  const updateVideoUrl = (
    detailData: SearchResult | null,
    episodeIndex: number,
  ) => {
    if (
      !detailData
      || !detailData.episodes
      || episodeIndex >= (detailData.episodes?.length || 0)
    ) {
      setVideoUrl('')
      return
    }
    const newUrl = detailData?.episodes[episodeIndex] || ''
    if (newUrl !== videoUrl) {
      setVideoUrl(newUrl)
    }
  }

  const ensureVideoSource = (video: HTMLVideoElement | null, url: string) => {
    if (!video || !url)
      return
    const sources = Array.from(video.getElementsByTagName('source'))
    const existed = sources.some(s => s.src === url)
    if (!existed) {
      // 移除旧的 source，保持唯一
      sources.forEach(s => s.remove())
      const sourceEl = document.createElement('source')
      sourceEl.src = url
      video.appendChild(sourceEl)
    }

    // 始终允许远程播放（AirPlay / Cast）
    video.disableRemotePlayback = false
    // 如果曾经有禁用属性，移除之
    if (video.hasAttribute('disableRemotePlayback')) {
      video.removeAttribute('disableRemotePlayback')
    }
  }

  // 去广告相关函数
  function filterAdsFromM3U8(m3u8Content: string): string {
    if (!m3u8Content)
      return ''

    // 按行分割M3U8内容
    const lines = m3u8Content.split('\n')
    const filteredLines = []

    for (let i = 0; i < lines?.length; i++) {
      const line = lines[i]

      // 只过滤#EXT-X-DISCONTINUITY标识
      if (!line.includes('#EXT-X-DISCONTINUITY')) {
        filteredLines.push(line)
      }
    }

    return filteredLines.join('\n')
  }

  // 跳过片头片尾配置相关函数
  const handleSkipConfigChange = async (newConfig: {
    enable: boolean
    intro_time: number
    outro_time: number
  }) => {
    if (!currentSourceRef.current || !currentIdRef.current)
      return

    try {
      setSkipConfig(newConfig)
      if (!newConfig.enable && !newConfig.intro_time && !newConfig.outro_time) {
        await deleteSkipConfig(currentSourceRef.current, currentIdRef.current)
        artPlayerRef.current.setting.update({
          name: '跳过片头片尾',
          html: '跳过片头片尾',
          switch: skipConfigRef.current.enable,
          onSwitch(item: any) {
            const newConfig = {
              ...skipConfigRef.current,
              enable: !item.switch,
            }
            handleSkipConfigChange(newConfig)
            return !item.switch
          },
        })
        artPlayerRef.current.setting.update({
          name: '设置片头',
          html: '设置片头',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L17 12" stroke="#ffffff" stroke-width="2"/><path d="M17 6L17 18" stroke="#ffffff" stroke-width="2"/></svg>',
          tooltip:
            skipConfigRef.current.intro_time === 0
              ? '设置片头时间'
              : `${formatTime(skipConfigRef.current.intro_time)}`,
          onClick() {
            const currentTime = artPlayerRef.current?.currentTime || 0
            if (currentTime > 0) {
              const newConfig = {
                ...skipConfigRef.current,
                intro_time: currentTime,
              }
              handleSkipConfigChange(newConfig)
              return `${formatTime(currentTime)}`
            }
          },
        })
        artPlayerRef.current.setting.update({
          name: '设置片尾',
          html: '设置片尾',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 6L7 18" stroke="#ffffff" stroke-width="2"/><path d="M7 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
          tooltip:
            skipConfigRef.current.outro_time >= 0
              ? '设置片尾时间'
              : `-${formatTime(-skipConfigRef.current.outro_time)}`,
          onClick() {
            const outroTime
              = -(
                artPlayerRef.current?.duration
                - artPlayerRef.current?.currentTime
              ) || 0
            if (outroTime < 0) {
              const newConfig = {
                ...skipConfigRef.current,
                outro_time: outroTime,
              }
              handleSkipConfigChange(newConfig)
              return `-${formatTime(-outroTime)}`
            }
          },
        })
      }
      else {
        await saveSkipConfig(
          currentSourceRef.current,
          currentIdRef.current,
          newConfig,
        )
      }
    }
    catch (err) {
      console.error('保存跳过片头片尾配置失败:', err)
    }
  }

  const CustomHlsJsLoader = hlsRef.current
    ? class extends hlsRef.current.DefaultConfig.loader {
      constructor(config: any) {
        super(config)
        const load = this.load.bind(this)
        this.load = function (context: any, config: any, callbacks: any) {
        // 拦截manifest和level请求
          if (
            (context as any).type === 'manifest'
            || (context as any).type === 'level'
          ) {
            const onSuccess = callbacks.onSuccess
            callbacks.onSuccess = function (
              response: any,
              stats: any,
              context: any,
            ) {
            // 如果是m3u8文件，处理内容以移除广告分段
              if (response.data && typeof response.data === 'string') {
              // 过滤掉广告段 - 实现更精确的广告过滤逻辑
                response.data = filterAdsFromM3U8(response.data)
              }
              return onSuccess(response, stats, context, null)
            }
          }
          // 执行原始load方法
          load(context, config, callbacks)
        }
      }
    } : null

  // 当集数索引变化时自动更新视频地址
  useEffect(() => {
    updateVideoUrl(detail, currentEpisodeIndex)
  }, [detail, currentEpisodeIndex])

  // 从 localStorage 初始化状态
  useEffect(() => {
    // 初始化去广告开关
    const blockAdValue = localStorage.getItem('enable_blockad')
    if (blockAdValue !== null) {
      setBlockAdEnabled(blockAdValue === 'true')
    }

    // 初始化优选开关
    const optimizationValue = localStorage.getItem('enableOptimization')
    if (optimizationValue !== null) {
      try {
        setOptimizationEnabled(JSON.parse(optimizationValue))
      }
      catch {
        /* ignore */
      }
    }
  }, [])

  // 进入页面时直接获取全部源信息
  useEffect(() => {
    const initAll = async () => {
      if (!currentSource && !currentId && !videoTitle && !searchTitle) {
        setError('缺少必要参数')
        setLoading(false)
        return
      }

      let sourcesInfo: SearchResult[] = []
      let detailData: SearchResult

      try {
        if (currentSource && currentId) {
          // 页面刷新时：先获取当前视频的详细信息，然后搜索相同视频的其他源
          try {
            // 先获取当前视频的详细信息
            detailData = await fetchVideoDetails(
              currentSource,
              currentId,
              updateProgressState,
            )

            // 基于当前视频信息搜索所有源
            const searchQuery = detailData.title
            sourcesInfo = await searchSources(searchQuery, updateProgressState)

            if (sourcesInfo?.length === 0) {
              // 如果没找到其他源，至少保留当前源
              sourcesInfo = [detailData]
            }
            else {
              // 智能过滤：保留相同视频的源（标题相似、年份相同、集数相近）
              const filteredSources = sourcesInfo.filter((source) => {
                // 标准化标题进行比较（移除多余空格、特殊字符等）
                const normalizeTitle = (title: string) => {
                  return title.trim()
                    .replace(/\s+/g, ' ') // 多个空格替换为单个
                    .replace(/[［[(].*?[）\]］]/g, '') // 移除括号内容（通常是季数、年份等）
                    .toLowerCase()
                }

                const titleMatch = normalizeTitle(source.title) === normalizeTitle(detailData.title)
                const yearMatch = source.year === detailData.year

                // 集数匹配：允许一定的容差（±5集以内），适应不同版本
                const sourceEpisodes = source.episodes?.length || 0
                const detailEpisodes = detailData.episodes?.length || 0
                const episodesMatch = Math.abs(sourceEpisodes - detailEpisodes) <= 5

                return titleMatch && yearMatch && episodesMatch
              })

              // 如果过滤后结果为空或太少，使用更宽松的匹配策略
              if (filteredSources?.length === 0) {
                // 宽松匹配：只匹配标题相似度（忽略年份和集数差异）
                const looselyFilteredSources = sourcesInfo.filter((source) => {
                  const normalizeTitle = (title: string) => {
                    return title.trim()
                      .replace(/\s+/g, ' ')
                      .replace(/[［[(].*?[）\]］]/g, '')
                      .toLowerCase()
                  }

                  const titleMatch = normalizeTitle(source.title) === normalizeTitle(detailData.title)
                  return titleMatch
                })

                if (looselyFilteredSources?.length > 0) {
                  sourcesInfo = looselyFilteredSources
                }
                // 如果宽松匹配也没有结果，保留原始搜索结果
              }
              else {
                sourcesInfo = filteredSources
              }

              // 确保当前源在结果中
              const hasCurrentSource = sourcesInfo.some(
                source =>
                  source.source === currentSource && source.id === currentId,
              )

              if (!hasCurrentSource) {
                // 如果过滤后没有当前源，添加当前源到结果开头
                sourcesInfo = [
                  detailData,
                  ...sourcesInfo.filter(
                    source =>
                      !(
                        source.source === currentSource
                        && source.id === currentId
                      ),
                  ),
                ]
              }
              else {
                // 更新当前源为最新的详细信息
                const updatedCurrentSource = sourcesInfo.find(
                  source =>
                    source.source === currentSource && source.id === currentId,
                )
                if (updatedCurrentSource) {
                  detailData = updatedCurrentSource
                }
              }
            }
          }
          catch {
            // 如果获取当前视频详情失败，fallback到搜索
            sourcesInfo = await searchSources(
              searchTitle || videoTitle,
              updateProgressState,
            )

            if (sourcesInfo?.length === 0) {
              setError('未找到匹配结果')
              setLoading(false)
              return
            }

            // 查找当前指定的源
            const currentSourceDetail = sourcesInfo.find(
              source =>
                source.source === currentSource && source.id === currentId,
            )

            if (currentSourceDetail) {
              detailData = currentSourceDetail
            }
            else {
              detailData = sourcesInfo[0]
              setCurrentSource(detailData.source)
              setCurrentId(detailData.id)
            }
          }
        }
        else {
          // 正常搜索流程
          sourcesInfo = await searchSources(
            searchTitle || videoTitle,
            updateProgressState,
          )

          if (sourcesInfo?.length === 0) {
            setError('未找到匹配结果')
            setLoading(false)
            return
          }

          // 如果需要优选且开启了优选开关
          if (
            optimizationEnabled
            && (!currentSource || !currentId || needPreferRef.current)
          ) {
            detailData = await preferBestSource(
              sourcesInfo,
              updatePreferProgressState,
            )
          }
          else {
            detailData = sourcesInfo[0]
          }
        }

        // 设置视频信息
        setNeedPrefer(false)
        setCurrentSource(detailData.source)
        setCurrentId(detailData.id)
        setVideoYear(detailData.year)
        setVideoTitle(detailData.title || videoTitleRef.current)
        setVideoCover(detailData.poster)
        setDetail(detailData)
        setAvailableSources(sourcesInfo)

        if (detailData.episodes && currentEpisodeIndex >= detailData?.episodes?.length) {
          setCurrentEpisodeIndex(0)
        }

        // 规范URL参数
        if (typeof window !== 'undefined') {
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.set('source', detailData.source)
          newUrl.searchParams.set('id', detailData.id)
          newUrl.searchParams.set('year', detailData.year)
          newUrl.searchParams.set('title', detailData.title)
          newUrl.searchParams.delete('prefer')
          window.history.replaceState({}, '', newUrl.toString())
        }

        // 标记准备就绪
        markReady(updateProgressState)

        // 短暂延迟让用户看到完成状态
        setTimeout(() => {
          setLoading(false)
        }, 1500)
      }
      catch (err) {
        console.error('初始化播放页面失败:', err)
        setError(err instanceof Error ? err.message : '加载失败')
        setLoading(false)
      }
    }

    initAll()
  }, [])

  // 播放记录处理
  useEffect(() => {
    // 仅在初次挂载时检查播放记录
    const initFromHistory = async () => {
      if (!currentSource || !currentId)
        return

      try {
        const allRecords = await getAllPlayRecords()
        const key = generateStorageKey(currentSource, currentId)
        const record = allRecords[key]

        if (record) {
          const targetIndex = record.index - 1
          const targetTime = record.play_time

          // 更新当前选集索引
          if (targetIndex !== currentEpisodeIndex) {
            setCurrentEpisodeIndex(targetIndex)
          }

          // 保存待恢复的播放进度，待播放器就绪后跳转
          resumeTimeRef.current = targetTime
        }
      }
      catch (err) {
        console.error('读取播放记录失败:', err)
      }
    }

    initFromHistory()
  }, [])

  // 跳过片头片尾配置处理
  useEffect(() => {
    // 仅在初次挂载时检查跳过片头片尾配置
    const initSkipConfig = async () => {
      if (!currentSource || !currentId)
        return

      try {
        const config = await getSkipConfig(currentSource, currentId)
        if (config) {
          setSkipConfig(config)
        }
      }
      catch (err) {
        console.error('读取跳过片头片尾配置失败:', err)
      }
    }

    initSkipConfig()
  }, [])

  // 处理换源
  const handleSourceChange = async (
    newSource: string,
    newId: string,
    newTitle: string,
  ) => {
    try {
      // 显示换源加载状态
      setVideoLoadingStage('sourceChanging')
      setIsVideoLoading(true)

      // 记录当前播放进度（仅在同一集数切换时恢复）
      const currentPlayTime = artPlayerRef.current?.currentTime || 0

      // 清除前一个历史记录
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deletePlayRecord(
            currentSourceRef.current,
            currentIdRef.current,
          )
        }
        catch (err) {
          console.error('清除播放记录失败:', err)
        }
      }

      // 清除并设置下一个跳过片头片尾配置
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deleteSkipConfig(
            currentSourceRef.current,
            currentIdRef.current,
          )
          await saveSkipConfig(newSource, newId, skipConfigRef.current)
        }
        catch (err) {
          console.error('清除跳过片头片尾配置失败:', err)
        }
      }

      const newDetail = availableSources.find(
        source => source.source === newSource && source.id === newId,
      )
      if (!newDetail) {
        setError('未找到匹配结果')
        return
      }

      // 尝试跳转到当前正在播放的集数
      let targetIndex = currentEpisodeIndex

      // 如果当前集数超出新源的范围，则跳转到第一集
      if (!newDetail.episodes || targetIndex >= (newDetail.episodes?.length || 0)) {
        targetIndex = 0
      }

      // 如果仍然是同一集数且播放进度有效，则在播放器就绪后恢复到原始进度
      if (targetIndex !== currentEpisodeIndex) {
        resumeTimeRef.current = 0
      }
      else if (
        (!resumeTimeRef.current || resumeTimeRef.current === 0)
        && currentPlayTime > 1
      ) {
        resumeTimeRef.current = currentPlayTime
      }

      // 更新URL参数（不刷新页面）
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('source', newSource)
        newUrl.searchParams.set('id', newId)
        newUrl.searchParams.set('year', newDetail.year)
        window.history.replaceState({}, '', newUrl.toString())
      }

      setVideoTitle(newDetail.title || newTitle)
      setVideoYear(newDetail.year)
      setVideoCover(newDetail.poster)
      setCurrentSource(newSource)
      setCurrentId(newId)
      setDetail(newDetail)
      setCurrentEpisodeIndex(targetIndex)
    }
    catch (err) {
      // 隐藏换源加载状态
      setIsVideoLoading(false)
      setError(err instanceof Error ? err.message : '换源失败')
    }
  }

  // ---------------------------------------------------------------------------
  // 集数切换相关函数 - 定义在使用之前
  // ---------------------------------------------------------------------------
  const handlePreviousEpisode = () => {
    const d = detailRef.current
    const idx = currentEpisodeIndexRef.current
    if (d && d.episodes && idx > 0) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress()
      }
      setCurrentEpisodeIndex(idx - 1)
    }
  }

  const handleNextEpisode = () => {
    const d = detailRef.current
    const idx = currentEpisodeIndexRef.current
    if (d && d.episodes && idx < (d.episodes?.length || 0) - 1) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress()
      }
      setCurrentEpisodeIndex(idx + 1)
    }
  }

  // 处理全局快捷键
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // 忽略输入框中的按键事件
    if (
      (e.target as HTMLElement).tagName === 'INPUT'
      || (e.target as HTMLElement).tagName === 'TEXTAREA'
    ) {
      return
    }

    // Alt + 左箭头 = 上一集
    if (e.altKey && e.key === 'ArrowLeft') {
      if (detailRef.current && currentEpisodeIndexRef.current > 0) {
        handlePreviousEpisode()
        e.preventDefault()
      }
    }

    // Alt + 右箭头 = 下一集
    if (e.altKey && e.key === 'ArrowRight') {
      const d = detailRef.current
      const idx = currentEpisodeIndexRef.current
      if (d && idx < (d.episodes?.length || 0) - 1) {
        handleNextEpisode()
        e.preventDefault()
      }
    }

    // 左箭头 = 快退
    if (!e.altKey && e.key === 'ArrowLeft') {
      if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
        artPlayerRef.current.currentTime -= 10
        e.preventDefault()
      }
    }

    // 右箭头 = 快进
    if (!e.altKey && e.key === 'ArrowRight') {
      if (
        artPlayerRef.current
        && artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5
      ) {
        artPlayerRef.current.currentTime += 10
        e.preventDefault()
      }
    }

    // 上箭头 = 音量+
    if (e.key === 'ArrowUp') {
      if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
        artPlayerRef.current.volume
          = Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100,
        )}`
        e.preventDefault()
      }
    }

    // 下箭头 = 音量-
    if (e.key === 'ArrowDown') {
      if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
        artPlayerRef.current.volume
          = Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100,
        )}`
        e.preventDefault()
      }
    }

    // 空格 = 播放/暂停
    if (e.key === ' ') {
      if (artPlayerRef.current) {
        artPlayerRef.current.toggle()
        e.preventDefault()
      }
    }

    // f 键 = 切换全屏
    if (e.key === 'f' || e.key === 'F') {
      if (artPlayerRef.current) {
        artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen
        e.preventDefault()
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // 集数切换
  // ---------------------------------------------------------------------------
  // 处理集数切换
  const handleEpisodeChange = (episodeNumber: number) => {
    if (episodeNumber >= 0 && episodeNumber < totalEpisodes) {
      // 显示切换集数加载状态
      setIsEpisodeChanging(true)

      // 在更换集数前保存当前播放进度
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress()
      }
      setCurrentEpisodeIndex(episodeNumber)

      // 确保切换集数后自动播放
      setTimeout(() => {
        if (artPlayerRef.current && artPlayerRef.current.paused) {
          artPlayerRef.current.play()
        }
        // 延迟隐藏切换集数加载状态，让用户看到反馈
        setTimeout(() => {
          setIsEpisodeChanging(false)
        }, 500)
      }, 100)
    }
  }

  // ---------------------------------------------------------------------------
  // 键盘快捷键
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 播放记录相关
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // 页面即将卸载时保存播放进度
    const handleBeforeUnload = () => {
      saveCurrentPlayProgress()
    }

    // 页面可见性变化时保存播放进度
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPlayProgress()
      }
    }

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // 清理事件监听器
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentEpisodeIndex, detail, artPlayerRef.current])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // 收藏相关
  // ---------------------------------------------------------------------------
  // 每当 source 或 id 变化时检查收藏状态
  useEffect(() => {
    if (!currentSource || !currentId)
      return;
    (async () => {
      try {
        const fav = await isFavorited(currentSource, currentId)
        setFavorited(fav)
      }
      catch (err) {
        console.error('检查收藏状态失败:', err)
      }
    })()
  }, [currentSource, currentId])

  // 监听收藏数据更新事件
  useEffect(() => {
    if (!currentSource || !currentId)
      return

    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (favorites: Record<string, any>) => {
        const key = generateStorageKey(currentSource, currentId)
        const isFav = !!favorites[key]
        setFavorited(isFav)
      },
    )

    return unsubscribe
  }, [currentSource, currentId])

  // 切换收藏
  const handleToggleFavorite = async () => {
    if (
      !videoTitleRef.current
      || !detailRef.current
      || !currentSourceRef.current
      || !currentIdRef.current
    ) {
      return
    }

    try {
      if (favorited) {
        // 如果已收藏，删除收藏
        await deleteFavorite(currentSourceRef.current, currentIdRef.current)
        setFavorited(false)
      }
      else {
        // 如果未收藏，添加收藏
        await saveFavorite(currentSourceRef.current, currentIdRef.current, {
          title: videoTitleRef.current,
          source_name: detailRef.current?.source_name || '',
          year: detailRef.current?.year,
          cover: detailRef.current?.poster || '',
          total_episodes: detailRef.current?.episodes?.length || 1,
          save_time: Date.now(),
          search_title: searchTitle,
        })
        setFavorited(true)
      }
    }
    catch (err) {
      console.error('切换收藏失败:', err)
    }
  }

  useEffect(() => {
    if (
      !artplayerRef.current
      || !hlsRef.current
      || !videoUrl
      || loading
      || currentEpisodeIndex === null
      || !artRef.current
    ) {
      return
    }

    // 确保选集索引有效
    if (
      !detail
      || !detail.episodes
      || currentEpisodeIndex >= (detail.episodes?.length || 0)
      || currentEpisodeIndex < 0
    ) {
      setError(`选集索引无效，当前共 ${totalEpisodes} 集`)
      return
    }

    if (!videoUrl) {
      setError('视频地址无效')
      return
    }

    // 检测是否为WebKit浏览器
    const isWebkit
      = typeof window !== 'undefined'
        && typeof (window as any).webkitConvertPointFromNodeToPage === 'function'

    // 非WebKit浏览器且播放器已存在，使用switch方法切换
    if (!isWebkit && artPlayerRef.current) {
      artPlayerRef.current.switch = videoUrl
      artPlayerRef.current.title = `${videoTitle} - 第${currentEpisodeIndex + 1
      }集`
      artPlayerRef.current.poster = processImageUrlWithFallback(videoCover, videoCover)
      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl,
        )
        // 确保切换后自动播放
        setTimeout(() => {
          if (artPlayerRef.current && artPlayerRef.current.paused) {
            artPlayerRef.current.play()
          }
          // 隐藏切换集数加载状态
          setIsEpisodeChanging(false)
        }, 200)
      }
      return
    }

    // WebKit浏览器或首次创建：销毁之前的播放器实例并创建新的
    if (artPlayerRef.current) {
      if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
        artPlayerRef.current.video.hls.destroy()
      }
      // 销毁播放器实例
      artPlayerRef.current.destroy()
      artPlayerRef.current = null
    }

    try {
      // 创建新的播放器实例
      artplayerRef.current.PLAYBACK_RATE = [3, 2, 1.5, 1.25, 1, 0.75, 0.5]
      artplayerRef.current.USE_RAF = true

      artPlayerRef.current = new artplayerRef.current({
        container: artRef.current,
        url: videoUrl,
        poster: processImageUrlWithFallback(videoCover, videoCover),
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        theme: '#22c55e',
        lang: 'zh-cn',
        hotkey: false,
        fastForward: true,
        autoOrientation: true,
        lock: true,
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        // HLS 支持配置
        customType: {
          m3u8(video: HTMLVideoElement, url: string) {
            if (!hlsRef.current) {
              console.error('HLS.js 未加载')
              return
            }

            if (video.hls) {
              video.hls.destroy()
            }

            const hls = new hlsRef.current({
              debug: false, // 关闭日志
              enableWorker: true, // WebWorker 解码，降低主线程压力
              lowLatencyMode: true, // 开启低延迟 LL-HLS

              /* 缓冲/内存相关 */
              maxBufferLength: 30, // 前向缓冲最大 30s，过大容易导致高延迟
              backBufferLength: 30, // 仅保留 30s 已播放内容，避免内存占用
              maxBufferSize: 60 * 1000 * 1000, // 约 60MB，超出后触发清理

              /* 自定义loader */
              loader: blockAdEnabledRef.current && CustomHlsJsLoader
                ? CustomHlsJsLoader
                : hlsRef.current.DefaultConfig.loader,
            })

            hls.loadSource(url)
            hls.attachMedia(video)
            video.hls = hls

            ensureVideoSource(video, url)

            hls.on(hlsRef.current.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case hlsRef.current.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad()
                    break
                  case hlsRef.current.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError()
                    break
                  default:
                    hls.destroy()
                    break
                }
              }
            })
          },
        },
        icons: {
          loading: `<div class="dot-spinner">
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
    <div class="dot-spinner__dot"></div>
</div>`,
        },
        settings: [
          {
            name: '去广告',
            html: '去广告',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Huge Icons by Hugeicons - undefined --><g fill="none" stroke="currentColor" strokeLinecap="round" stroke-width="1.5"><path d="M5.506 15.992L8.03 9.029c.46-.967 1.162-1.766 1.967.151c.743 1.77 1.85 5.01 2.505 6.815m-5.85-2.993h4.669"/><path d="M3.464 4.318C2 5.636 2 7.758 2 12s0 6.364 1.464 7.682C4.93 21 7.286 21 12 21s7.071 0 8.535-1.318S22 16.242 22 12s0-6.364-1.465-7.682C19.072 3 16.714 3 12 3S4.929 3 3.464 4.318"/><path d="M18.484 8.987v2.995m0 0v3.943m0-3.943h-2.018c-.24 0-.478.044-.702.131c-1.693.657-1.693 3.1 0 3.757c.225.087.462.131.702.131h2.018"/></g></svg>',
            switch: blockAdEnabled,
            onSwitch: (item: any) => {
              const newVal = !item.switch
              try {
                localStorage.setItem('enable_blockad', String(newVal))
                if (artPlayerRef.current) {
                  resumeTimeRef.current = artPlayerRef.current.currentTime
                  if (
                    artPlayerRef.current.video
                    && artPlayerRef.current.video.hls
                  ) {
                    artPlayerRef.current.video.hls.destroy()
                  }
                  artPlayerRef.current.destroy()
                  artPlayerRef.current = null
                }
                setBlockAdEnabled(newVal)
              }
              catch {
                // ignore
              }
              return newVal
            },
          },
          {
            name: '跳过片头片尾',
            html: '跳过片头片尾',
            switch: skipConfigRef.current.enable,
            onSwitch(item: any) {
              const newConfig = {
                ...skipConfigRef.current,
                enable: !item.switch,
              }
              handleSkipConfigChange(newConfig)
              return !item.switch
            },
          },
          {
            html: '删除跳过配置',
            onClick() {
              handleSkipConfigChange({
                enable: false,
                intro_time: 0,
                outro_time: 0,
              })
              return ''
            },
          },
          {
            name: '设置片头',
            html: '设置片头',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L17 12" stroke="#ffffff" stroke-width="2"/><path d="M17 6L17 18" stroke="#ffffff" stroke-width="2"/></svg>',
            tooltip:
              skipConfigRef.current.intro_time === 0
                ? '设置片头时间'
                : `${formatTime(skipConfigRef.current.intro_time)}`,
            onClick() {
              const currentTime = artPlayerRef.current?.currentTime || 0
              if (currentTime > 0) {
                const newConfig = {
                  ...skipConfigRef.current,
                  intro_time: currentTime,
                }
                handleSkipConfigChange(newConfig)
                return `${formatTime(currentTime)}`
              }
            },
          },
          {
            name: '设置片尾',
            html: '设置片尾',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 6L7 18" stroke="#ffffff" stroke-width="2"/><path d="M7 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
            tooltip:
              skipConfigRef.current.outro_time >= 0
                ? '设置片尾时间'
                : `-${formatTime(-skipConfigRef.current.outro_time)}`,
            onClick() {
              const outroTime
                = -(
                  artPlayerRef.current?.duration
                  - artPlayerRef.current?.currentTime
                ) || 0
              if (outroTime < 0) {
                const newConfig = {
                  ...skipConfigRef.current,
                  outro_time: outroTime,
                }
                handleSkipConfigChange(newConfig)
                return `-${formatTime(-outroTime)}`
              }
            },
          },
        ],
        // 控制栏配置
        controls: [
          {
            position: 'left',
            index: 13,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
            tooltip: '播放下一集',
            click() {
              handleNextEpisode()
            },
          },
        ],
      })

      // 监听播放器事件
      artPlayerRef.current.on('ready', () => {
        setError(null)

        // 注入自定义样式来覆盖设置按钮颜色
        const styleId = 'artplayer-custom-theme'
        let styleElement = document.getElementById(styleId)

        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = styleId
          styleElement.textContent = `
            .art-setting-item .art-icon-switchOn svg path {
              fill: #22c55e !important;
            }

            .art-setting-item .art-icon-switchOff svg path {
              fill: #94a3b8 !important;
            }

            .art-setting-item:hover .art-setting-item-left-text {
              color: #22c55e !important;
            }

            .art-setting-item.active .art-setting-item-left-text {
              color: #22c55e !important;
            }
          `
          document.head.appendChild(styleElement)
        }
      })

      artPlayerRef.current.on('video:volumechange', () => {
        lastVolumeRef.current = artPlayerRef.current.volume
      })
      artPlayerRef.current.on('video:ratechange', () => {
        lastPlaybackRateRef.current = artPlayerRef.current.playbackRate
      })

      // 监听视频可播放事件，这时恢复播放进度更可靠
      artPlayerRef.current.on('video:canplay', () => {
        // 若存在需要恢复的播放进度，则跳转
        if (resumeTimeRef.current && resumeTimeRef.current > 0) {
          try {
            const duration = artPlayerRef.current.duration || 0
            let target = resumeTimeRef.current
            if (duration && target >= duration - 2) {
              target = Math.max(0, duration - 5)
            }
            artPlayerRef.current.currentTime = target
          }
          catch (err) {
            console.warn('恢复播放进度失败:', err)
          }
        }
        resumeTimeRef.current = null

        setTimeout(() => {
          if (
            Math.abs(artPlayerRef.current.volume - lastVolumeRef.current) > 0.01
          ) {
            artPlayerRef.current.volume = lastVolumeRef.current
          }
          if (
            Math.abs(
              artPlayerRef.current.playbackRate - lastPlaybackRateRef.current,
            ) > 0.01
            && isWebkit
          ) {
            artPlayerRef.current.playbackRate = lastPlaybackRateRef.current
          }
          artPlayerRef.current.notice.show = ''

          // 确保新集数加载完成后自动播放
          if (artPlayerRef.current && artPlayerRef.current.paused) {
            artPlayerRef.current.play().catch((err: any) => {
              console.warn('自动播放失败:', err)
            })
          }
        }, 100)

        // 隐藏换源加载状态和切换集数加载状态
        setIsVideoLoading(false)
        setIsEpisodeChanging(false)
      })

    
      // 监听视频时间更新事件，实现跳过片头片尾
      artPlayerRef.current.on('video:timeupdate', () => {
        if (!skipConfigRef.current.enable)
          return

        const currentTime = artPlayerRef.current.currentTime || 0
        const duration = artPlayerRef.current.duration || 0
        const now = Date.now()

        // 限制跳过检查频率为1.5秒一次
        if (now - lastSkipCheckRef.current < 1500)
          return
        lastSkipCheckRef.current = now

        // 跳过片头
        if (
          skipConfigRef.current.intro_time > 0
          && currentTime < skipConfigRef.current.intro_time
        ) {
          artPlayerRef.current.currentTime = skipConfigRef.current.intro_time
          artPlayerRef.current.notice.show = `已跳过片头 (${formatTime(
            skipConfigRef.current.intro_time,
          )})`
        }

        // 跳过片尾
        if (
          skipConfigRef.current.outro_time < 0
          && duration > 0
          && currentTime
          > artPlayerRef.current.duration + skipConfigRef.current.outro_time
        ) {
          if (
            currentEpisodeIndexRef.current
            < (detailRef.current?.episodes?.length || 1) - 1
          ) {
            handleNextEpisode()
          }
          else {
            artPlayerRef.current.pause()
          }
          artPlayerRef.current.notice.show = `已跳过片尾 (${formatTime(
            skipConfigRef.current.outro_time,
          )})`
        }
      })

      artPlayerRef.current.on('error', (err: any) => {
        console.error('播放器错误:', err)
        if (artPlayerRef.current.currentTime > 0) {
          // 这里可以添加错误处理逻辑
        }
      })

      // 监听视频播放结束事件，自动播放下一集
      artPlayerRef.current.on('video:ended', () => {
        const d = detailRef.current
        const idx = currentEpisodeIndexRef.current
        if (d && d.episodes && idx < (d.episodes?.length || 0) - 1) {
          setTimeout(() => {
            setCurrentEpisodeIndex(idx + 1)
          }, 1000)
        }
      })

      artPlayerRef.current.on('video:timeupdate', () => {
        const now = Date.now()
        let interval = 5000
        if (process.env.NEXT_PUBLIC_STORAGE_TYPE === 'd1') {
          interval = 10000
        }
        if (process.env.NEXT_PUBLIC_STORAGE_TYPE === 'upstash') {
          interval = 20000
        }
        if (now - lastSaveTimeRef.current > interval) {
          saveCurrentPlayProgress()
          lastSaveTimeRef.current = now
        }
      })

      artPlayerRef.current.on('pause', () => {
        saveCurrentPlayProgress()
      })

      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl,
        )
      }
    }
    catch (err) {
      console.error('创建播放器失败:', err)
      setError('播放器初始化失败')
    }

    // 清理函数：在组件卸载时移除自定义样式
    return () => {
      const styleId = 'artplayer-custom-theme'
      const styleElement = document.getElementById(styleId)
      if (styleElement) {
        styleElement.remove()
      }
    }
  }, [artplayerRef.current, hlsRef.current, videoUrl, loading, blockAdEnabled])

  // 当组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <PageLayout activePath="/play">
        <PlayLoadingState
          loadingStage={loadingStage}
          loadingMessage={loadingMessage}
          progress={loadingProgress}
          stageDetail={stageDetail}
          estimatedTime={estimatedTime}
        />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout activePath="/play">
        <PlayErrorState error={error} />
      </PageLayout>
    )
  }

  // 只有在 loading 为 false 且有 detail 数据时才显示播放器内容
  if (!detail) {
    return (
      <PageLayout activePath="/play">
        <PlayLoadingState
          loadingStage="searching"
          loadingMessage="正在加载视频信息..."
          progress={0}
          stageDetail="请稍候..."
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout activePath="/play">
      <div className="flex flex-col gap-3 py-4 px-5 lg:px-[3rem] 2xl:px-20 pb-20 md:pb-8">
        {/* 第一行：影片标题 */}
        <div className="flex items-center gap-1 py-1">
          <BackButton />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {videoTitle || '影片标题'}
            {totalEpisodes > 1 && (
              <span className="text-gray-500 dark:text-gray-400">
                {` > 第 ${currentEpisodeIndex + 1} 集`}
              </span>
            )}
          </h1>
          <div className="ml-2 mt-1 flex-shrink-0">
            <FavoriteButton
              favorited={favorited}
              onToggle={handleToggleFavorite}
              size="md"
            />
          </div>
        </div>
        {/* 第二行：播放器和选集 */}
        <div className="space-y-2">
          <div
            className={`relative grid gap-4 md:h-[400px] lg:h-[500px] xl:h-[650px] 2xl:h-[750px] transition-all duration-300 ease-in-out ${isEpisodeSelectorCollapsed
              ? 'grid-cols-1'
              : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {/* 播放器 */}
            <div
              className={`h-full transition-all duration-300 ease-in-out rounded-xl border border-white/0 dark:border-white/30 ${isEpisodeSelectorCollapsed
                ? 'col-span-1'
                : 'md:col-span-2 lg:col-span-3'
              }`}
            >
              <div className="relative w-full h-[300px] md:h-full">
                <div
                  ref={artRef}
                  className="bg-black w-full h-full rounded-xl overflow-hidden shadow-lg"
                >
                </div>
                {/* 折叠控制按钮 - 仅在 lg 及以上屏幕显示 */}
                <div className="hidden md:block absolute top-4 -right-3 z-[240]">
                  <button
                    onClick={() =>
                      setIsEpisodeSelectorCollapsed(!isEpisodeSelectorCollapsed)}
                    className="group relative w-6 h-6 rounded-full bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                    title={
                      isEpisodeSelectorCollapsed
                        ? '显示选集面板'
                        : '隐藏选集面板'
                    }
                  >
                    <svg
                      className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isEpisodeSelectorCollapsed ? 'rotate-180' : 'rotate-0'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* 换源加载蒙层 */}
                <SourceLoadingOverlay
                  isLoading={isVideoLoading}
                  loadingStage={videoLoadingStage}
                />

                {/* 切换集数加载小指示器 */}
                {isEpisodeChanging && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[250] pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-full flex items-center gap-3 shadow-lg animate-pulse">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">正在切换集数...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 选集和换源 - 在移动端始终显示，在 lg 及以上可折叠 */}
            <div
              className={`h-150 md:h-full min-w-60 lg:h-full md:overflow-hidden transition-all duration-300 ease-in-out ${isEpisodeSelectorCollapsed
                ? 'md:col-span-1 md:hidden lg:opacity-0 lg:scale-95'
                : 'md:col-span-1 lg:opacity-100 lg:scale-100'
              }`}
            >
              <PlayPanel
                totalEpisodes={totalEpisodes}
                currentEpisode={currentEpisodeIndex + 1}
                onEpisodeChange={handleEpisodeChange}
                onSourceChange={handleSourceChange}
                currentSource={currentSource}
                currentId={currentId}
                videoTitle={searchTitle || videoTitle}
                availableSources={availableSources}
                sourceSearchLoading={sourceSearchLoading}
                sourceSearchError={sourceSearchError}
                precomputedVideoInfo={precomputedVideoInfo}
              />
            </div>
          </div>
        </div>

        {/* 详情展示 */}
        <PlayDetailInfo
          videoTitle={videoTitle}
          videoYear={videoYear}
          videoCover={videoCover}
          detail={detail}
        />
      </div>
    </PageLayout>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  )
}
