'use client'

import { Clover, Film, Flame, Star, Tv } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// 运行时配置类型 - 现在在 src/types/global.d.ts 中定义

type ViewType = 'hot' | 'movie' | 'tv' | 'show' | 'custom'

interface NavigationProps {
  activeView: ViewType | null
}

const Navigation: React.FC<NavigationProps> = ({ activeView }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // 处理导航点击
  const handleNavigation = (view: ViewType) => {
    const params = new URLSearchParams()
    if (view !== 'hot') {
      params.set('type', view)
    }
    router.push(`/?${params.toString()}`)
  }

  // 判断当前视图是否活跃
  const isActiveView = (view: ViewType): boolean => {
    // 只在首页时才激活导航项
    if (pathname !== '/') {
      return false
    }

    const currentType = searchParams.get('type') as ViewType
    if (view === 'hot') {
      return !currentType
    }
    return currentType === view
  }
  const [navItems, setNavItems] = useState<
    Array<{
      icon: typeof Flame
      label: string
      view: ViewType
      href: string
    }>
  >([
    {
      icon: Flame,
      label: '热门',
      view: 'hot',
      href: '/',
    },
    {
      icon: Film,
      label: '电影',
      view: 'movie',
      href: '/?type=movie',
    },
    {
      icon: Tv,
      label: '剧集',
      view: 'tv',
      href: '/?type=tv',
    },
    {
      icon: Clover,
      label: '综艺',
      view: 'show',
      href: '/?type=show',
    },
  ])

  useEffect(() => {
    const runtimeConfig = window.RUNTIME_CONFIG
    if (
      runtimeConfig?.CUSTOM_CATEGORIES
      && runtimeConfig.CUSTOM_CATEGORIES.length > 0
    ) {
      setNavItems(prevItems => [
        ...prevItems,
        {
          icon: Star,
          label: '自定义',
          view: 'custom',
          href: '/?type=custom',
        },
      ])
    }
  }, [])

  return (
    <nav className="hidden md:flex items-center space-x-1  pl-2 ">
      {navItems.map((item) => {
        const isActive = activeView ? isActiveView(item.view) : false
        const Icon = item.icon

        return (
          <button
            key={item.label}
            onClick={() => handleNavigation(item.view)}
            data-active={isActive}
            className={'group flex items-center rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-400/10 hover:text-gray-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 transition-colors duration-200 dark:text-gray-300 dark:hover:text-gray-100 dark:data-[active=true]:bg-green-500/20 dark:data-[active=true]:text-green-400 '}
          >
            <Icon className="h-4 w-4 dark:group-hover:text-gray-100 data-[active=true]:text-green-700 dark:data-[active=true]:text-green-400" />
            <span className="ml-2">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default Navigation
