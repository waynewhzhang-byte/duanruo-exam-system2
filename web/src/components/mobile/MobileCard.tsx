'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface MobileCardProps {
  /**
   * 卡片标题
   */
  title?: string
  
  /**
   * 卡片描述
   */
  description?: string
  
  /**
   * 卡片内容
   */
  children?: ReactNode
  
  /**
   * 是否可点击
   */
  clickable?: boolean
  
  /**
   * 点击事件
   */
  onClick?: () => void
  
  /**
   * 自定义类名
   */
  className?: string
  
  /**
   * 是否显示右箭头
   */
  showArrow?: boolean
  
  /**
   * 卡片图标
   */
  icon?: ReactNode
  
  /**
   * 右侧内容
   */
  rightContent?: ReactNode
}

/**
 * 移动端优化的卡片组件
 * 提供触摸友好的交互体验
 */
export default function MobileCard({
  title,
  description,
  children,
  clickable = false,
  onClick,
  className,
  showArrow = false,
  icon,
  rightContent
}: MobileCardProps) {
  const isClickable = clickable || !!onClick

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        'transition-all duration-200',
        isClickable && [
          'active:scale-[0.98] active:shadow-md',
          'cursor-pointer'
        ],
        className
      )}
      onClick={onClick}
      {...(isClickable && {
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } },
        'aria-label': title || '卡片'
      })}
    >
      {/* 头部 */}
      {(title || description || icon) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 mr-3">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-gray-600 truncate mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {rightContent && (
            <div className="flex-shrink-0 ml-3">
              {rightContent}
            </div>
          )}
          
          {showArrow && !rightContent && (
            <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-400 ml-3" />
          )}
        </div>
      )}
      
      {/* 内容 */}
      {children && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * 移动端列表项组件
 * 用于构建列表视图
 */
interface MobileListItemProps {
  /**
   * 主标题
   */
  title: string
  
  /**
   * 副标题
   */
  subtitle?: string
  
  /**
   * 左侧图标
   */
  icon?: ReactNode
  
  /**
   * 右侧内容
   */
  rightContent?: ReactNode
  
  /**
   * 是否显示右箭头
   */
  showArrow?: boolean
  
  /**
   * 点击事件
   */
  onClick?: () => void
  
  /**
   * 自定义类名
   */
  className?: string
}

export function MobileListItem({
  title,
  subtitle,
  icon,
  rightContent,
  showArrow = true,
  onClick,
  className
}: MobileListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-white',
        'border-b border-gray-100 last:border-b-0',
        'transition-colors duration-200',
        onClick && [
          'active:bg-gray-50',
          'cursor-pointer'
        ],
        className
      )}
      onClick={onClick}
      {...(onClick && {
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } },
        'aria-label': title
      })}
    >
      <div className="flex items-center flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 mr-3">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-gray-900 truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-600 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {rightContent && (
        <div className="flex-shrink-0 ml-3">
          {rightContent}
        </div>
      )}
      
      {showArrow && !rightContent && (
        <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-400 ml-3" />
      )}
    </div>
  )
}

