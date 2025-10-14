'use client'

import { useRouter } from 'next/navigation'

interface PlayErrorStateProps {
  error: string
}

export default function PlayErrorState({ error }: PlayErrorStateProps) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="text-center max-w-md mx-auto px-6">
        {/* 错误图标 */}
        <div className="relative mb-8">
          <div className="relative mx-auto w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-white text-4xl">😵</div>
            {/* 脉冲效果 */}
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-20 animate-pulse"></div>
          </div>

          {/* 浮动错误粒子 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-2 left-2 w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
            <div
              className="absolute top-4 right-4 w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.5s' }}
            >
            </div>
            <div
              className="absolute bottom-3 left-6 w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: '1s' }}
            >
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            哎呀，出现了一些问题
          </h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            请检查网络连接或尝试刷新页面
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleBack}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            '← 返回上页'
          </button>

          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            🔄 重新尝试
          </button>
        </div>
      </div>
    </div>
  )
}
