'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按钮变体
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  
  /**
   * 按钮尺寸
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * 是否全宽
   */
  fullWidth?: boolean
  
  /**
   * 是否加载中
   */
  loading?: boolean
  
  /**
   * 左侧图标
   */
  leftIcon?: ReactNode
  
  /**
   * 右侧图标
   */
  rightIcon?: ReactNode
  
  /**
   * 子元素
   */
  children: ReactNode
}

/**
 * 移动端优化的按钮组件
 * 提供更大的触摸区域和清晰的视觉反馈
 */
export default function MobileButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: MobileButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'active:scale-[0.98]',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  )

  const variantStyles = {
    primary: cn(
      'bg-primary text-white',
      'hover:bg-primary-dark',
      'active:bg-primary-dark',
      'focus:ring-primary',
      'shadow-sm'
    ),
    secondary: cn(
      'bg-gray-100 text-gray-900',
      'hover:bg-gray-200',
      'active:bg-gray-300',
      'focus:ring-gray-500'
    ),
    outline: cn(
      'bg-white text-gray-900 border-2 border-gray-300',
      'hover:bg-gray-50',
      'active:bg-gray-100',
      'focus:ring-gray-500'
    ),
    ghost: cn(
      'bg-transparent text-gray-900',
      'hover:bg-gray-100',
      'active:bg-gray-200',
      'focus:ring-gray-500'
    ),
    danger: cn(
      'bg-red-600 text-white',
      'hover:bg-red-700',
      'active:bg-red-800',
      'focus:ring-red-500',
      'shadow-sm'
    )
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2">
          {leftIcon}
        </span>
      )}
      
      <span>{children}</span>
      
      {!loading && rightIcon && (
        <span className="ml-2">
          {rightIcon}
        </span>
      )}
    </button>
  )
}

/**
 * 移动端浮动操作按钮（FAB）
 */
interface MobileFABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 图标
   */
  icon: ReactNode
  
  /**
   * 位置
   */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export function MobileFAB({
  icon,
  position = 'bottom-right',
  className,
  ...props
}: MobileFABProps) {
  const positionStyles = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2'
  }

  return (
    <button
      className={cn(
        'fixed z-40',
        'h-14 w-14 rounded-full',
        'bg-primary text-white shadow-lg',
        'flex items-center justify-center',
        'transition-all duration-200',
        'active:scale-95',
        'hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        positionStyles[position],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  )
}

/**
 * 移动端按钮组
 */
interface MobileButtonGroupProps {
  /**
   * 子元素
   */
  children: ReactNode
  
  /**
   * 方向
   */
  direction?: 'horizontal' | 'vertical'
  
  /**
   * 自定义类名
   */
  className?: string
}

export function MobileButtonGroup({
  children,
  direction = 'horizontal',
  className
}: MobileButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex gap-3',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {children}
    </div>
  )
}

