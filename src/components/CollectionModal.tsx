'use client'

import type { Favorite } from '@/lib/db.client'
import { Heart, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

import ClearButton from '@/components/ClearButton'
import Empty from '@/components/Empty'
import VideoCard from '@/components/VideoCard'

import VideoGridContainer from '@/components/VideoGridContainer'

import {
  clearAllFavorites,
  getAllFavorites,
  subscribeToDataUpdates,
} from '@/lib/db.client'

interface CollectionModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FavoriteItem {
  id: string
  source: string
  title: string
  poster: string
  episodes: number
  source_name: string
  currentEpisode?: number
  search_title?: string
  year?: number
}

export default function CollectionModal({
  isOpen,
  onClose,
}: CollectionModalProps) {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const [_, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理收藏数据更新的函数
  const updateFavoriteItems = async (
    allFavorites: Record<string, Favorite>,
  ) => {
    // 根据保存时间排序（从近到远）
    const sorted = Object.entries(allFavorites)
      .sort(([, a], [, b]) => b.save_time - a.save_time)
      .map(([key, fav]) => {
        const plusIndex = key.indexOf('+')
        const source = key.slice(0, plusIndex)
        const id = key.slice(plusIndex + 1)

        return {
          id,
          source,
          title: fav.title,
          year: fav.year ? Number.parseInt(fav.year, 10) : undefined,
          poster: fav.cover,
          episodes: fav.total_episodes,
          source_name: fav.source_name,
          search_title: fav?.search_title,
        } as FavoriteItem
      })
    setFavoriteItems(sorted)
  }

  // 当模态框打开时加载收藏数据
  useEffect(() => {
    if (!isOpen)
      return

    const loadFavorites = async () => {
      setLoading(true)
      const allFavorites = await getAllFavorites()
      await updateFavoriteItems(allFavorites)
      setLoading(false)
    }

    loadFavorites()

    // 监听收藏更新事件
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, Favorite>) => {
        updateFavoriteItems(newFavorites)
      },
    )

    return unsubscribe
  }, [isOpen])

  const handleClearFavorites = async () => {
    await clearAllFavorites()
    setFavoriteItems([])
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] p-2 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 收藏面板 */}
      <div
        className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              我的收藏
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-full h-full" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              收藏内容
            </h4>
            {favoriteItems.length > 0 && (
              <ClearButton onClear={handleClearFavorites} size="md" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            {favoriteItems.length === 0
              ? (
                  <Empty />
                )
              : (
                  <VideoGridContainer>
                    {favoriteItems.map(item => (
                      <div
                        key={`${item.title}-${item.id}-${item.source}`}
                        className="w-full"
                      >
                        <VideoCard
                          query={item.search_title}
                          id={item.id}
                          source={item.source}
                          title={item.title}
                          poster={item.poster}
                          episodes={item.episodes}
                          source_name={item.source_name}
                          year={item.year?.toString()}
                          from="favorite"
                          type={item.episodes > 1 ? 'tv' : ''}
                        />
                      </div>
                    ))}
                  </VideoGridContainer>
                )}
          </div>
        </div>
      </div>
    </div>
  )

  // 使用 Portal 将模态框渲染到 document.body
  return isOpen && mounted ? createPortal(modalContent, document.body) : null
}
