'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  // 设置相关状态
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true)
  const [doubanProxyUrl, setDoubanProxyUrl] = useState('')
  const [imageProxyUrl, setImageProxyUrl] = useState('')
  const [enableOptimization, setEnableOptimization] = useState(true)
  const [enableImageProxy, setEnableImageProxy] = useState(false)
  const [enableDoubanProxy, setEnableDoubanProxy] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 从 localStorage 读取设置
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedAggregateSearch = localStorage.getItem(
        'defaultAggregateSearch',
      )
      if (savedAggregateSearch !== null) {
        setDefaultAggregateSearch(JSON.parse(savedAggregateSearch))
      }

      const savedEnableDoubanProxy = localStorage.getItem('enableDoubanProxy')
      const defaultDoubanProxy
        = (window as { RUNTIME_CONFIG?: { DOUBAN_PROXY?: string } })
          .RUNTIME_CONFIG
          ?.DOUBAN_PROXY || ''
      if (savedEnableDoubanProxy !== null) {
        setEnableDoubanProxy(JSON.parse(savedEnableDoubanProxy))
      }
      else if (defaultDoubanProxy) {
        setEnableDoubanProxy(true)
      }

      const savedDoubanProxyUrl = localStorage.getItem('doubanProxyUrl')
      if (savedDoubanProxyUrl !== null) {
        setDoubanProxyUrl(savedDoubanProxyUrl)
      }
      else if (defaultDoubanProxy) {
        setDoubanProxyUrl(defaultDoubanProxy)
      }

      const savedEnableImageProxy = localStorage.getItem('enableImageProxy')
      const defaultImageProxy
        = (window as { RUNTIME_CONFIG?: { IMAGE_PROXY?: string } }).RUNTIME_CONFIG?.IMAGE_PROXY || ''
      if (savedEnableImageProxy !== null) {
        setEnableImageProxy(JSON.parse(savedEnableImageProxy))
      }
      else if (defaultImageProxy) {
        setEnableImageProxy(true)
      }

      const savedImageProxyUrl = localStorage.getItem('imageProxyUrl')
      if (savedImageProxyUrl !== null) {
        setImageProxyUrl(savedImageProxyUrl)
      }
      else if (defaultImageProxy) {
        setImageProxyUrl(defaultImageProxy)
      }

      const savedEnableOptimization
        = localStorage.getItem('enableOptimization')
      if (savedEnableOptimization !== null) {
        setEnableOptimization(JSON.parse(savedEnableOptimization))
      }
    }
  }, [])

  // 设置相关的处理函数
  const handleAggregateToggle = (value: boolean) => {
    setDefaultAggregateSearch(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(value))
    }
  }

  const handleDoubanProxyUrlChange = (value: string) => {
    setDoubanProxyUrl(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyUrl', value)
    }
  }

  const handleImageProxyUrlChange = (value: string) => {
    setImageProxyUrl(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageProxyUrl', value)
    }
  }

  const handleOptimizationToggle = (value: boolean) => {
    setEnableOptimization(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableOptimization', JSON.stringify(value))
    }
  }

  const handleImageProxyToggle = (value: boolean) => {
    setEnableImageProxy(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableImageProxy', JSON.stringify(value))
    }
  }

  const handleDoubanProxyToggle = (value: boolean) => {
    setEnableDoubanProxy(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableDoubanProxy', JSON.stringify(value))
    }
  }

  const handleResetSettings = () => {
    const defaultImageProxy
      = (window as { RUNTIME_CONFIG?: { IMAGE_PROXY?: string } }).RUNTIME_CONFIG?.IMAGE_PROXY || ''
    const defaultDoubanProxy
      = (window as { RUNTIME_CONFIG?: { DOUBAN_PROXY?: string } }).RUNTIME_CONFIG?.DOUBAN_PROXY || ''

    setDefaultAggregateSearch(true)
    setEnableOptimization(true)
    setDoubanProxyUrl(defaultDoubanProxy)
    setEnableDoubanProxy(!!defaultDoubanProxy)
    setEnableImageProxy(!!defaultImageProxy)
    setImageProxyUrl(defaultImageProxy)

    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(true))
      localStorage.setItem('enableOptimization', JSON.stringify(true))
      localStorage.setItem('doubanProxyUrl', defaultDoubanProxy)
      localStorage.setItem(
        'enableDoubanProxy',
        JSON.stringify(!!defaultDoubanProxy),
      )
      localStorage.setItem(
        'enableImageProxy',
        JSON.stringify(!!defaultImageProxy),
      )
      localStorage.setItem('imageProxyUrl', defaultImageProxy)
    }
  }

  if (!isOpen || !mounted) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] p-2 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 设置面板 */}
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              本地设置
            </h3>
            <button
              onClick={handleResetSettings}
              className="px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="重置为默认设置"
            >
              重置
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-full h-full" />
          </button>
        </div>

        {/* 设置项 */}
        <div className="space-y-6">
          {/* 默认聚合搜索结果 */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                默认聚合搜索结果
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                搜索时默认按标题和年份聚合显示结果
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={defaultAggregateSearch}
                  onChange={e => handleAggregateToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>

          {/* 优选和测速 */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启用优选和测速
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                如出现播放器劫持问题可关闭
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableOptimization}
                  onChange={e => handleOptimizationToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* 豆瓣代理开关 */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启用豆瓣代理
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                启用后，豆瓣数据将通过代理服务器获取
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableDoubanProxy}
                  onChange={e => handleDoubanProxyToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>

          {/* 豆瓣代理地址设置 */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                豆瓣代理地址
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                仅在启用豆瓣代理时生效，留空则使用服务器 API
              </p>
            </div>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                enableDoubanProxy
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600 cursor-not-allowed'
              }`}
              placeholder="例如: https://proxy.example.com/fetch?url="
              value={doubanProxyUrl}
              onChange={e => handleDoubanProxyUrlChange(e.target.value)}
              disabled={!enableDoubanProxy}
            />
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* 图片代理开关 */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启用图片代理
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                启用后，所有图片加载将通过代理服务器
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableImageProxy}
                  onChange={e => handleImageProxyToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>

          {/* 图片代理地址设置 */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                图片代理地址
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                仅在启用图片代理时生效
              </p>
            </div>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                enableImageProxy
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600 cursor-not-allowed'
              }`}
              placeholder="例如: https://imageproxy.example.com/?url="
              value={imageProxyUrl}
              onChange={e => handleImageProxyUrlChange(e.target.value)}
              disabled={!enableImageProxy}
            />
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            这些设置保存在本地浏览器中
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
