/**
 * Helper utility functions
 * 通用辅助函数
 */

import { z } from 'zod'
import type {
  ApplicationStatus,
  ExamStatus,
  PaymentStatus,
  SubjectType,
} from './schemas'
import {
  FileStatus,
  UserRole,
} from './schemas'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  FILE_STATUS_LABELS,
  SUBJECT_TYPE_LABELS,
  USER_ROLE_LABELS,
  GENDER_LABELS,
  EDUCATION_LEVEL_LABELS,
  FILE_TYPE_ICONS,
} from './constants'

/**
 * Get application status label
 * 获取报名状态标签
 */
export function getApplicationStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_LABELS[status] || status
}

/**
 * Get application status color
 * 获取报名状态颜色
 */
export function getApplicationStatusColor(status: ApplicationStatus): string {
  return APPLICATION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get exam status label
 * 获取考试状态标签
 */
export function getExamStatusLabel(status: string): string {
  return EXAM_STATUS_LABELS[status] || status
}

/**
 * Get exam status color
 * 获取考试状态颜色
 */
export function getExamStatusColor(status: string): string {
  return EXAM_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get payment status label
 * 获取支付状态标签
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status] || status
}

/**
 * Get payment status color
 * 获取支付状态颜色
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  return PAYMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get file status label
 * 获取文件状态标签
 */
export function getFileStatusLabel(status: z.infer<typeof FileStatus>): string {
  return FILE_STATUS_LABELS[status] || status
}

/**
 * Get subject type label
 * 获取科目类型标签
 */
export function getSubjectTypeLabel(type: SubjectType): string {
  return SUBJECT_TYPE_LABELS[type] || type
}

/**
 * Get user role label
 * 获取用户角色标签
 */
export function getUserRoleLabel(role: z.infer<typeof UserRole>): string {
  return USER_ROLE_LABELS[role] || role
}

/**
 * Get gender label
 * 获取性别标签
 */
export function getGenderLabel(gender: string): string {
  return GENDER_LABELS[gender] || gender
}

/**
 * Get education level label
 * 获取学历标签
 */
export function getEducationLevelLabel(level: string): string {
  return EDUCATION_LEVEL_LABELS[level] || level
}

/**
 * Get file type icon
 * 获取文件类型图标
 */
export function getFileTypeIcon(contentType: string): string {
  return FILE_TYPE_ICONS[contentType] || FILE_TYPE_ICONS.default
}

/**
 * Check if application can be withdrawn
 * 检查报名是否可以撤销
 */
export function canWithdrawApplication(status: ApplicationStatus): boolean {
  const withdrawableStatuses: ApplicationStatus[] = [
    'SUBMITTED',
    'AUTO_PASSED',
    'PENDING_PRIMARY_REVIEW',
    'PRIMARY_PASSED',
    'PENDING_SECONDARY_REVIEW',
  ]
  return withdrawableStatuses.includes(status)
}

/**
 * Check if application can be resubmitted
 * 检查报名是否可以重新提交
 */
export function canResubmitApplication(status: ApplicationStatus): boolean {
  const resubmittableStatuses: ApplicationStatus[] = [
    'AUTO_REJECTED',
    'PRIMARY_REJECTED',
    'SECONDARY_REJECTED',
    'WITHDRAWN',
  ]
  return resubmittableStatuses.includes(status)
}

/**
 * Check if application needs payment
 * 检查报名是否需要支付
 */
export function needsPayment(status: ApplicationStatus): boolean {
  return status === 'APPROVED'
}

/**
 * Check if application is approved
 * 检查报名是否已通过审核
 */
export function isApplicationApproved(status: ApplicationStatus): boolean {
  const approvedStatuses: ApplicationStatus[] = [
    'APPROVED',
    'PAID',
    'TICKET_ISSUED',
  ]
  return approvedStatuses.includes(status)
}

/**
 * Check if application is rejected
 * 检查报名是否被拒绝
 */
export function isApplicationRejected(status: ApplicationStatus): boolean {
  const rejectedStatuses: ApplicationStatus[] = [
    'AUTO_REJECTED',
    'PRIMARY_REJECTED',
    'SECONDARY_REJECTED',
  ]
  return rejectedStatuses.includes(status)
}

/**
 * Check if application is in review
 * 检查报名是否在审核中
 */
export function isApplicationInReview(status: ApplicationStatus): boolean {
  const reviewStatuses: ApplicationStatus[] = [
    'PENDING_PRIMARY_REVIEW',
    'PENDING_SECONDARY_REVIEW',
  ]
  return reviewStatuses.includes(status)
}

/**
 * Check if exam is open for registration
 * 检查考试是否开放报名
 */
export function isExamOpenForRegistration(
  status: string,
  registrationStart?: string,
  registrationEnd?: string
): boolean {
  if (status !== 'OPEN' && status !== 'REGISTRATION_OPEN') {
    return false
  }

  if (!registrationStart || !registrationEnd) {
    return true // If no dates specified, assume open
  }

  const now = new Date()
  const start = new Date(registrationStart.replace(' ', 'T'))
  const end = new Date(registrationEnd.replace(' ', 'T'))

  return now >= start && now <= end
}

/**
 * Check if user has role
 * 检查用户是否有指定角色
 */
export function hasRole(userRoles: string[], role: z.infer<typeof UserRole>): boolean {
  return userRoles.includes(role)
}

/**
 * Check if user has any of the roles
 * 检查用户是否有任一指定角色
 */
export function hasAnyRole(userRoles: string[], roles: z.infer<typeof UserRole>[]): boolean {
  return roles.some((role) => userRoles.includes(role))
}

/**
 * Check if user is admin
 * 检查用户是否是管理员
 */
export function isAdmin(userRoles: string[]): boolean {
  return hasAnyRole(userRoles, ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'])
}

/**
 * Check if user is reviewer
 * 检查用户是否是审核员
 */
export function isReviewer(userRoles: string[]): boolean {
  return hasAnyRole(userRoles, ['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER'])
}

/**
 * Check if user is candidate
 * 检查用户是否是考生
 */
export function isCandidate(userRoles: string[]): boolean {
  return hasRole(userRoles, 'CANDIDATE')
}

/**
 * Generate random ID
 * 生成随机ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Deep clone object
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Debounce function
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Sleep function
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 * 带指数退避的重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    backoff?: number
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        await sleep(delay * Math.pow(backoff, attempt - 1))
      }
    }
  }

  throw lastError
}

/**
 * Group array by key
 * 按键分组数组
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Remove duplicates from array
 * 数组去重
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return Array.from(new Set(array))
  }

  const seen = new Set()
  return array.filter((item) => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * Sort array by key
 * 按键排序数组
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Download file from URL
 * 从URL下载文件
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Copy text to clipboard
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

