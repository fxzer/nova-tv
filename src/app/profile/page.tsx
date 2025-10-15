'use client'

import type { Favorite, PlayRecord } from '@/lib/db.client'
import { Clock, Heart, Settings, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useEffect, useState } from 'react'
import CollectionModal from '@/components/CollectionModal'
import PageLayout from '@/components/PageLayout'
import { SettingsPanel } from '@/components/SettingsPanel'

import WatchHistoryModal from '@/components/WatchHistoryModal'
import { getAuthInfoFromBrowserCookie } from '@/lib/auth'
import {

  getAllFavorites,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client'
import { checkForUpdates, CURRENT_VERSION, UpdateStatus } from '@/lib/version'

interface AuthInfo {
  username?: string
  role?: 'owner' | 'admin' | 'user'
}

export default function ProfilePage() {
  const router = useRouter()
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [isWatchHistoryOpen, setIsWatchHistoryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [watchHistoryCount, setWatchHistoryCount] = useState(0)
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null)
  const [storageType, setStorageType] = useState<string>('localstorage')
  const [mounted, setMounted] = useState(false)

  // 版本检查相关状态
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 获取认证信息和存储类型
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = getAuthInfoFromBrowserCookie()
      setAuthInfo(auth)

      const type
        = (window as { RUNTIME_CONFIG?: { STORAGE_TYPE?: string } })
          .RUNTIME_CONFIG
          ?.STORAGE_TYPE || 'localstorage'
      setStorageType(type)
    }
  }, [])

  // 版本检查
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates()
        setUpdateStatus(status)
      }
      catch {
        // 忽略版本检查失败
      }
      finally {
        setIsChecking(false)
      }
    }

    checkUpdate()
  }, [])

  // 获取收藏和观看历史数量
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const allFavorites = await getAllFavorites()
        const allPlayRecords = await getAllPlayRecords()

        setFavoritesCount(Object.keys(allFavorites)?.length)
        setWatchHistoryCount(Object.keys(allPlayRecords)?.length)
      }
      catch {
        // 忽略获取数据数量失败
      }
    }

    loadCounts()

    // 监听收藏更新事件
    const unsubscribeFavorites = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, Favorite>) => {
        setFavoritesCount(Object.keys(newFavorites)?.length)
      },
    )

    // 监听播放记录更新事件
    const unsubscribePlayRecords = subscribeToDataUpdates(
      'playRecordsUpdated',
      (newRecords: Record<string, PlayRecord>) => {
        setWatchHistoryCount(Object.keys(newRecords)?.length)
      },
    )

    return () => {
      unsubscribeFavorites()
      unsubscribePlayRecords()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    }
    catch {
      // 忽略注销请求失败
    }
    window.location.href = '/'
  }

  const handleAdminPanel = () => {
    router.push('/admin')
  }

  const handleCollection = () => {
    setIsCollectionOpen(true)
  }

  const handleCloseCollection = () => {
    setIsCollectionOpen(false)
  }

  const handleWatchHistory = () => {
    setIsWatchHistoryOpen(true)
  }

  const handleCloseWatchHistory = () => {
    setIsWatchHistoryOpen(false)
  }

  const handleSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  // 检查是否显示管理面板按钮
  const showAdminPanel
    = authInfo?.role === 'owner' || authInfo?.role === 'admin'

  // 角色中文映射
  const getRoleText = (role?: string) => {
    switch (role) {
      case 'owner':
        return '站长'
      case 'admin':
        return '管理员'
      case 'user':
        return '用户'
      default:
        return ''
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <PageLayout activePath="/profile">
      <div className="min-h-screen  pb-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 用户信息卡片 */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              用户信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">用户名</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {authInfo?.username || 'default'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (authInfo?.role || 'user') === 'owner'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : (authInfo?.role || 'user') === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {getRoleText(authInfo?.role || 'user')}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  数据存储
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {storageType === 'localstorage' ? '本地' : storageType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  版本信息
                </span>
                <button
                  onClick={() =>
                    window.open(
                      'https://github.com/fxzer/nova-tv/tree/dev',
                      '_blank',
                    )}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span className="font-mono">
                    v
                    {CURRENT_VERSION}
                  </span>
                  {!isChecking
                    && updateStatus
                    && updateStatus !== UpdateStatus.FETCH_FAILED && (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        updateStatus === UpdateStatus.HAS_UPDATE
                          ? 'bg-yellow-500'
                          : updateStatus === UpdateStatus.NO_UPDATE
                            ? 'bg-green-400'
                            : ''
                      }`}
                    >
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 功能卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 我的收藏 */}
            <button
              onClick={handleCollection}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    我的收藏
                  </h3>
                </div>
                {favoritesCount > 0 && (
                  <span className="min-w-[24px] h-6 bg-pink-500 text-white text-sm rounded-full flex items-center justify-center font-medium">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                查看和管理您收藏的影片
              </p>
            </button>

            {/* 观看历史 */}
            <button
              onClick={handleWatchHistory}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    观看历史
                  </h3>
                </div>
                {watchHistoryCount > 0 && (
                  <span className="min-w-[24px] h-6 bg-green-500 text-white text-sm rounded-full flex items-center justify-center font-medium">
                    {watchHistoryCount > 99 ? '99+' : watchHistoryCount}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                查看您的观看记录
              </p>
            </button>

            {/* 本地设置 */}
            <button
              onClick={handleSettings}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  本地设置
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                配置应用偏好设置
              </p>
            </button>

            {/* 管理面板 */}
            {showAdminPanel && (
              <button
                onClick={handleAdminPanel}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-shadow text-left"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    管理面板
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  系统管理和配置
                </p>
              </button>
            )}
          </div>

          {/* 退出登录按钮 */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="flex items-center justify-center gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium text-red-600 dark:text-red-400">
                退出登录
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 收藏模态框 */}
      <CollectionModal
        isOpen={isCollectionOpen}
        onClose={handleCloseCollection}
      />

      {/* 观看历史模态框 */}
      <WatchHistoryModal
        isOpen={isWatchHistoryOpen}
        onClose={handleCloseWatchHistory}
      />

      {/* 设置面板 */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </PageLayout>
  )
}
