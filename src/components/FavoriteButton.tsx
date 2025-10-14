import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  favorited: boolean
  onToggle: (e?: React.MouseEvent) => void | Promise<void>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function FavoriteButton({
  favorited,
  onToggle,
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  }

  const iconClasses = favorited
    ? 'fill-red-600 stroke-red-600 hover:opacity-80'
    : 'fill-transparent dark:stroke-white stroke-black  hover:!stroke-red-500'

  return (
    <button
      onClick={onToggle}
      className={` transition-opacity  ${className}`}
      aria-label={favorited ? '取消收藏' : '添加收藏'}
    >
      <Heart
        className={`${sizeClasses[size]} ${iconClasses} transition-all duration-200 `}
        strokeWidth={1.5}
      />
    </button>
  )
}
