'use client'

import { Clock, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import ClearButton from '@/components/ClearButton'

import {
  addSearchHistory,
  clearSearchHistory,
  deleteSearchHistory,
  getSearchHistory,
} from '@/lib/db.client'

interface SearchBoxProps {
  className?: string
}

const SearchBox: React.FC<SearchBoxProps> = ({ className = '' }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchHistoryRef = useRef<HTMLDivElement>(null)

  // 在搜索页面时回显搜索关键词
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname
      if (pathname === '/search') {
        const query = searchParams.get('q')
        setSearchQuery(query || '')
      }
    }
  }, [searchParams])

  // 加载搜索历史
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await getSearchHistory()
        setSearchHistory(history)
      }
      catch (error) {
        console.error('加载搜索历史失败:', error)
      }
    }
    loadSearchHistory()
  }, [])

  // 点击外部关闭搜索历史弹层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchHistoryRef.current
        && !searchHistoryRef.current.contains(event.target as Node)
        && searchInputRef.current
        && !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      const trimmedQuery = searchQuery.trim().replace(/\s+/g, ' ')
      if (trimmedQuery) {
        // 保存到搜索历史
        addSearchHistory(trimmedQuery)
        // 更新搜索历史列表
        setSearchHistory(prev => [
          trimmedQuery,
          ...prev.filter(k => k !== trimmedQuery),
        ])
        // 关闭搜索历史弹层
        setShowSearchHistory(false)
        // 跳转到搜索页面
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      }
      else {
        router.push('/search')
      }
    },
    [searchQuery, router],
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleSearchHistoryClick = useCallback(
    (keyword: string) => {
      setSearchQuery(keyword)
      setShowSearchHistory(false)
      // 直接使用传入的 keyword 进行搜索，避免依赖异步状态更新
      const trimmedQuery = keyword.trim().replace(/\s+/g, ' ')
      if (trimmedQuery) {
        // 保存到搜索历史
        addSearchHistory(trimmedQuery)
        // 更新搜索历史列表
        setSearchHistory(prev => [
          trimmedQuery,
          ...prev.filter(k => k !== trimmedQuery),
        ])
        // 跳转到搜索页面
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      }
    },
    [router],
  )

  const handleDeleteSearchHistory = useCallback(
    async (e: React.MouseEvent, keyword: string) => {
      e.stopPropagation()
      try {
        await deleteSearchHistory(keyword)
        setSearchHistory(prev => prev.filter(k => k !== keyword))
      }
      catch (error) {
        console.error('删除搜索历史失败:', error)
      }
    },
    [],
  )

  const handleClearAllSearchHistory = useCallback(async () => {
    try {
      await clearSearchHistory()
      setSearchHistory([])
    }
    catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  }, [])

  const handleSearchInputFocus = useCallback(() => {
    if (searchHistory?.length > 0) {
      setShowSearchHistory(true)
    }
  }, [searchHistory])

  return (
    <div
      className={`flex-1 max-w-md mx-2 md:mx-4 relative ${className}`}
      ref={searchHistoryRef}
    >
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={handleSearchInputFocus}
            placeholder="搜索影片、演员、导演..."
            className="w-full pl-4 pr-12 py-2.5 bg-white/80 border border-gray-200 rounded-lg text-base placeholder-gray-500 outline-none focus:ring-2 focus:ring-green-500/60 focus:border-green-500/50 dark:bg-gray-800/80 dark:border-gray-600/60 dark:text-gray-200 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-200 md:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* 搜索历史弹层 */}
      {showSearchHistory && searchHistory?.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/60 dark:border-gray-600/60 rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100/50 dark:border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              <span>搜索历史</span>
            </div>
            {searchHistory?.length > 0 && (
              <ClearButton onClear={handleClearAllSearchHistory} size="sm" />
            )}
          </div>
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((keyword, index) => (
                <div
                  key={`${keyword}-${index}`}
                  className="group relative px-2 py-1 bg-gray-200/50 hover:bg-gray-200/80 hover:text-green-500 dark:bg-gray-600/50 dark:hover:bg-gray-600/80 rounded-md text-xs text-gray-700 dark:text-gray-300 cursor-pointer transition-colors duration-200"
                  onClick={() => handleSearchHistoryClick(keyword)}
                >
                  <span>{keyword}</span>
                  <button
                    onClick={e => handleDeleteSearchHistory(e, keyword)}
                    className="hidden md:block absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white p-0.3 rounded-full shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBox
