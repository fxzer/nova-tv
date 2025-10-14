import React from 'react'

interface SortOrderButtonProps {
  descending: boolean
  onToggle: () => void
  className?: string
}

/**
 * 排序切换按钮组件，支持正序/倒序切换
 */
const SortOrderButton: React.FC<SortOrderButtonProps> = ({
  descending,
  onToggle,
  className = '',
}) => {
  return (
    <button
      className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:text-green-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-white/20 transition-colors ${
        descending ? '' : 'rotate-180'
      } ${className}`}
      onClick={onToggle}
      title={descending ? '倒序' : '正序'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6h7m-7 6h7m-7 6h9m2-9l3-3l3 3m-3-3v12"
        />
      </svg>
    </button>
  )
}

export default SortOrderButton
