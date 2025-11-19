/**
 * Statistical card component for displaying key metrics
 */

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/loading'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  loading?: boolean
  error?: boolean
  className?: string
  valueColor?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  loading = false,
  error = false,
  className,
  valueColor = 'default',
  size = 'md'
}: StatCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const valueColorClasses = {
    default: 'text-gray-900',
    primary: 'text-primary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  }

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card className={clsx(sizeClasses[size], className)}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
            <div className="ml-4">
              <div className={clsx(iconSizeClasses[size], 'bg-gray-200 rounded animate-pulse')}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={clsx(sizeClasses[size], className)}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-red-600 text-sm mt-1">加载失败</p>
            </div>
            {icon && (
              <div className="ml-4 text-gray-400">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={clsx(sizeClasses[size], className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={clsx(
              'font-bold',
              valueSizeClasses[size],
              valueColorClasses[valueColor]
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {trend && (
              <div className={clsx(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2',
                getTrendColor()
              )}>
                {getTrendIcon()}
                <span className="ml-1">
                  {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={clsx('ml-4 text-gray-400', iconSizeClasses[size])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Preset stat cards for common metrics
interface QuickStatProps {
  loading?: boolean
  error?: boolean
}

export function TotalExamsCard({ value, trend, ...props }: { value?: number; trend?: StatCardProps['trend'] } & QuickStatProps) {
  return (
    <StatCard
      title="总考试数"
      value={value || 0}
      icon={<span className="text-2xl">📝</span>}
      trend={trend}
      valueColor="primary"
      {...props}
    />
  )
}

export function TotalApplicationsCard({ value, trend, ...props }: { value?: number; trend?: StatCardProps['trend'] } & QuickStatProps) {
  return (
    <StatCard
      title="总申请数"
      value={value || 0}
      icon={<span className="text-2xl">📋</span>}
      trend={trend}
      valueColor="success"
      {...props}
    />
  )
}

export function PendingReviewsCard({ value, trend, ...props }: { value?: number; trend?: StatCardProps['trend'] } & QuickStatProps) {
  return (
    <StatCard
      title="待审核"
      value={value || 0}
      icon={<span className="text-2xl">⏳</span>}
      trend={trend}
      valueColor="warning"
      {...props}
    />
  )
}

export function TotalRevenueCard({ value, trend, ...props }: { value?: number; trend?: StatCardProps['trend'] } & QuickStatProps) {
  return (
    <StatCard
      title="总收入"
      value={value ? `¥${value.toLocaleString()}` : '¥0'}
      icon={<span className="text-2xl">💰</span>}
      trend={trend}
      valueColor="success"
      {...props}
    />
  )
}

export function ActiveUsersCard({ value, trend, ...props }: { value?: number; trend?: StatCardProps['trend'] } & QuickStatProps) {
  return (
    <StatCard
      title="活跃用户"
      value={value || 0}
      icon={<span className="text-2xl">👥</span>}
      trend={trend}
      valueColor="primary"
      {...props}
    />
  )
}

export function SystemUptimeCard({ value, trend, ...props }: { value?: number; trend?: StatCardProps['trend'] } & QuickStatProps) {
  return (
    <StatCard
      title="系统可用性"
      value={value ? `${value.toFixed(2)}%` : '0%'}
      icon={<span className="text-2xl">🟢</span>}
      trend={trend}
      valueColor={value && value >= 99.9 ? 'success' : value && value >= 99 ? 'warning' : 'danger'}
      {...props}
    />
  )
}

