interface PlayLoadingStateProps {
  loadingStage: 'searching' | 'preferring' | 'fetching' | 'ready'
  loadingMessage: string
  progress?: number // 0-100 的具体进度值
  stageDetail?: string // 当前阶段的详细信息
  estimatedTime?: number // 预计剩余时间（秒）
}

export default function PlayLoadingState({
  loadingStage,
  loadingMessage,
  progress = 0,
  stageDetail = '',
  estimatedTime,
}: PlayLoadingStateProps) {
  const getLoadingIcon = () => {
    switch (loadingStage) {
      case 'searching':
        return '🔍'
      case 'preferring':
        return '⚡'
      case 'fetching':
        return '🎬'
      case 'ready':
        return '✨'
      default:
        return '🔍'
    }
  }

  const getStageProgress = () => {
    // 直接使用传入的真实进度值
    if (progress > 0) {
      return Math.min(100, Math.max(0, progress))
    }

    // 没有进度值时，根据阶段返回基础进度
    const baseProgress = {
      searching: 0,
      preferring: 30,
      fetching: 70,
      ready: 90,
    }

    return baseProgress[loadingStage]
  }

  const getStageName = () => {
    // 基于真实进度计算阶段名称
    const currentProgress = getStageProgress()

    if (currentProgress >= 100) {
      return '准备就绪'
    }
    else if (currentProgress >= 75) {
      return '获取视频详情'
    }
    else if (currentProgress >= 25) {
      return '优选最佳播放源'
    }
    else if (currentProgress > 0) {
      return '搜索播放源'
    }
    else {
      // 如果没有进度值，回退到 loadingStage
      switch (loadingStage) {
        case 'searching':
          return '搜索播放源'
        case 'preferring':
          return '优选最佳播放源'
        case 'fetching':
          return '获取视频详情'
        case 'ready':
          return '准备就绪'
        default:
          return '加载中'
      }
    }
  }

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) {
      return `预计 ${Math.ceil(seconds)} 秒`
    }
    else {
      const minutes = Math.ceil(seconds / 60)
      return `预计 ${minutes} 分钟`
    }
  }

  return (
    <div className="flex items-center justify-center h-[100dvh] bg-transparent ">
      <div className="text-center max-w-md mx-auto px-6">
        {/* 动画影院图标 */}
        <div className="relative mb-8">
          <div className="relative mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-white text-4xl">{getLoadingIcon()}</div>
            {/* 旋转光环 */}
            <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-spin"></div>
          </div>

          {/* 浮动粒子效果 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-float-up"></div>
            <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-float-down"></div>
            <div className="absolute bottom-3 left-6 w-1 h-1 bg-lime-400 rounded-full animate-float-circle"></div>
          </div>
        </div>

        {/* 进度指示器 */}
        <div className="mb-6 w-80 mx-auto">
          {/* 阶段指示器 */}
          <div className="flex justify-between mb-4">
            {['搜索', '优选', '详情', '就绪'].map((stageName, index) => {
              // 基于真实进度计算当前阶段
              const currentProgress = getStageProgress()
              let activeIndex = Math.floor(currentProgress / 25) // 每25%一个阶段
              activeIndex = Math.min(3, Math.max(0, activeIndex))

              const isActive = index <= activeIndex
              const isCurrent = index === activeIndex

              return (
                <div key={stageName} className="flex flex-col items-center">
                  <div
                    className={`w-[14px] h-[14px] transition-all duration-500 ${
                      isCurrent ? 'scale-125' : ''
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      className={
                        isCurrent
                          ? 'text-green-500'
                          : isActive
                            ? 'text-green-500'
                            : 'text-gray-300 dark:text-gray-600'
                      }
                    >
                      <circle cx="14" cy="14" r="0" fill="currentColor">
                        <animate
                          id="SVGHRb9bJhy"
                          fill="freeze"
                          attributeName="r"
                          begin="0;SVGUoIUme6Z.begin+0.4s"
                          calcMode="spline"
                          dur="1.2s"
                          keySplines=".52,.6,.25,.99"
                          values="0;11"
                        />
                        <animate
                          fill="freeze"
                          attributeName="opacity"
                          begin="0;SVGUoIUme6Z.begin+0.4s"
                          calcMode="spline"
                          dur="1.2s"
                          keySplines=".52,.6,.25,.99"
                          values="1;0"
                        />
                      </circle>
                      <circle cx="14" cy="14" r="0" fill="currentColor">
                        <animate
                          id="SVGaun8abat"
                          fill="freeze"
                          attributeName="r"
                          begin="SVGHRb9bJhy.begin+0.4s"
                          calcMode="spline"
                          dur="1.2s"
                          keySplines=".52,.6,.25,.99"
                          values="0;11"
                        />
                        <animate
                          fill="freeze"
                          attributeName="opacity"
                          begin="SVGHRb9bJhy.begin+0.4s"
                          calcMode="spline"
                          dur="1.2s"
                          keySplines=".52,.6,.25,.99"
                          values="1;0"
                        />
                      </circle>
                      <circle cx="14" cy="14" r="0" fill="currentColor">
                        <animate
                          id="SVGUoIUme6Z"
                          fill="freeze"
                          attributeName="r"
                          begin="SVGHRb9bJhy.begin+0.8s"
                          calcMode="spline"
                          dur="1.2s"
                          keySplines=".52,.6,.25,.99"
                          values="0;11"
                        />
                        <animate
                          fill="freeze"
                          attributeName="opacity"
                          begin="SVGHRb9bJhy.begin+0.8s"
                          calcMode="spline"
                          dur="1.2s"
                          keySplines=".52,.6,.25,.99"
                          values="1;0"
                        />
                      </circle>
                    </svg>
                  </div>
                  <span
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      isCurrent
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : isActive
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {stageName}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 主进度条 */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${getStageProgress()}%` }}
            >
              {/* 进度条光泽动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>

          {/* 进度百分比 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {Math.round(getStageProgress())}
              %
            </span>
            <span className="text-gray-500 dark:text-gray-500 text-xs">
              {getStageName()}
            </span>
          </div>
        </div>

        {/* 加载消息 */}
        <div className="space-y-3">
          <p className="text-xl font-semibold shimmer-text">{loadingMessage}</p>

          {/* 阶段详细信息 */}
          {stageDetail && (
            <p className="text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
              {stageDetail}
            </p>
          )}

          {/* 预计时间 */}
          {estimatedTime && (
            <p className="text-xs text-gray-500 dark:text-gray-500 animate-fade-in">
              {formatEstimatedTime(estimatedTime)}
            </p>
          )}

          {/* 阶段进度细节 */}
          <div className="mt-4 space-y-2">
            {progress > 0 && progress < 100 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>{stageDetail || '正在处理...'}</span>
                  <span>
                    {Math.round(progress)}
                    %
                  </span>
                </div>
              </div>
            )}

            {loadingStage === 'ready' && progress >= 100 && (
              <div className="text-xs text-green-600 dark:text-green-400">
                <span>✨ 播放器初始化完成，即将开始播放...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
