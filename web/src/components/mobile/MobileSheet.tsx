'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface MobileSheetProps {
  /**
   * 是否打开
   */
  open: boolean
  
  /**
   * 关闭回调
   */
  onClose: () => void
  
  /**
   * 标题
   */
  title?: string
  
  /**
   * 子元素
   */
  children: ReactNode
  
  /**
   * 位置
   */
  position?: 'bottom' | 'top' | 'left' | 'right'
  
  /**
   * 是否显示关闭按钮
   */
  showCloseButton?: boolean
  
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * 移动端底部抽屉组件
 * 从底部滑出的模态框，适合移动端操作
 */
export default function MobileSheet({
  open,
  onClose,
  title,
  children,
  position = 'bottom',
  showCloseButton = true,
  className
}: MobileSheetProps) {
  // 阻止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // 按ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  const positionStyles = {
    bottom: cn(
      'bottom-0 left-0 right-0',
      'rounded-t-2xl',
      'max-h-[90vh]',
      'animate-slide-up'
    ),
    top: cn(
      'top-0 left-0 right-0',
      'rounded-b-2xl',
      'max-h-[90vh]',
      'animate-slide-down'
    ),
    left: cn(
      'top-0 bottom-0 left-0',
      'rounded-r-2xl',
      'max-w-[90vw] w-80',
      'animate-slide-right'
    ),
    right: cn(
      'top-0 bottom-0 right-0',
      'rounded-l-2xl',
      'max-w-[90vw] w-80',
      'animate-slide-left'
    )
  }

  const content = (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* 抽屉内容 */}
      <div
        className={cn(
          'fixed z-50 bg-white shadow-xl',
          'flex flex-col',
          positionStyles[position],
          className
        )}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}

/**
 * 移动端操作表单组件
 * 用于显示一组操作选项
 */
interface MobileActionSheetProps {
  /**
   * 是否打开
   */
  open: boolean
  
  /**
   * 关闭回调
   */
  onClose: () => void
  
  /**
   * 标题
   */
  title?: string
  
  /**
   * 操作项
   */
  actions: Array<{
    label: string
    onClick: () => void
    icon?: ReactNode
    variant?: 'default' | 'danger'
    disabled?: boolean
  }>
  
  /**
   * 取消按钮文本
   */
  cancelText?: string
}

export function MobileActionSheet({
  open,
  onClose,
  title,
  actions,
  cancelText = '取消'
}: MobileActionSheetProps) {
  if (!open) return null

  const content = (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* 操作表单 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* 标题 */}
          {title && (
            <div className="px-4 py-3 text-center text-sm text-gray-600 border-b border-gray-200">
              {title}
            </div>
          )}
          
          {/* 操作项 */}
          <div className="divide-y divide-gray-200">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
                disabled={action.disabled}
                className={cn(
                  'w-full px-4 py-4 text-base font-medium',
                  'flex items-center justify-center',
                  'transition-colors',
                  'active:bg-gray-100',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  action.variant === 'danger' ? 'text-red-600' : 'text-gray-900'
                )}
              >
                {action.icon && (
                  <span className="mr-2">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 取消按钮 */}
        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-4 bg-white rounded-2xl text-base font-semibold text-gray-900 shadow-xl active:bg-gray-100 transition-colors"
        >
          {cancelText}
        </button>
      </div>
    </>
  )

  return createPortal(content, document.body)
}

