import type {
  Favorite,
} from '@/lib/db.client'
import type { SearchResult } from '@/lib/types'
import { Trash2 } from 'lucide-react'

import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import FavoriteButton from '@/components/FavoriteButton'
import { ImagePlaceholder } from '@/components/ImagePlaceholder'

import {
  deleteFavorite,
  deletePlayRecord,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client'
import { processImageUrl } from '@/lib/utils'

interface VideoCardProps {
  id?: string
  source?: string
  title?: string
  query?: string
  poster?: string
  episodes?: number
  source_name?: string
  progress?: number
  year?: string
  from: 'playrecord' | 'favorite' | 'search' | 'douban'
  currentEpisode?: number
  douban_id?: string
  onDelete?: () => void
  rate?: string
  items?: SearchResult[]
  type?: string
  // 新增显示控制参数
  showYear?: boolean
  showRank?: boolean
  showSource?: boolean
  showEpisodes?: boolean
  showRating?: boolean
  rankNumber?: number
}

export default function VideoCard({
  id,
  title = '',
  query = '',
  poster = '',
  episodes,
  source,
  source_name,
  progress = 0,
  year,
  from,
  currentEpisode,
  douban_id,
  onDelete,
  rate,
  items,
  type = '',
  // 新增参数，默认值
  showYear = true,
  showRank = false,
  showSource = true,
  showEpisodes = true,
  showRating = true,
  rankNumber,
}: VideoCardProps) {
  const [favorited, setFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isAggregate = from === 'search' && !!items?.length

  const aggregateData = useMemo(() => {
    if (!isAggregate || !items)
      return null
    const countMap = new Map<string | number, number>()
    const episodeCountMap = new Map<number, number>()
    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1)
      }
      const len = item.episodes?.length || 0
      if (len > 0) {
        episodeCountMap.set(len, (episodeCountMap.get(len) || 0) + 1)
      }
    })

    const getMostFrequent = <T extends string | number>(
      map: Map<T, number>,
    ) => {
      let maxCount = 0
      let result: T | undefined
      map.forEach((cnt, key) => {
        if (cnt > maxCount) {
          maxCount = cnt
          result = key
        }
      })
      return result
    }

    return {
      first: items[0],
      mostFrequentDoubanId: getMostFrequent(countMap),
      mostFrequentEpisodes: getMostFrequent(episodeCountMap) || 0,
    }
  }, [isAggregate, items])

  const actualTitle = aggregateData?.first.title ?? title
  const actualPoster = aggregateData?.first.poster ?? poster
  const actualSource = aggregateData?.first.source ?? source
  const actualId = aggregateData?.first.id ?? id
  const actualDoubanId = String(
    aggregateData?.mostFrequentDoubanId ?? douban_id,
  )
  const actualEpisodes
    = aggregateData?.mostFrequentEpisodes
      ?? (Array.isArray(episodes) ? episodes.length : episodes)
  const actualYear = aggregateData?.first.year ?? year
  const actualQuery = query || ''
  const actualSearchType = isAggregate
    ? aggregateData?.first.episodes?.length === 1
      ? 'movie'
      : 'tv'
    : type

  // 聚合模式下，从第一个项目中提取 source_name
  const fullActualSourceName = isAggregate
    ? aggregateData?.first.source_name
    : source_name
  const actualSourceName = fullActualSourceName?.split('资源').shift()

  // 重置图片错误状态
  useEffect(() => {
    setImageError(false)
  }, [actualPoster])

  // 获取收藏状态
  useEffect(() => {
    if (from === 'douban' || !actualSource || !actualId)
      return

    const fetchFavoriteStatus = async () => {
      try {
        const fav = await isFavorited(actualSource, actualId)
        setFavorited(fav)
      }
      catch {
        throw new Error('检查收藏状态失败')
      }
    }

    fetchFavoriteStatus()

    // 监听收藏状态更新事件
    const storageKey = generateStorageKey(actualSource, actualId)
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, Favorite>) => {
        // 检查当前项目是否在新的收藏列表中
        const isNowFavorited = !!newFavorites[storageKey]
        setFavorited(isNowFavorited)
      },
    )

    return unsubscribe
  }, [from, actualSource, actualId])

  const handleToggleFavorite = useCallback(
    async (_e: React.MouseEvent) => {
      if (from === 'douban' || !actualSource || !actualId)
        return
      try {
        if (favorited) {
          // 如果已收藏，删除收藏
          await deleteFavorite(actualSource, actualId)
          setFavorited(false)
        }
        else {
          // 如果未收藏，添加收藏
          await saveFavorite(actualSource, actualId, {
            title: actualTitle,
            source_name: actualSourceName || '',
            year: actualYear || '',
            cover: actualPoster,
            total_episodes: actualEpisodes ?? 1,
            save_time: Date.now(),
          })
          setFavorited(true)
        }
      }
      catch {
        throw new Error('切换收藏状态失败')
      }
    },
    [
      from,
      actualSource,
      actualId,
      actualTitle,
      actualSourceName,
      actualYear,
      actualPoster,
      actualEpisodes,
      favorited,
    ],
  )

  const handleDeleteRecord = useCallback(
    async (_e: React.MouseEvent) => {
      if (from !== 'playrecord' || !actualSource || !actualId)
        return
      try {
        await deletePlayRecord(actualSource, actualId)
        onDelete?.()
      }
      catch {
        throw new Error('删除播放记录失败')
      }
    },
    [from, actualSource, actualId, onDelete],
  )

  const getPlayUrl = useCallback(() => {
    const url = '/play?'
    const params = new URLSearchParams()

    if (from === 'douban') {
      params.append('title', actualTitle.trim())
      if (actualYear)
        params.append('year', actualYear)
      if (actualSearchType)
        params.append('stype', actualSearchType)
    }
    else if (actualSource && actualId) {
      params.append('source', actualSource)
      params.append('id', actualId)
      params.append('title', actualTitle)
      if (actualYear)
        params.append('year', actualYear)
      if (isAggregate)
        params.append('prefer', 'true')
      if (actualQuery)
        params.append('stitle', actualQuery.trim())
      if (actualSearchType)
        params.append('stype', actualSearchType)
    }

    return url + params.toString()
  }, [
    from,
    actualSource,
    actualId,
    actualTitle,
    actualYear,
    isAggregate,
    actualQuery,
    actualSearchType,
  ])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // 让原生a标签处理点击，不阻止默认行为
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      // 让浏览器处理新标签页打开

    }
    // 普通点击也使用原生导航
  }, [])

  const config = useMemo(() => {
    const configs = {
      playrecord: {
        showSourceName: true,
        showProgress: true,
        showHeart: true,
        showDelete: true,
        showDoubanLink: false,
        showRating: false,
      },
      favorite: {
        showSourceName: true,
        showProgress: false,
        showHeart: true,
        showDelete: false,
        showDoubanLink: false,
        showRating: false,
      },
      search: {
        showSourceName: true,
        showProgress: false,
        showHeart: !isAggregate,
        showDelete: false,
        showDoubanLink: !!actualDoubanId,
        showRating: false,
      },
      douban: {
        showSourceName: true,
        showProgress: false,
        showHeart: false,
        showDelete: false,
        showDoubanLink: true,
        showRating: !!rate,
      },
    }
    return configs[from] || configs.search
  }, [from, isAggregate, actualDoubanId, rate])

  return (
    <a
      href={getPlayUrl()}
      className="group relative w-full group rounded-lg bg-transparent cursor-pointer  "
      onClick={handleClick}
      target={getPlayUrl() ? '_self' : undefined}
      rel={getPlayUrl() ? undefined : 'noopener noreferrer'}
    >
      {/* 海报容器 */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ aspectRatio: '2/3' }}
      >
        {/* 骨架屏 */}
        {!isLoading && !imageError && (
          <div className="absolute inset-0 rounded-lg">
            <ImagePlaceholder aspectRatio="h-full" />
          </div>
        )}
        {/* 图片 */}
        {!imageError && (
          <Image
            src={processImageUrl(actualPoster)}
            alt={actualTitle}
            fill
            loading="lazy"
            className="object-cover group-hover:scale-[1.05] transition-all duration-200 ease-in-out"
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => setImageError(true)}
          />
        )}
        {/* 图片加载失败时的占位图标 */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              className="text-gray-400 dark:text-gray-500"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                stroke-miterlimit="10"
                stroke-width="1.5"
                d="m15 9l2-6M7 9l2-6M1 9h22M3.4 3h17.2A2.4 2.4 0 0 1 23 5.4v13.2a2.4 2.4 0 0 1-2.4 2.4H3.4A2.4 2.4 0 0 1 1 18.6V5.4A2.4 2.4 0 0 1 3.4 3"
              />
            </svg>
          </div>
        )}

        {/* 悬浮遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100" />

        {/* 年份显示 - 左上角 */}
        {showYear && actualYear && actualYear !== 'unknown' && (
          <div className="absolute top-0 left-0 rounded-tl-lg rounded-br-lg text-white text-xs font-medium bg-black/25 px-1 py-0.5">
            {actualYear}
          </div>
        )}

        {/* 序号显示 - 左上角（热门页） */}
        {showRank && rankNumber && (
          <div className="absolute top-0 left-0">
            <div className={`num num-${rankNumber}`}>
              <svg
                viewBox="0 0 41 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="rank-icon w-[41px] h-[30px]"
              >
                <defs>
                  <linearGradient
                    id={`rank-linear-${rankNumber}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="30"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop className="start" />
                    <stop offset="1" className="end" />
                  </linearGradient>
                </defs>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0 0H41C36.4908 2.23529 33.1107 6.24084 31.6656 11.0618L27.6131 24.5817C26.6491 27.7975 23.6896 30 20.3324 30H0V0Z"
                  fill={`url(#rank-linear-${rankNumber})`}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-white font-bold text-base w-[30px]"
                style={{ lineHeight: '30px' }}
              >
                {rankNumber}
              </span>
            </div>
          </div>
        )}

        {/* 源显示 - 右上角 */}
        {showSource && actualSourceName && (
          <div className="absolute top-0 right-0">
            <div className="relative bg-gradient-to-r from-green-600 to-green-400/50 text-white text-xs px-[6px] py-[3px] rounded-tr-lg rounded-bl-lg shadow-sm">
              <span className="inline-block font-medium">
                {actualSourceName}
              </span>
            </div>
          </div>
        )}

        {/* 底部渐变透明遮罩 */}
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1 pointer-events-none flex items-center"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2))',
          }}
        >
          {/* 分数显示 */}
          {showRating && rate && (
            <div className="text-white font-bold text-md italic">{rate}</div>
          )}
          {/* 集数显示 */}
          {showEpisodes && actualEpisodes && actualEpisodes > 1 && (
            <div className="text-white text-xs">
              {currentEpisode
                ? `${currentEpisode}/${actualEpisodes}`
                : `${actualEpisodes}集`}
            </div>
          )}
        </div>
        {/* 操作按钮 */}
        {(config.showHeart || config.showDelete) && (
          <div className="absolute bottom-5 left-0 right-0 mx-auto   gap-3 opacity-0  transition-all flex justify-center items-center duration-300 ease-in-out group-hover:opacity-100  ">
            {config.showDelete && (
              <Trash2
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDeleteRecord(e)
                }}
                size={19}
                className="text-white transition-all duration-300 ease-out hover:stroke-red-500 hover:scale-[1.1]"
              />
            )}
            {config.showHeart && (
              <FavoriteButton
                favorited={favorited}
                onToggle={(e) => {
                  e?.preventDefault()
                  e?.stopPropagation()
                  if (e) {
                    handleToggleFavorite(e)
                  }
                }}
                size="sm"
                className="hover:scale-[1.1] transition-transform duration-300 ease-out"
              />
            )}
          </div>
        )}

        {/* 豆瓣链接 */}
        {config.showDoubanLink && actualDoubanId && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.open(
                `https://movie.douban.com/subject/${actualDoubanId}`,
                '_blank',
                'noopener,noreferrer',
              )
            }}
            className="absolute top-1/2 -translate-y-1/2  left-2 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out delay-100 group-hover:opacity-100 z-100 group-hover:translate-x-0 cursor-pointer text-green-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              {' '}
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zm.182 3.5a.34.34 0 0 0-.341.34v1.365c0 .188.153.34.34.34h13.637a.34.34 0 0 0 .341-.34V4.84a.34.34 0 0 0-.34-.341H5.181Zm.682 3.41a.34.34 0 0 1 .34-.342h11.591a.34.34 0 0 1 .341.341v6.477a.34.34 0 0 1-.34.341h-1.11l-.819 2.727h2.951a.34.34 0 0 1 .341.341v1.364a.34.34 0 0 1-.34.341H5.181a.34.34 0 0 1-.341-.34v-1.365a.34.34 0 0 1 .34-.34h2.596l-.532-1.597a.34.34 0 0 1 .323-.449h2.046a.34.34 0 0 1 .305.188l.928 1.857h1.945l1.09-2.727H6.206a.34.34 0 0 1-.341-.34V7.908Zm2.727 2.204v1.727a.5.5 0 0 0 .5.5h5.818a.5.5 0 0 0 .5-.5v-1.727a.5.5 0 0 0-.5-.5H9.091a.5.5 0 0 0-.5.5"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 进度条 */}
      {config.showProgress && progress !== undefined && (
        <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 标题与来源 */}
      <div className="mt-2 text-center">
        <div className="relative">
          <span className="block text-sm font-semibold truncate text-gray-900 dark:text-gray-100 transition-colors duration-300 ease-in-out group-hover:text-green-600 dark:group-hover:text-green-400 peer">
            {actualTitle}
          </span>
          {/* 自定义 tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-600/50 text-white text-xs rounded-md shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 ease-out delay-100 whitespace-nowrap pointer-events-none">
            {actualTitle}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
    </a>
  )
}
