import React from 'react'

interface FilterLabelProps {
  label: string
  children: React.ReactNode
  className?: string
}

const FilterLabel: React.FC<FilterLabelProps> = ({
  label,
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[40px]">
        {label}
      </span>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export default FilterLabel
