import VideoSkeleton from '@/components/VideoSkeleton'

interface VideoSkeletonProps {
  count?: number
}

export default function VideoSkeletonList({ count = 8 }: VideoSkeletonProps) {
  return Array.from({ length: count }, (_, index) => (
    <VideoSkeleton key={index} />
  ))
}
