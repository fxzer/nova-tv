import { Trash2 } from 'lucide-react'

interface ClearButtonProps {
  onClear: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

/**
 * 统一的清空按钮组件
 * 支持自定义大小和样式
 */
export default function ClearButton({
  onClear,
  size = 'md',
  className = '',
  children = '清空',
}: ClearButtonProps) {
  // 根据尺寸设置图标大小
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-[14px] w-[14px]',
    lg: 'h-4 w-4',
  }

  // 根据尺寸设置文字大小
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm',
  }

  return (
    <button
      onClick={onClear}
      className={`flex items-center ${textSizes[size]} text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200 gap-1 ${className}`}
    >
      <Trash2 className={iconSizes[size]} />
      {children}
    </button>
  )
}
