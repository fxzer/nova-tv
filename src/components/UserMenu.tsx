'use client'

import type { Favorite, PlayRecord } from '@/lib/db.client'
import {
  Clock,
  Heart,
  KeyRound,
  LogOut,
  Settings,
  Shield,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useCallback, useEffect, useRef, useState } from 'react'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import CollectionModal from '@/components/CollectionModal'
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

export const UserMenu: React.FC = () => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [isWatchHistoryOpen, setIsWatchHistoryOpen] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [watchHistoryCount, setWatchHistoryCount] = useState(0)
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null)
  const [storageType, setStorageType] = useState<string>('localstorage')
  const [mounted, setMounted] = useState(false)

  // 用于点击外部关闭的 ref
  const menuRef = useRef<HTMLDivElement>(null)

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
        = (window as any).RUNTIME_CONFIG?.STORAGE_TYPE || 'localstorage'
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
      catch (error) {
        console.warn('版本检查失败:', error)
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

        setFavoritesCount(Object.keys(allFavorites).length)
        setWatchHistoryCount(Object.keys(allPlayRecords).length)
      }
      catch (error) {
        console.warn('获取数据数量失败:', error)
      }
    }

    loadCounts()

    // 监听收藏更新事件
    const unsubscribeFavorites = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, Favorite>) => {
        setFavoritesCount(Object.keys(newFavorites).length)
      },
    )

    // 监听播放记录更新事件
    const unsubscribePlayRecords = subscribeToDataUpdates(
      'playRecordsUpdated',
      (newRecords: Record<string, PlayRecord>) => {
        setWatchHistoryCount(Object.keys(newRecords).length)
      },
    )

    return () => {
      unsubscribeFavorites()
      unsubscribePlayRecords()
    }
  }, [])

  const handleMenuClick = () => {
    setIsOpen(!isOpen)
  }

  const handleCloseMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  // 点击外部关闭功能
  useEffect(() => {
    if (!isOpen)
      return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, handleCloseMenu])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    }
    catch (error) {
      console.error('注销请求失败:', error)
    }
    window.location.href = '/'
  }

  const handleAdminPanel = () => {
    router.push('/admin')
  }

  const handleChangePassword = () => {
    setIsOpen(false)
    setIsChangePasswordOpen(true)
  }

  const handleChangePasswordSuccess = async () => {
    // 修改密码成功后执行登出
    await handleLogout()
  }

  const handleSettings = () => {
    setIsOpen(false)
    setIsSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  const handleCollection = () => {
    setIsOpen(false)
    setIsCollectionOpen(true)
  }

  const handleCloseCollection = () => {
    setIsCollectionOpen(false)
  }

  const handleWatchHistory = () => {
    setIsOpen(false)
    setIsWatchHistoryOpen(true)
  }

  const handleCloseWatchHistory = () => {
    setIsWatchHistoryOpen(false)
  }

  // 检查是否显示管理面板按钮
  const showAdminPanel
    = authInfo?.role === 'owner' || authInfo?.role === 'admin'

  // 检查是否显示修改密码按钮
  const showChangePassword
    = authInfo?.role !== 'owner' && storageType !== 'localstorage'

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

  // 菜单面板内容
  const menuPanel = (
    <>
      {/* 菜单面板 */}
      <div
        ref={menuRef}
        className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-[1001] border border-gray-200/50 dark:border-gray-700/50 overflow-hidden select-none"
      >
        {/* 用户信息区域 */}
        <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                当前用户
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
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
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                {authInfo?.username || 'default'}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                数据存储：
                {storageType === 'localstorage' ? '本地' : storageType}
              </div>
            </div>
          </div>
        </div>

        {/* 菜单项 */}
        <div className="py-1">
          {/* 我的收藏按钮 */}
          <button
            onClick={handleCollection}
            className="w-full px-3 py-2 text-left flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">我的收藏</span>
            </div>
            {favoritesCount > 0 && (
              <span className="min-w-[20px] h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
          </button>

          {/* 观看历史按钮 */}
          <button
            onClick={handleWatchHistory}
            className="w-full px-3 py-2 text-left flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">观看历史</span>
            </div>
            {watchHistoryCount > 0 && (
              <span className="min-w-[20px] h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {watchHistoryCount > 99 ? '99+' : watchHistoryCount}
              </span>
            )}
          </button>

          {/* 设置按钮 */}
          <button
            onClick={handleSettings}
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">本地设置</span>
          </button>

          {/* 管理面板按钮 */}
          {showAdminPanel && (
            <button
              onClick={handleAdminPanel}
              className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">管理面板</span>
            </button>
          )}

          {/* 修改密码按钮 */}
          {showChangePassword && (
            <button
              onClick={handleChangePassword}
              className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <KeyRound className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">修改密码</span>
            </button>
          )}

          {/* 分割线 */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* 登出按钮 */}
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">退出登录</span>
          </button>

          {/* 分割线 */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* 版本信息 */}
          <button
            onClick={() =>
              window.open('https://github.com/fxzer/nova-tv/tree/dev', '_blank')}
            className="w-full px-3 py-2 text-center flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-xs"
          >
            <div className="flex items-center gap-1">
              <span className="font-mono">
                v
                {CURRENT_VERSION}
              </span>
              {!isChecking
                && updateStatus
                && updateStatus !== UpdateStatus.FETCH_FAILED && (
                <div
                  className={`w-2 h-2 rounded-full -translate-y-2 ${
                    updateStatus === UpdateStatus.HAS_UPDATE
                      ? 'bg-yellow-500'
                      : updateStatus === UpdateStatus.NO_UPDATE
                        ? 'bg-green-400'
                        : ''
                  }`}
                >
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="relative">
        <button
          onClick={handleMenuClick}
          className="w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
          aria-label="User Menu"
        >
          <User className="w-full h-full" />
        </button>
        {updateStatus === UpdateStatus.HAS_UPDATE && (
          <div className="absolute top-[2px] right-[2px] w-2 h-2 bg-yellow-500 rounded-full"></div>
        )}

        {/* 菜单面板 */}
        {isOpen && mounted && menuPanel}
      </div>

      {/* 设置面板 */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={handleCloseSettings} />

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={handleChangePasswordSuccess}
      />

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
    </>
  )
}
