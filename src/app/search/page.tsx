'use client'

import type { SearchResult } from '@/lib/types'
import { ChevronUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Empty from '@/components/Empty'

import PageLayout from '@/components/PageLayout'
import SearchNavigation from '@/components/SearchNavigation'
import SearchSkeleton from '@/components/SearchSkeleton'
import VideoCard from '@/components/VideoCard'
import VideoGridContainer from '@/components/VideoGridContainer'
import { yellowWords } from '@/lib/yellow'

function SearchPageClient() {
  // 返回顶部按钮显示状态
  const [showBackToTop, setShowBackToTop] = useState(false)

  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  // 用于取消搜索请求的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null)

  // 获取默认聚合设置：只读取用户本地设置，默认为 true
  const getDefaultAggregate = () => {
    if (typeof window !== 'undefined') {
      const userSetting = localStorage.getItem('defaultAggregateSearch')
      if (userSetting !== null) {
        return JSON.parse(userSetting)
      }
    }
    return true // 默认启用聚合
  }

  const [viewMode, setViewMode] = useState<'agg' | 'all'>(() => {
    return getDefaultAggregate() ? 'agg' : 'all'
  })

  // 管理当前选中的分组
  const [selectedGroup, setSelectedGroup] = useState<string>('')

  // 按type_name分组并按分组内结果个数排序的结果
  const groupedResults = useMemo(() => {
    const typeMap = new Map<string, SearchResult[]>()
    searchResults.forEach((item) => {
      const typeName = item.type_name || '其他'
      const arr = typeMap.get(typeName) || []
      arr.push(item)
      typeMap.set(typeName, arr)
    })

    // 按分组内结果个数排序（从多到少）
    return Array.from(typeMap.entries()).sort(
      (a, b) => b[1].length - a[1].length,
    )
  }, [searchResults])

  // 聚合后的结果（按标题和年份分组，在每个type分组内进行）
  const aggregatedResults = useMemo(() => {
    const result: Array<{
      typeName: string
      groups: Array<[string, SearchResult[]]>
    }> = []

    groupedResults.forEach(([typeName, items]) => {
      const map = new Map<string, SearchResult[]>()
      items.forEach((item) => {
        // 使用 title + year + type 作为键，year 必然存在，但依然兜底 'unknown'
        const key = `${item.title.replaceAll(' ', '')}-${
          item.year || 'unknown'
        }-${item.episodes.length === 1 ? 'movie' : 'tv'}`
        const arr = map.get(key) || []
        arr.push(item)
        map.set(key, arr)
      })

      const groups = Array.from(map.entries()).sort((a, b) => {
        // 优先排序：标题与搜索词完全一致的排在前面
        const currentQuery
          = searchParams.get('q')?.trim().replaceAll(' ', '') || ''
        const aExactMatch = a[1][0].title
          .replaceAll(' ', '')
          .includes(currentQuery)
        const bExactMatch = b[1][0].title
          .replaceAll(' ', '')
          .includes(currentQuery)

        if (aExactMatch && !bExactMatch)
          return -1
        if (!aExactMatch && bExactMatch)
          return 1

        // 年份排序
        if (a[1][0].year === b[1][0].year) {
          return a[0].localeCompare(b[0])
        }
        else {
          // 处理 unknown 的情况
          const aYear = a[1][0].year
          const bYear = b[1][0].year

          if (aYear === 'unknown' && bYear === 'unknown') {
            return 0
          }
          else if (aYear === 'unknown') {
            return 1 // a 排在后面
          }
          else if (bYear === 'unknown') {
            return -1 // b 排在后面
          }
          else {
            // 都是数字年份，按数字大小排序（大的在前面）
            return aYear > bYear ? -1 : 1
          }
        }
      })

      result.push({ typeName, groups })
    })

    return result
  }, [groupedResults, searchParams])

  useEffect(() => {
    // 获取滚动位置的函数 - 专门针对 body 滚动
    const getScrollTop = () => {
      return document.body.scrollTop || 0
    }

    // 使用 requestAnimationFrame 持续检测滚动位置
    let isRunning = false
    const checkScrollPosition = () => {
      if (!isRunning)
        return

      const scrollTop = getScrollTop()
      const shouldShow = scrollTop > 300
      setShowBackToTop(shouldShow)

      requestAnimationFrame(checkScrollPosition)
    }

    // 启动持续检测
    isRunning = true
    checkScrollPosition()

    // 监听 body 元素的滚动事件
    const handleScroll = () => {
      const scrollTop = getScrollTop()
      setShowBackToTop(scrollTop > 300)
    }

    document.body.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      isRunning = false // 停止 requestAnimationFrame 循环

      // 移除 body 滚动事件监听器
      document.body.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // 当搜索参数变化时更新搜索状态
    const query = searchParams.get('q')
    if (query) {
      fetchSearchResults(query)
    }
    else {
      setShowResults(false)
      setSearchResults([])
    }
  }, [searchParams])

  // 组件卸载时取消所有未完成的搜索请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // 当搜索结果更新时，默认选中第一个分组
  useEffect(() => {
    if (groupedResults.length > 0) {
      // 检查当前选中的分组是否在新的结果中
      const currentGroupExists = groupedResults.some(
        ([typeName]) => typeName === selectedGroup,
      )

      // 如果当前选中的分组不存在，或者没有选中任何分组，则选择第一个分组
      if (!currentGroupExists || !selectedGroup) {
        setSelectedGroup(groupedResults[0][0])
      }
    }
  }, [groupedResults, selectedGroup])

  const fetchSearchResults = async (query: string) => {
    // 取消之前的搜索请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`,
        { signal: abortController.signal },
      )

      // 检查请求是否被取消
      if (abortController.signal.aborted) {
        return
      }

      const data = await response.json()

      // 再次检查请求是否被取消（在数据解析过程中）
      if (abortController.signal.aborted) {
        return
      }

      let results = data.results
      if (
        typeof window !== 'undefined'
        && !(window as any).RUNTIME_CONFIG?.DISABLE_YELLOW_FILTER
      ) {
        results = results.filter((result: SearchResult) => {
          const typeName = result.type_name || ''
          return !yellowWords.some((word: string) => typeName.includes(word))
        })
      }

      // 最后检查请求是否被取消（在设置状态之前）
      if (abortController.signal.aborted) {
        return
      }

      setSearchResults(
        results.sort((a: SearchResult, b: SearchResult) => {
          // 优先排序：标题与搜索词完全一致的排在前面
          const aExactMatch = a.title === query.trim()
          const bExactMatch = b.title === query.trim()

          if (aExactMatch && !bExactMatch)
            return -1
          if (!aExactMatch && bExactMatch)
            return 1

          // 如果都匹配或都不匹配，则按原来的逻辑排序
          if (a.year === b.year) {
            return a.title.localeCompare(b.title)
          }
          else {
            // 处理 unknown 的情况
            if (a.year === 'unknown' && b.year === 'unknown') {
              return 0
            }
            else if (a.year === 'unknown') {
              return 1 // a 排在后面
            }
            else if (b.year === 'unknown') {
              return -1 // b 排在后面
            }
            else {
              // 都是数字年份，按数字大小排序（大的在前面）
              return Number.parseInt(a.year) > Number.parseInt(b.year) ? -1 : 1
            }
          }
        }),
      )
      setShowResults(true)
    }
    catch (error) {
      // 只有在请求被取消时不更新状态
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      setSearchResults([])
    }
    finally {
      // 只有在请求没有被取消时才设置加载状态为 false
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  // 返回顶部功能
  const scrollToTop = () => {
    try {
      // 根据调试结果，真正的滚动容器是 document.body
      document.body.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
    catch (error) {
      // 如果平滑滚动完全失败，使用立即滚动
      document.body.scrollTop = 0
    }
  }

  return (
    <PageLayout activeView="hot">
      <div className="px-4 sm:px-10 py-4 sm:py-8 overflow-visible mb-10">
        {/* 搜索结果或搜索历史 */}
        <div className="max-w-[95%] mx-auto overflow-visible">
          {isLoading ? (
            <SearchSkeleton />
          ) : showResults ? (
            <section>
              {/* 标题 + 聚合开关 */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  搜索结果
                </h2>
                {/* 聚合开关 */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    聚合
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={viewMode === 'agg'}
                      onChange={() =>
                        setViewMode(viewMode === 'agg' ? 'all' : 'agg')}
                    />
                    <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                </label>
              </div>

              {/* 横向导航菜单 */}
              <SearchNavigation
                groupedData={
                  viewMode === 'agg'
                    ? aggregatedResults
                    : groupedResults.map(([typeName, items]) => ({
                        typeName,
                        items,
                      }))
                }
                selectedGroup={selectedGroup}
                onGroupSelect={setSelectedGroup}
                viewMode={viewMode}
              />

              {/* 当前选中分组的内容 */}
              <VideoGridContainer>
                {viewMode === 'agg'
                  ? aggregatedResults
                      .filter(({ typeName }) => typeName === selectedGroup)
                      .flatMap(({ groups }) =>
                        groups.map(([mapKey, group]) => (
                          <div key={mapKey} className="w-full">
                            <VideoCard
                              from="search"
                              items={group}
                              query={
                                group[0].title !== searchParams.get('q')?.trim()
                                  ? searchParams.get('q')?.trim() || ''
                                  : ''
                              }
                            />
                          </div>
                        )),
                      )
                  : groupedResults
                      .filter(([typeName]) => typeName === selectedGroup)
                      .flatMap(([typeName, items]) =>
                        items.map(item => (
                          <div
                            key={`${typeName}-${item.source}-${item.id}`}
                            className="w-full"
                          >
                            <VideoCard
                              id={item.id}
                              title={`${item.title} ${item.type_name}`}
                              poster={item.poster}
                              episodes={item.episodes.length}
                              source={item.source}
                              source_name={item.source_name}
                              douban_id={item.douban_id?.toString()}
                              query={
                                item.title !== searchParams.get('q')?.trim()
                                  ? searchParams.get('q')?.trim() || ''
                                  : ''
                              }
                              year={item.year}
                              from="search"
                              type={item.episodes.length > 1 ? 'tv' : 'movie'}
                            />
                          </div>
                        )),
                      )}
              </VideoGridContainer>

              {searchResults.length === 0 && <Empty />}
            </section>
          ) : null}
        </div>
      </div>

      {/* 返回顶部悬浮按钮 */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 md:bottom-6 right-6 z-[500] w-10 h-10 bg-green-500/90 hover:bg-green-500 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out flex items-center justify-center group ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="返回顶部"
      >
        <ChevronUp className="w-6 h-6 transition-transform group-hover:scale-110" />
      </button>
    </PageLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  )
}
