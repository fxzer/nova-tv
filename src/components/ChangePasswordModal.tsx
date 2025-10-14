import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ChangePasswordModalProps {
  /** 是否打开弹窗 */
  isOpen: boolean
  /** 关闭弹窗回调 */
  onClose: () => void
  /** 成功修改密码后的回调 */
  onSuccess?: () => void
}

/**
 * 修改密码弹窗组件
 */
const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [mounted, setMounted] = useState(false)

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 当弹窗关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setPasswordLoading(false)
    }
  }, [isOpen])

  const handleSubmitChangePassword = async () => {
    setPasswordError('')

    // 验证密码
    if (!newPassword) {
      setPasswordError('新密码不得为空')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || '修改密码失败')
        return
      }

      // 修改成功，关闭弹窗并执行成功回调
      onClose()
      onSuccess?.()
    }
    catch (error) {
      setPasswordError('网络错误，请稍后重试')
    }
    finally {
      setPasswordLoading(false)
    }
  }

  const handleClose = () => {
    if (!passwordLoading) {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] p-2 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* 修改密码面板 */}
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            修改密码
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
            disabled={passwordLoading}
          >
            <X className="w-full h-full" />
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-4">
          {/* 新密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              新密码
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="请输入新密码"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          {/* 确认密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              确认密码
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          {/* 错误信息 */}
          {passwordError && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {passwordError}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            disabled={passwordLoading}
          >
            取消
          </button>
          <button
            onClick={handleSubmitChangePassword}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={passwordLoading || !newPassword || !confirmPassword}
          >
            {passwordLoading ? '修改中...' : '确认修改'}
          </button>
        </div>

        {/* 底部说明 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            修改密码后需要重新登录
          </p>
        </div>
      </div>
    </div>
  )

  if (!isOpen || !mounted) {
    return null
  }

  return createPortal(modalContent, document.body)
}

export default ChangePasswordModal
