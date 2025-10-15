'use client'

import type { DoubanItem, DoubanResult } from '@/lib/types'
import { useSearchParams } from 'next/navigation'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import AnnouncementModal from '@/components/AnnouncementModal'

import CustomSelector from '@/components/CustomSelector'
import Empty from '@/components/Empty'
import { HotContent } from '@/components/HotContent'
import PageLayout from '@/components/PageLayout'
import Selector from '@/components/Selector'
import { useSite } from '@/components/SiteProvider'
import VideoCard from '@/components/VideoCard'
import VideoGridContainer from '@/components/VideoGridContainer'
import VideoSkeleton from '@/components/VideoSkeleton'
import { getDoubanCategories, getDoubanList } from '@/lib/douban.client'

export default function Home() {
  return (
    <Suspense>
      <PageView />
    </Suspense>
  )
}

// 视图类型枚举
type ViewType = 'hot' | 'movie' | 'tv' | 'show' | 'custom'

// 自定义分类类型
interface CustomCategory {
  name: string
  type: 'movie' | 'tv'
  query: string
}

// 运行时配置类型 - 现在在 src/types/global.d.ts 中定义

// 豆瓣分类内容组件
function DoubanContent({
  type,
  customCategories,
  primarySelection,
  secondarySelection,
  doubanData,
  loading,
  hasMore,
  isLoadingMore,
  skeletonData,
  onPrimaryChange,
  onSecondaryChange,
  loadingRef,
}: {
  type: ViewType
  customCategories: CustomCategory[]
  primarySelection: string
  secondarySelection: string
  doubanData: DoubanItem[]
  loading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  skeletonData: number[]
  onPrimaryChange: (value: string) => void
  onSecondaryChange: (value: string) => void
  loadingRef: React.MutableRefObject<HTMLDivElement | null>
}) {
  return (
    <>
      {/* 页面标题和选择器 */}
      <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
        {/* 选择器组件 */}
        {type !== 'custom'
          ? (
              <Selector
                type={type as 'movie' | 'tv' | 'show'}
                primarySelection={primarySelection}
                secondarySelection={secondarySelection}
                onPrimaryChange={onPrimaryChange}
                onSecondaryChange={onSecondaryChange}
              />
            )
          : (
              <CustomSelector
                customCategories={customCategories}
                primarySelection={primarySelection}
                secondarySelection={secondarySelection}
                onPrimaryChange={onPrimaryChange}
                onSecondaryChange={onSecondaryChange}
              />
            )}
      </div>

      {/* 内容展示区域 */}
      <div className=" mx-auto mt-8 overflow-visible">
        {/* 内容网格 */}
        <VideoGridContainer>
          {loading
            ? skeletonData.map((_, index) => <VideoSkeleton key={index} />)
            : doubanData.map((item, index) => (
                <div key={`${item.title}-${index}`} className="w-full">
                  <VideoCard
                    from="douban"
                    title={item.title}
                    poster={item.poster}
                    douban_id={item.id}
                    rate={item.rate}
                    year={item.year}
                    type={type === 'movie' ? 'movie' : ''} // 电影类型严格控制，tv 不控
                  />
                </div>
              ))}
        </VideoGridContainer>

        {/* 加载更多指示器 */}
        {hasMore && !loading && (
          <div
            ref={(el) => {
              if (el && el.offsetParent !== null) {
                loadingRef.current = el
              }
            }}
            className="flex justify-center mt-12 py-8"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <span className="text-gray-600">加载中...</span>
              </div>
            )}
          </div>
        )}

        {/* 没有更多数据提示 */}
        {!hasMore && doubanData.length > 0 && (
          <div className="text-center text-gray-500 py-8">已加载全部内容</div>
        )}

        {/* 空状态 */}
        {!loading && doubanData.length === 0 && <Empty />}
      </div>
    </>
  )
}

function PageView() {
  const searchParams = useSearchParams()

  // 视图状态管理
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const type = searchParams.get('type') as ViewType
    return type || 'hot'
  })

  // 豆瓣分类内容状态
  const [doubanData, setDoubanData] = useState<DoubanItem[]>([])
  const [doubanLoading, setDoubanLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectorsReady, setSelectorsReady] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 选择器状态
  const [primarySelection, setPrimarySelection] = useState<string>(() => {
    return currentView === 'movie' ? '热门' : ''
  })
  const [secondarySelection, setSecondarySelection] = useState<string>(() => {
    if (currentView === 'movie')
      return '全部'
    if (currentView === 'tv')
      return 'tv'
    if (currentView === 'show')
      return 'show'
    return '全部'
  })

  // 自定义分类数据
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    [],
  )

  const { announcement } = useSite()
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  // 生成骨架屏数据
  const skeletonData = Array.from({ length: 25 }, (_, index) => index)

  // 获取自定义分类数据
  useEffect(() => {
    const runtimeConfig = window.RUNTIME_CONFIG
    if (
      runtimeConfig?.CUSTOM_CATEGORIES
      && runtimeConfig.CUSTOM_CATEGORIES.length > 0
    ) {
      setCustomCategories(runtimeConfig.CUSTOM_CATEGORIES)
    }
  }, [])

  // 检查公告弹窗状态
  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement')
      if (hasSeenAnnouncement !== announcement) {
        setShowAnnouncement(true)
      }
      else {
        setShowAnnouncement(Boolean(!hasSeenAnnouncement && announcement))
      }
    }
  }, [announcement])

  // 监听URL变化
  useEffect(() => {
    const type = searchParams.get('type') as ViewType
    const newView = type || 'hot'
    if (newView !== currentView) {
      setCurrentView(newView)
    }
  }, [searchParams, currentView])

  // 初始化选择器状态
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectorsReady(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  // 视图变化时重置选择器状态
  useEffect(() => {
    setSelectorsReady(false)
    setDoubanLoading(true)

    if (currentView === 'custom' && customCategories.length > 0) {
      const types = Array.from(
        new Set(customCategories.map(cat => cat.type)),
      )
      if (types.length > 0) {
        let selectedType = types[0]
        if (types.includes('movie')) {
          selectedType = 'movie'
        }
        else {
          selectedType = 'tv'
        }
        setPrimarySelection(selectedType)

        const firstCategory = customCategories.find(
          cat => cat.type === selectedType,
        )
        if (firstCategory) {
          setSecondarySelection(firstCategory.query)
        }
      }
    }
    else {
      if (currentView === 'movie') {
        setPrimarySelection('热门')
        setSecondarySelection('全部')
      }
      else if (currentView === 'tv') {
        setPrimarySelection('')
        setSecondarySelection('tv')
      }
      else if (currentView === 'show') {
        setPrimarySelection('')
        setSecondarySelection('show')
      }
      else {
        setPrimarySelection('')
        setSecondarySelection('全部')
      }
    }

    const timer = setTimeout(() => {
      setSelectorsReady(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [currentView, customCategories])

  // 生成API请求参数
  const getRequestParams = useCallback(
    (pageStart: number) => {
      if (currentView === 'tv' || currentView === 'show') {
        return {
          kind: 'tv' as const,
          category: currentView,
          type: secondarySelection,
          pageLimit: 25,
          pageStart,
        }
      }

      return {
        kind: currentView as 'tv' | 'movie',
        category: primarySelection,
        type: secondarySelection,
        pageLimit: 25,
        pageStart,
      }
    },
    [currentView, primarySelection, secondarySelection],
  )

  // 防抖加载豆瓣数据
  const loadDoubanData = useCallback(async () => {
    try {
      setDoubanLoading(true)
      let data: DoubanResult

      if (currentView === 'custom') {
        const selectedCategory = customCategories.find(
          cat =>

            cat.type === primarySelection && cat.query === secondarySelection,
        )

        if (selectedCategory) {
          data = await getDoubanList({
            tag: selectedCategory.query,
            type: selectedCategory.type,
            pageLimit: 25,
            pageStart: 0,
          })
        }
        else {
          throw new Error('没有找到对应的分类')
        }
      }
      else {
        data = await getDoubanCategories(getRequestParams(0))
      }

      if (data.code === 200) {
        setDoubanData(data.list)
        setHasMore(data.list.length === 25)
        setDoubanLoading(false)
      }
      else {
        throw new Error(data.message || '获取数据失败')
      }
    }
    catch {
      // 错误已通过抛出的 Error 处理
    }
  }, [
    currentView,
    primarySelection,
    secondarySelection,
    getRequestParams,
    customCategories,
  ])

  // 监听选择器变化加载数据
  useEffect(() => {
    if (currentView !== 'hot' && selectorsReady) {
      setDoubanData([])
      setDoubanLoading(true) // 立即设置loading状态，避免闪烁
      setCurrentPage(0)
      setHasMore(true)
      setIsLoadingMore(false)

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        loadDoubanData()
      }, 100)

      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
      }
    }
  }, [
    selectorsReady,
    currentView,
    primarySelection,
    secondarySelection,
    loadDoubanData,
  ])

  // 加载更多数据
  useEffect(() => {
    if (currentPage > 0) {
      const fetchMoreData = async () => {
        try {
          setIsLoadingMore(true)

          let data: DoubanResult
          if (currentView === 'custom') {
            const selectedCategory = customCategories.find(
              cat =>
                cat.type === primarySelection
                && cat.query === secondarySelection,
            )

            if (selectedCategory) {
              data = await getDoubanList({
                tag: selectedCategory.query,
                type: selectedCategory.type,
                pageLimit: 25,
                pageStart: currentPage * 25,
              })
            }
            else {
              throw new Error('没有找到对应的分类')
            }
          }
          else {
            data = await getDoubanCategories(
              getRequestParams(currentPage * 25),
            )
          }

          if (data.code === 200) {
            setDoubanData(prev => [...prev, ...data.list])
            setHasMore(data.list.length === 25)
          }
          else {
            throw new Error(data.message || '获取数据失败')
          }
        }
        catch {
          // 错误已通过抛出的 Error 处理
        }
        finally {
          setIsLoadingMore(false)
        }
      }

      fetchMoreData()
    }
  }, [
    currentPage,
    currentView,
    primarySelection,
    secondarySelection,
    customCategories,
    getRequestParams,
  ])

  // 滚动监听
  useEffect(() => {
    if (currentView === 'hot' || !hasMore || isLoadingMore || doubanLoading) {
      return
    }

    if (!loadingRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setCurrentPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadingRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, doubanLoading, currentView])

  // 处理选择器变化
  const handlePrimaryChange = useCallback(
    (value: string) => {
      if (value !== primarySelection) {
        setDoubanLoading(true)

        if (currentView === 'custom' && customCategories.length > 0) {
          const firstCategory = customCategories.find(
            cat => cat.type === value,
          )
          if (firstCategory) {
            setPrimarySelection(value)
            setSecondarySelection(firstCategory.query)
          }
          else {
            setPrimarySelection(value)
          }
        }
        else {
          setPrimarySelection(value)
        }
      }
    },
    [primarySelection, currentView, customCategories],
  )

  const handleSecondaryChange = useCallback(
    (value: string) => {
      if (value !== secondarySelection) {
        setDoubanLoading(true)
        setSecondarySelection(value)
      }
    },
    [secondarySelection],
  )
  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false)
    localStorage.setItem('hasSeenAnnouncement', announcement)
  }

  return (
    <>
      <PageLayout activeView={currentView}>
        <div className="px-2 sm:px-10 py-4 sm:py-8 overflow-visible">
          <div className="max-w-[95%] mx-auto">
            {currentView === 'hot'
              ? (
                  <HotContent />
                )
              : (
                  <DoubanContent
                    type={currentView}
                    customCategories={customCategories}
                    primarySelection={primarySelection}
                    secondarySelection={secondarySelection}
                    doubanData={doubanData}
                    loading={doubanLoading}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    skeletonData={skeletonData}
                    onPrimaryChange={handlePrimaryChange}
                    onSecondaryChange={handleSecondaryChange}
                    loadingRef={loadingRef}
                  />
                )}
          </div>
        </div>
      </PageLayout>

      {/* 公告弹窗 */}
      {announcement && (
        <AnnouncementModal
          announcement={announcement}
          isOpen={showAnnouncement}
          onClose={handleCloseAnnouncement}
        />
      )}
    </>
  )
}
