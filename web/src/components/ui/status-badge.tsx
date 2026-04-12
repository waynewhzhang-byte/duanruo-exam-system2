/**
 * Status Badge Component
 * 状态徽章组件
 */

import { z } from 'zod'
import { cn } from '@/lib/utils'
import type {
  ApplicationStatus,
  ExamStatus,
  PaymentStatus,
  NotificationStatus,
} from '@/lib/schemas'
import {
  FileStatus,
} from '@/lib/schemas'
import {
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getExamStatusLabel,
  getExamStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getFileStatusLabel,
} from '@/lib/helpers'
import { NOTIFICATION_STATUS_LABELS, FILE_STATUS_LABELS } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-gray-100 text-gray-800',
        className
      )}
    >
      {status}
    </span>
  )
}

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const label = getApplicationStatusLabel(status)
  const colorClass = getApplicationStatusColor(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

interface ExamStatusBadgeProps {
  status: string
  className?: string
}

export function ExamStatusBadge({ status, className }: ExamStatusBadgeProps) {
  const label = getExamStatusLabel(status)
  const colorClass = getExamStatusColor(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const label = getPaymentStatusLabel(status)
  const colorClass = getPaymentStatusColor(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

interface FileStatusBadgeProps {
  status: z.infer<typeof FileStatus>
  className?: string
}

export function FileStatusBadge({ status, className }: FileStatusBadgeProps) {
  const label = getFileStatusLabel(status)

  const colorMap: Record<z.infer<typeof FileStatus>, string> = {
    UPLOADING: 'bg-blue-100 text-blue-800',
    UPLOADED: 'bg-green-100 text-green-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    DELETED: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    QUARANTINED: 'bg-amber-100 text-amber-900',
  }

  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-800'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

interface NotificationStatusBadgeProps {
  status: NotificationStatus
  className?: string
}

export function NotificationStatusBadge({ status, className }: NotificationStatusBadgeProps) {
  const label = NOTIFICATION_STATUS_LABELS[status] || status

  const colorMap: Record<NotificationStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    READ: 'bg-gray-100 text-gray-800',
  }

  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-800'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

