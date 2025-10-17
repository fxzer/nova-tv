import React from 'react'

interface VideoGridContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * 统一的视频网格容器组件
 * 提供一致的布局和间距，用于所有视频卡片列表
 */
export default function VideoGridContainer({
  children,
  className = '',
}: VideoGridContainerProps) {
  return (
    <div
      className={`justify-start grid grid-cols-2 gap-x-4 gap-y-4 px-0 sm:px-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 sm:gap-x-6 sm:gap-y-6 ${className}`}
    >
      {children}
    </div>
  )
}
