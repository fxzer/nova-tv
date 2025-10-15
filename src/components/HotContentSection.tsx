import type { DoubanItem } from '@/lib/types'

import { ChevronRight } from 'lucide-react'

import Empty from '@/components/Empty'
import VideoCard from '@/components/VideoCard'
import VideoGridContainer from '@/components/VideoGridContainer'
import VideoSkeleton from '@/components/VideoSkeleton'

type ViewType = 'movie' | 'tv' | 'show'

interface HotContentSectionProps {
  title: string
  viewType: ViewType
  items: DoubanItem[]
  loading: boolean
  onViewChange: (view: ViewType) => void
}

export default function HotContentSection({
  title,
  viewType,
  items,
  loading,
  onViewChange,
}: HotContentSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          {title}
        </h2>
        <button
          onClick={() => onViewChange(viewType)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          查看更多
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      {loading
        ? (
            <VideoGridContainer>
              {Array.from({ length: 18 }, (_, index) => (
                <VideoSkeleton key={index} />
              ))}
            </VideoGridContainer>
          )
        : items?.length > 0
          ? (
              <VideoGridContainer>
                {items.slice(0, 18).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="w-full">
                    <VideoCard
                      from="douban"
                      title={item.title}
                      poster={item.poster}
                      douban_id={item.id}
                      rate={item.rate}
                      year={item.year}
                      type={viewType === 'movie' ? 'movie' : ''}
                      showRank={true}
                      rankNumber={index + 1}
                      showSource={false}
                      showEpisodes={false}
                      showYear={false}
                    />
                  </div>
                ))}
              </VideoGridContainer>
            )
          : (
              <Empty />
            )}
    </section>
  )
}
