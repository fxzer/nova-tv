import { ImagePlaceholder } from '@/components/ImagePlaceholder'

function VideoSkeleton() {
  return (
    <div className="w-full">
      <div className="group relative w-full rounded-lg bg-transparent shadow-none flex flex-col">
        {/* 图片占位符 - 骨架屏效果 */}
        <ImagePlaceholder aspectRatio="aspect-[2/3]" />

        {/* 信息层骨架 */}
        <div className="h-4 mt-2 w-full bg-gray-200   dark:bg-gray-500/40 rounded animate-pulse mb-2"></div>
      </div>
    </div>
  )
}

export default VideoSkeleton
