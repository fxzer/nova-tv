'use client'

import { useSearchParams } from 'next/navigation'

import Logo from './Logo'
import Navigation from './Navigation'
import SearchBox from './SearchBox'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

type ViewType = 'hot' | 'movie' | 'tv' | 'show' | 'custom'

function Header() {
  const searchParams = useSearchParams()
  const currentView = (searchParams.get('type') as ViewType) || 'hot'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[999] bg-white/60 backdrop-blur-lg border-b border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="px-2 sm:px-10 max-w-[95%] mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation Items - 移动端隐藏 */}
          <Navigation activeView={currentView} />

          {/* Search Bar - 桌面端和移动端都显示 */}
          <SearchBox />

          {/* Desktop User Menu and Theme Toggle - 桌面端显示 */}
          <div className="hidden relative md:flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>

          {/* Mobile Controls - 移动端只显示主题切换 */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
