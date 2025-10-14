import type { SearchResult } from '@/lib/types'

import React, { useState } from 'react'

import EpisodeSelector from '@/components/EpisodeSelector'
import SourceSelector from '@/components/SourceSelector'

// 定义视频信息类型
interface VideoInfo {
  quality: string
  loadSpeed: string
  pingTime: number
  hasError?: boolean
}

interface PlayPanelProps {
  /** 总集数 */
  totalEpisodes: number
  /** 每页显示多少集，默认 50 */
  episodesPerPage?: number
  /** 当前选中的集数（1 开始） */
  currentEpisode?: number
  /** 用户点击选集后的回调 */
  onEpisodeChange?: (episodeNumber: number) => void
  /** 换源相关 */
  onSourceChange?: (source: string, id: string, title: string) => void
  currentSource?: string
  currentId?: string
  videoTitle?: string
  availableSources?: SearchResult[]
  sourceSearchLoading?: boolean
  sourceSearchError?: string | null
  /** 预计算的测速结果，避免重复测速 */
  precomputedVideoInfo?: Map<string, VideoInfo>
}

/**
 * 播放面板组件，包含选集和换源功能
 */
const PlayPanel: React.FC<PlayPanelProps> = ({
  totalEpisodes,
  episodesPerPage,
  currentEpisode = 1,
  onEpisodeChange,
  onSourceChange,
  currentSource,
  currentId,
  videoTitle,
  availableSources,
  sourceSearchLoading,
  sourceSearchError,
  precomputedVideoInfo,
}) => {
  // 主要的 tab 状态：'episodes' 或 'sources'
  // 当只有一集时默认展示 "换源"，并隐藏 "选集" 标签
  const [activeTab, setActiveTab] = useState<'episodes' | 'sources'>(
    totalEpisodes > 1 ? 'episodes' : 'sources',
  )

  // 定义 tab 配置
  const tabs = [
    {
      key: 'episodes' as const,
      label: '选集',
      show: totalEpisodes > 1,
    },
    {
      key: 'sources' as const,
      label: '换源',
      show: true, // 换源始终显示
    },
  ].filter(tab => tab.show) // 过滤掉不显示的 tab

  return (
    <div className="md:ml-2 h-full rounded-xl bg-black/10 dark:bg-white/5 flex flex-col border border-white/0 dark:border-white/30 overflow-hidden">
      {/* 主要的 Tab 切换 - 无缝融入设计 */}
      <div className="flex mb-1  flex-shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-6 text-center cursor-pointer transition-all duration-200 font-medium
              ${
          activeTab === tab.key
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-700 hover:text-black bg-black/5 dark:bg-white/5 dark:text-gray-300 dark:hover:text-white hover:bg-black/3 dark:hover:bg-white/3'
          }
            `.trim()}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'episodes' && totalEpisodes > 1 && (
          <EpisodeSelector
            totalEpisodes={totalEpisodes}
            episodesPerPage={episodesPerPage}
            value={currentEpisode}
            onChange={onEpisodeChange}
          />
        )}
        {activeTab === 'sources' && (
          <SourceSelector
            currentSource={currentSource}
            currentId={currentId}
            videoTitle={videoTitle}
            availableSources={availableSources}
            sourceSearchLoading={sourceSearchLoading}
            sourceSearchError={sourceSearchError}
            onSourceChange={onSourceChange}
            precomputedVideoInfo={precomputedVideoInfo}
          />
        )}
      </div>
    </div>
  )
}

export default PlayPanel
