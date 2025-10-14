interface SourceLoadingOverlayProps {
  isLoading: boolean
  loadingStage?: 'initing' | 'sourceChanging'
}

export default function SourceLoadingOverlay({
  isLoading,
  loadingStage = 'sourceChanging',
}: SourceLoadingOverlayProps) {
  if (!isLoading)
    return null

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex items-center justify-center !z-[200] transition-all duration-300">
      <div className="text-center max-w-md mx-auto px-6">
        {/* 动画影院图标 */}
        <div className="relative mb-8">
          <div className="relative mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-white text-4xl">🎬</div>
            {/* 旋转光环 */}
            <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-spin"></div>
          </div>

          {/* 浮动粒子效果 - 增大浮动距离 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div
              className="absolute w-2 h-2 bg-green-400 rounded-full animate-bounce"
              style={{
                animationDuration: '2s',
                top: '-20px',
                left: '-20px',
              }}
            >
            </div>
            <div
              className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
              style={{
                animationDuration: '2.5s',
                animationDelay: '0.5s',
                top: '-25px',
                right: '-25px',
              }}
            >
            </div>
            <div
              className="absolute w-1 h-1 bg-lime-400 rounded-full animate-bounce"
              style={{
                animationDuration: '3s',
                animationDelay: '1s',
                bottom: '-30px',
                left: '-15px',
              }}
            >
            </div>
            {/* 额外的粒子 */}
            <div
              className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"
              style={{
                animationDuration: '2.8s',
                animationDelay: '0.3s',
                top: '-15px',
                right: '-20px',
              }}
            >
            </div>
            <div
              className="absolute w-1 h-1 bg-green-300 rounded-full animate-bounce"
              style={{
                animationDuration: '3.2s',
                animationDelay: '1.5s',
                bottom: '-25px',
                right: '-15px',
              }}
            >
            </div>
          </div>
        </div>

        {/* 换源消息 */}
        <div className="space-y-2">
          <p className="text-xl font-semibold shimmer-text animate-pulse">
            {loadingStage === 'sourceChanging'
              ? '正在切换播放源...'
              : '视频加载中...'}
          </p>
        </div>
      </div>
    </div>
  )
}
