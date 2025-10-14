import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import SortOrderButton from '@/components/SortOrderButton'

interface EpisodeSelectorProps {
  /** 总集数 */
  totalEpisodes: number
  /** 每页显示多少集，默认 50 */
  episodesPerPage?: number
  /** 当前选中的集数（1 开始） */
  value?: number
  /** 用户点击选集后的回调 */
  onChange?: (episodeNumber: number) => void
}

/**
 * 纯选集组件，支持分页和排序
 */
const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  totalEpisodes,
  episodesPerPage = 50,
  value = 1,
  onChange,
}) => {
  const pageCount = Math.ceil(totalEpisodes / episodesPerPage)

  // 当前分页索引（0 开始）
  const initialPage = Math.floor((value - 1) / episodesPerPage)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  // 是否倒序显示
  const [descending, setDescending] = useState<boolean>(false)

  // 根据 descending 状态计算实际显示的分页索引
  const displayPage = useMemo(() => {
    if (descending) {
      return pageCount - 1 - currentPage
    }
    return currentPage
  }, [currentPage, descending, pageCount])

  // 升序分页标签
  const categoriesAsc = useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => {
      const start = i * episodesPerPage + 1
      const end = Math.min(start + episodesPerPage - 1, totalEpisodes)
      return { start, end }
    })
  }, [pageCount, episodesPerPage, totalEpisodes])

  // 根据 descending 状态决定分页标签的排序和内容
  const categories = useMemo(() => {
    if (descending) {
      // 倒序时，label 也倒序显示
      return [...categoriesAsc]
        .reverse()
        .map(({ start, end }) => `${end}-${start}`)
    }
    return categoriesAsc.map(({ start, end }) => `${start}-${end}`)
  }, [categoriesAsc, descending])

  const categoryContainerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 当分页切换时，将激活的分页标签滚动到视口中间
  useEffect(() => {
    const btn = buttonRefs.current[displayPage]
    const container = categoryContainerRef.current
    if (btn && container) {
      // 手动计算滚动位置，只滚动分页标签容器
      const containerRect = container.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      const scrollLeft = container.scrollLeft

      // 计算按钮相对于容器的位置
      const btnLeft = btnRect.left - containerRect.left + scrollLeft
      const btnWidth = btnRect.width
      const containerWidth = containerRect.width

      // 计算目标滚动位置，使按钮居中
      const targetScrollLeft = btnLeft - (containerWidth - btnWidth) / 2

      // 平滑滚动到目标位置
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      })
    }
  }, [displayPage, pageCount])

  const handleCategoryClick = useCallback(
    (index: number) => {
      if (descending) {
        // 在倒序时，需要将显示索引转换为实际索引
        setCurrentPage(pageCount - 1 - index)
      }
      else {
        setCurrentPage(index)
      }
    },
    [descending, pageCount],
  )

  const handleEpisodeClick = useCallback(
    (episodeNumber: number) => {
      onChange?.(episodeNumber)
    },
    [onChange],
  )

  const currentStart = currentPage * episodesPerPage + 1
  const currentEnd = Math.min(
    currentStart + episodesPerPage - 1,
    totalEpisodes,
  )

  return (
    <div className="flex flex-col h-full">
      {/* 分类标签 */}
      <div className="flex w-full items-center gap-4 py-2 border-b border-gray-400/30 px-4 flex-shrink-0">
        <div className="flex-1 overflow-x-auto" ref={categoryContainerRef}>
          <div className="flex gap-2 min-w-max">
            {categories.map((label, idx) => {
              const isActive = idx === displayPage
              return (
                <button
                  key={label}
                  ref={(el) => {
                    buttonRefs.current[idx] = el
                  }}
                  onClick={() => handleCategoryClick(idx)}
                  className={`px-2 relative py-1 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 text-center rounded-full
                    ${
                isActive
                  ? 'text-green-500 dark:text-green-400 bg-green-500/20'
                  : 'text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'
                }
                  `.trim()}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        {/* 正序/倒序按钮 */}
        <SortOrderButton
          descending={descending}
          onToggle={() => {
            // 切换排序状态（取反）
            setDescending(prev => !prev)
          }}
        />
      </div>

      {/* 集数网格 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] auto-rows-[40px] gap-x-3 gap-y-3 overflow-y-auto flex-1 py-4 px-6 min-h-0">
        {(() => {
          const len = currentEnd - currentStart + 1
          const episodes = Array.from({ length: len }, (_, i) =>
            descending ? currentEnd - i : currentStart + i)
          return episodes
        })().map((episodeNumber) => {
          const isActive = episodeNumber === value
          return (
            <button
              key={episodeNumber}
              onClick={() => handleEpisodeClick(episodeNumber - 1)}
              className={`h-10 w-10 flex items-center justify-center text-sm font-medium rounded-md transition-all duration-200
                ${
            isActive
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 dark:bg-green-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20'
            }`.trim()}
            >
              {episodeNumber}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EpisodeSelector
