/**
 * Empty State Component
 * 空状态组件
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { FileQuestion, Inbox, Search, AlertCircle } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: 'inbox' | 'search' | 'file' | 'alert' | React.ReactNode
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon = 'inbox',
  title = '暂无数据',
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      const iconMap: Record<string, React.ReactNode> = {
        inbox: <Inbox className="h-12 w-12 text-gray-400" />,
        search: <Search className="h-12 w-12 text-gray-400" />,
        file: <FileQuestion className="h-12 w-12 text-gray-400" />,
        alert: <AlertCircle className="h-12 w-12 text-gray-400" />,
      }
      return iconMap[icon]
    }
    return icon
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4">{renderIcon()}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  error?: Error | string
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  error,
  title = '加载失败',
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage = error
    ? typeof error === 'string'
      ? error
      : error.message
    : undefined

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {(description || errorMessage) && (
        <p className="text-sm text-gray-500 max-w-md mb-6">
          {description || errorMessage}
        </p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          重试
        </Button>
      )}
    </div>
  )
}

