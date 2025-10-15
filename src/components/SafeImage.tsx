import React, { useState } from 'react'
import Image from 'next/image'
import { processImageUrlWithFallback } from '@/lib/utils'

interface SafeImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  unoptimized?: boolean
  fallbackSrc?: string
  onError?: () => void
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  sizes,
  priority = false,
  loading = 'lazy',
  unoptimized = false,
  fallbackSrc,
  onError,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(() =>
    processImageUrlWithFallback(src, fallbackSrc || src)
  )

  const handleError = () => {
    if (!imageError) {
      setImageError(true)

      // 如果代理图片失败，尝试使用原始图片
      if (src && imageSrc !== src && imageSrc.includes('/api/image-proxy')) {
        console.warn(`图片代理失败，尝试使用原始图片: ${src}`)
        setImageSrc(src)
      } else {
        console.warn(`图片加载失败: ${src}`)
        onError?.()
      }
    }
  }

  // 当 src 改变时重置状态
  React.useEffect(() => {
    setImageError(false)
    setImageSrc(processImageUrlWithFallback(src, fallbackSrc || src))
  }, [src, fallbackSrc])

  // 如果没有有效的图片源，不渲染图片
  if (!src || (imageError && imageSrc === src)) {
    return null
  }

  const imageProps = {
    src: imageSrc,
    alt,
    className,
    onError: handleError,
    priority,
    loading,
    unoptimized,
  }

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        className="object-cover" 
        sizes={sizes}
      />
    )
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
      sizes={sizes}
    />
  )
}
