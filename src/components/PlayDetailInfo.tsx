import type { SearchResult } from '@/lib/types'

import Image from 'next/image'
import { processImageUrl } from '@/lib/utils'

interface PlayDetailInfoProps {
  videoTitle: string
  videoYear: string
  videoCover: string
  detail: SearchResult | null
}

export default function PlayDetailInfo({
  videoTitle,
  videoYear,
  videoCover,
  detail,
}: PlayDetailInfoProps) {
  return (
    <div className="flex gap-4">
      {/* 封面展示 */}
      <div className="hidden md:block">
        <div className="bg-gray-300 dark:bg-gray-700  aspect-[2/3] flex items-center justify-center rounded-xl overflow-hidden">
          {videoCover
            ? (
              <Image
                src={processImageUrl(videoCover)}
                alt={videoTitle}
                width={200}
                height={300}
                loading="lazy"
                className="object-cover"
              />
            )
            : (
              <span className="text-gray-600 dark:text-gray-400">封面图片</span>
            )}
        </div>
      </div>

      {/* 文字区 */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        {/* 标题 */}
        <h1 className="text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0 text-center md:text-left w-full">
          {videoTitle || '影片标题'}
        </h1>

        {/* 关键信息行 */}
        <div className="flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0">
          {detail?.class && (
            <span className="text-green-600 font-semibold">{detail.class}</span>
          )}
          {(detail?.year || videoYear) && (
            <span>{detail?.year || videoYear}</span>
          )}

          {detail?.type_name && <span>{detail.type_name}</span>}
          {detail?.source_name && (
            <span className="border border-gray-500/60 px-1 py-[1px] rounded">
              {detail.source_name}
            </span>
          )}
        </div>

        {/* 剧情简介 */}
        {detail?.desc && (
          <div
            className="mt-0 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide"
            style={{ whiteSpace: 'pre-line' }}
          >
            {detail.desc}
          </div>
        )}
      </div>
    </div>
  )
}
