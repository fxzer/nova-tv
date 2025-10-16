import Header from './Header'
import MobileBottomNav from './MobileBottomNav'

type ViewType = 'hot' | 'movie' | 'tv' | 'show' | 'custom'

interface PageLayoutProps {
  children: React.ReactNode
  activeView?: ViewType
  activePath?: string
  onViewChange?: (view: ViewType) => void
}

function PageLayout({
  children,
  activeView = 'hot',
  activePath: _activePath,
}: PageLayoutProps) {
  return (
    <div className="w-full min-h-screen">
      {/* 顶部导航 - 使用统一的 Header 组件 */}
      <Header />

      {/* 主内容区域 */}
      <div className="relative">
        {/* 主内容 */}
        <main className="pt-16 pb-32 md:pb-0">{children}</main>
      </div>

      {/* 移动端底部导航 */}
      <div className="md:hidden">
        <MobileBottomNav activeView={activeView} />
      </div>
    </div>
  )
}

export default PageLayout
