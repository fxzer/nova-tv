'use client'

import type { PlayRecord } from '@/lib/db.client'
import { Clock, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { createPortal } from 'react-dom'
import ClearButton from '@/components/ClearButton'

import Empty from '@/components/Empty'
import VideoCard from '@/components/VideoCard'
import VideoGridContainer from '@/components/VideoGridContainer'
import VideoSkeleton from '@/components/VideoSkeleton'
import {
  clearAllPlayRecords,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client'

interface WatchHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WatchHistoryModal({
  isOpen,
  onClose,
}: WatchHistoryModalProps) {
  const [playRecords, setPlayRecords] = useState<
    (PlayRecord & { key: string })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理播放记录数据更新的函数
  const updatePlayRecords = (allRecords: Record<string, PlayRecord>) => {
    // 将记录转换为数组并根据 save_time 由近到远排序
    const recordsArray = Object.entries(allRecords).map(([key, record]) => ({
      ...record,
      key,
    }))

    // 按 save_time 降序排序（最新的在前面）
    const sortedRecords = recordsArray.sort(
      (a, b) => b.save_time - a.save_time,
    )

    setPlayRecords(sortedRecords)
  }

  // 当模态框打开时加载播放记录
  useEffect(() => {
    if (!isOpen)
      return

    const loadPlayRecords = async () => {
      setLoading(true)
      const allRecords = await getAllPlayRecords()
      updatePlayRecords(allRecords)
      setLoading(false)
    }

    loadPlayRecords()

    // 监听播放记录更新事件
    const unsubscribe = subscribeToDataUpdates(
      'playRecordsUpdated',
      (newRecords: Record<string, PlayRecord>) => {
        updatePlayRecords(newRecords)
      },
    )

    return unsubscribe
  }, [isOpen])

  // 计算播放进度百分比
  const getProgress = (record: PlayRecord) => {
    if (record.total_time === 0)
      return 0
    return (record.play_time / record.total_time) * 100
  }

  // 从 key 中解析 source 和 id
  const parseKey = (key: string) => {
    const [source, id] = key.split('+')
    return { source, id }
  }

  const handleClearPlayRecords = async () => {
    await clearAllPlayRecords()
    setPlayRecords([])
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] p-2 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 观看历史面板 */}
      <div
        className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-2 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              观看历史
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
        <div className="flex-1 overflow-hidden p-2 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              最近观看
            </h4>
            {playRecords?.length > 0 && (
              <ClearButton onClear={handleClearPlayRecords} size="md" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            {playRecords?.length === 0
              ? (
                  <Empty />
                )
              : (
                  <VideoGridContainer>
                    {loading
                      ? Array.from({ length: 18 }, (_, index) => (
                          <VideoSkeleton key={index} />
                        ))
                      : playRecords.map((record) => {
                          const { source, id } = parseKey(record.key)
                          return (
                            <div
                              key={`${record.title}-${record.key}`}
                              className="w-full"
                            >
                              <VideoCard
                                id={id}
                                title={record.title}
                                poster={record.cover}
                                year={record.year}
                                source={source}
                                source_name={record.source_name}
                                progress={getProgress(record)}
                                episodes={record.total_episodes}
                                currentEpisode={record.index}
                                query={record.search_title}
                                from="playrecord"
                                onDelete={() =>
                                  setPlayRecords(prev =>
                                    prev.filter(r => r.key !== record.key),
                                  )}
                                type={record.total_episodes > 1 ? 'tv' : ''}
                              />
                            </div>
                          )
                        })}
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
