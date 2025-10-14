'use client'

import { Clover, Film, Home, Star, Tv, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// 运行时配置类型 - 现在在 src/types/global.d.ts 中定义

type ViewType = 'hot' | 'movie' | 'tv' | 'show' | 'custom'

interface MobileBottomNavProps {
  activeView?: ViewType
}

function MobileBottomNav({
  activeView: _activeView = 'hot',
}: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 处理导航点击
  const handleNavigation = (view: ViewType) => {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'hot') {
      params.delete('type')
    }
    else {
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
      icon: typeof Home
      label: string
      view?: ViewType
      href: string
    }>
  >([
    { icon: Home, label: '热门', view: 'hot', href: '/' },
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
    {
      icon: User,
      label: '我的',
      href: '/profile',
    },
  ])

  useEffect(() => {
    const runtimeConfig = window.RUNTIME_CONFIG
    const myItem = { icon: User, label: '我的', href: '/profile' }

    if (
      runtimeConfig?.CUSTOM_CATEGORIES
      && runtimeConfig.CUSTOM_CATEGORIES.length > 0
    ) {
      setNavItems((prevItems) => {
        // 移除"我的"项目，然后重新添加
        const itemsWithoutMy = prevItems.filter(
          item => item.label !== '我的',
        )
        return [
          ...itemsWithoutMy,
          {
            icon: Star,
            label: '自定义',
            view: 'custom',
            href: '/?type=custom',
          },
          myItem,
        ]
      })
    }
    else {
      setNavItems((prevItems) => {
        // 确保"我的"项目存在
        if (!prevItems.find(item => item.label === '我的')) {
          return [...prevItems, myItem]
        }
        return prevItems
      })
    }
  }, [])

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.view) {
      return isActiveView(item.view)
    }
    // 对于"我的"这种非视图项，使用路径匹配
    return pathname === item.href
  }

  return (
    <nav
      className="md:hidden fixed left-0 right-0 z-[999] bg-white/90 backdrop-blur-xl border-t border-gray-200/50 overflow-hidden dark:bg-gray-900/80 dark:border-gray-700/50"
      style={{
        /* 紧贴视口底部，同时在内部留出安全区高度 */
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <ul className="flex items-center overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <li
              key={item.href}
              className="flex-shrink-0"
              style={{ width: '20vw', minWidth: '20vw' }}
            >
              {item.view
                ? (
                  <button
                    onClick={() => handleNavigation(item.view as ViewType)}
                    className="flex flex-col items-center justify-center w-full h-14 gap-1 text-xs"
                  >
                    <item.icon
                      className={`h-6 w-6 ${
                        active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <span
                      className={
                        active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-300'
                      }
                    >
                      {item.label}
                    </span>
                  </button>
                )
                : (
                  <Link
                    href={item.href}
                    className="flex flex-col items-center justify-center w-full h-14 gap-1 text-xs"
                  >
                    <item.icon
                      className={`h-6 w-6 ${
                        active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <span
                      className={
                        active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-300'
                      }
                    >
                      {item.label}
                    </span>
                  </Link>
                )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default MobileBottomNav
