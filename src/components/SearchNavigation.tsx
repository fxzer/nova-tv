'use client'

import type { SearchResult } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useEffect, useRef, useState } from 'react'

interface SearchNavigationProps {
  groupedData: Array<{
    typeName: string
    groups?: Array<[string, SearchResult[]]>
    items?: SearchResult[]
  }>
  selectedGroup: string
  onGroupSelect: (typeName: string) => void
  viewMode: 'agg' | 'all'
}

export default function SearchNavigation({
  groupedData,
  selectedGroup,
  onGroupSelect,
  viewMode,
}: SearchNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = containerRef.current

      // 计算是否需要左右滚动按钮
      const threshold = 1 // 容差值，避免浮点误差
      const canScrollRight
        = scrollWidth - (scrollLeft + clientWidth) > threshold
      const canScrollLeft = scrollLeft > threshold

      setShowRightScroll(canScrollRight)
      setShowLeftScroll(canScrollLeft)
    }
  }

  useEffect(() => {
    // 多次延迟检查，确保内容已完全渲染
    checkScroll()

    // 监听窗口大小变化
    window.addEventListener('resize', checkScroll)

    // 创建一个 ResizeObserver 来监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      // 延迟执行检查
      checkScroll()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', checkScroll)
      resizeObserver.disconnect()
    }
  }, [groupedData]) // 依赖 groupedData，当数据变化时重新检查

  // 添加一个额外的效果来监听子组件的变化
  useEffect(() => {
    if (containerRef.current) {
      // 监听 DOM 变化
      const observer = new MutationObserver(() => {
        setTimeout(checkScroll, 100)
      })

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })

      return () => observer.disconnect()
    }
  }, [])

  const handleScrollRightClick = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 400,
        behavior: 'smooth',
      })
    }
  }

  const handleScrollLeftClick = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -400,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 dark:border-gray-800 relative">
        <div
          className="relative"
          onMouseEnter={() => {
            setIsHovered(true)
            // 当鼠标进入时重新检查一次
            checkScroll()
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={containerRef}
            className="-mb-px flex space-x-4 overflow-x-auto scrollbar-hide"
            onScroll={checkScroll}
            style={{ scrollBehavior: 'smooth' }}
          >
            {groupedData.map((groupData) => {
              const { typeName } = groupData

              // 计算项目数量
              const itemCount
                = viewMode === 'agg' && groupData.groups
                  ? groupData.groups?.length // 聚合模式下显示聚合后的分组数量
                  : groupData.items?.length || 0

              const isSelected = selectedGroup === typeName

              return (
                <button
                  key={typeName}
                  onClick={() => onGroupSelect(typeName)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                    isSelected
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{typeName}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        isSelected
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {itemCount}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 左侧滚动按钮 */}
          {showLeftScroll && (
            <div
              className={`hidden sm:flex absolute left-0 top-3 bottom-0 w-14 items-center justify-center z-[600] transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'transparent',
                pointerEvents: 'none',
              }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  top: '20%',
                  bottom: '80%',
                  left: '-2rem',
                  pointerEvents: 'auto',
                }}
              >
                <button
                  onClick={handleScrollLeftClick}
                  className="w-8 h-8 bg-white/95 rounded-full shadow-lg flex items-center justify-center hover:bg-white border border-gray-200 transition-transform hover:scale-105 dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}

          {/* 右侧滚动按钮 */}
          {showRightScroll && (
            <div
              className={`hidden sm:flex absolute right-0 top-3 bottom-0 w-14 items-center justify-center z-[600] transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'transparent',
                pointerEvents: 'none',
              }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  top: '20%',
                  bottom: '80%',
                  right: '-2rem',
                  pointerEvents: 'auto',
                }}
              >
                <button
                  onClick={handleScrollRightClick}
                  className="w-8 h-8 bg-white/95 rounded-full shadow-lg flex items-center justify-center hover:bg-white border border-gray-200 transition-transform hover:scale-105 dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
