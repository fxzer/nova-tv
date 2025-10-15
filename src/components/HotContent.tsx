'use client'

import type { DoubanItem } from '@/lib/types'
import { useRouter, useSearchParams } from 'next/navigation'

import { useEffect, useMemo, useState } from 'react'
import HotContentSection from '@/components/HotContentSection'

import { getDoubanCategories } from '@/lib/douban.client'

// 通用排序函数：按评分从高到低排序
function sortByRateDesc(items: DoubanItem[]): DoubanItem[] {
  return [...items].sort((a, b) => {
    const rateA = Number.parseFloat(a.rate) || 0
    const rateB = Number.parseFloat(b.rate) || 0
    return rateB - rateA
  })
}

// 视图类型
type ViewType = 'hot' | 'movie' | 'tv' | 'show' | 'custom'

export function HotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 使用 useMemo 缓存当前视图类型
  const currentType = useMemo(() => {
    return searchParams.get('type') as ViewType
  }, [searchParams])

  // 处理视图切换
  const handleViewChange = (view: ViewType) => {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'hot') {
      params.delete('type')
    }
    else {
      params.set('type', view)
    }
    router.push(`/?${params.toString()}`)
  }

  // 热门内容状态
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([])
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([])
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([])
  const [loading, setLoading] = useState(true)

  // 获取首页热门数据
  useEffect(() => {
    let isMounted = true

    // 只有当前视图是 'hot' 或空时才获取热门数据
    if (currentType && currentType !== 'hot') {
      return
    }

    const fetchHomeData = async () => {
      try {
        if (!isMounted)
          return
        setLoading(true)

        // 并行获取热门电影、热门剧集和热门综艺
        const [moviesData, tvShowsData, varietyShowsData] = await Promise.all([
          getDoubanCategories({
            kind: 'movie',
            category: '热门',
            type: '全部',
            pageLimit: 18,
          }),
          getDoubanCategories({
            kind: 'tv',
            category: 'tv',
            type: 'tv',
            pageLimit: 18,
          }),
          getDoubanCategories({
            kind: 'tv',
            category: 'show',
            type: 'show',
            pageLimit: 18,
          }),
        ])

        if (!isMounted)
          return

        if (moviesData.code === 200) {
          setHotMovies(sortByRateDesc(moviesData.list))
        }
        else {
          console.error('[HotContent] 获取电影数据失败:', moviesData)
        }

        if (tvShowsData.code === 200) {
          setHotTvShows(sortByRateDesc(tvShowsData.list))
        }
        else {
          console.error('[HotContent] 获取剧集数据失败:', tvShowsData)
        }

        if (varietyShowsData.code === 200) {
          setHotVarietyShows(sortByRateDesc(varietyShowsData.list))
        }
        else {
          console.error('[HotContent] 获取综艺数据失败:', varietyShowsData)
        }
      }
      catch (error) {
        console.error('[HotContent] 获取热门数据失败:', error)
        if (!isMounted)
          return
        // 清空数据，避免显示旧数据
        setHotMovies([])
        setHotTvShows([])
        setHotVarietyShows([])
      }
      finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchHomeData()

    return () => {
      isMounted = false
    }
  }, [currentType]) // 现在可以安全地使用 currentType 作为依赖

  return (
    <>
      <HotContentSection
        title="热门电影"
        viewType="movie"
        items={hotMovies}
        loading={loading}
        onViewChange={handleViewChange}
      />

      <HotContentSection
        title="热门剧集"
        viewType="tv"
        items={hotTvShows}
        loading={loading}
        onViewChange={handleViewChange}
      />

      <HotContentSection
        title="热门综艺"
        viewType="show"
        items={hotVarietyShows}
        loading={loading}
        onViewChange={handleViewChange}
      />
    </>
  )
}
