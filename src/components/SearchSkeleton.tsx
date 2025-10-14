'use client'

import VideoGridContainer from '@/components/VideoGridContainer'
import VideoSkeleton from '@/components/VideoSkeleton'

const SearchSkeleton: React.FC = () => {
  return (
    <section className="mb-12">
      {/* 标题骨架 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-500/40"></div>
        {/* 聚合开关骨架 */}
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse dark:bg-gray-500/40"></div>
          <div className="relative">
            <div className="w-9 h-5 bg-gray-300 rounded-full animate-pulse dark:bg-gray-600"></div>
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 横向导航菜单骨架 */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-800 relative">
          <div className="flex space-x-1 mb-1 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center rounded-lg px-3 py-2 h-9 w-20 bg-gray-200 animate-pulse dark:bg-gray-500/40 flex-shrink-0"
              >
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 视频卡片网格骨架 */}
      <VideoGridContainer>
        {Array.from({ length: 25 }).map((_, index) => (
          <VideoSkeleton key={index} />
        ))}
      </VideoGridContainer>
    </section>
  )
}

export default SearchSkeleton
