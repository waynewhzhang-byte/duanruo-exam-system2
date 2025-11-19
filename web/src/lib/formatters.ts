/**
 * Formatting utility functions
 * 格式化工具函数
 */

import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * Format date-time string to display format
 * 格式化日期时间字符串为显示格式
 * @param dateStr - Date string in format "yyyy-MM-dd HH:mm:ss"
 * @param formatStr - Output format (default: "yyyy-MM-dd HH:mm:ss")
 */
export function formatDateTime(
  dateStr: string | null | undefined,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr.replace(' ', 'T'))
    return format(date, formatStr, { locale: zhCN })
  } catch (error) {
    console.error('Failed to format date:', dateStr, error)
    return dateStr
  }
}

/**
 * Format date string to display format
 * 格式化日期字符串
 */
export function formatDate(dateStr: string | null | undefined): string {
  return formatDateTime(dateStr, 'yyyy-MM-dd')
}

/**
 * Format time string to display format
 * 格式化时间字符串
 */
export function formatTime(dateStr: string | null | undefined): string {
  return formatDateTime(dateStr, 'HH:mm:ss')
}

/**
 * Format date to relative time (e.g., "2小时前")
 * 格式化为相对时间
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr.replace(' ', 'T'))
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  } catch (error) {
    console.error('Failed to format relative time:', dateStr, error)
    return dateStr
  }
}

/**
 * Format file size in bytes to human-readable format
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Format currency amount
 * 格式化货币金额
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'CNY'
): string {
  if (amount === null || amount === undefined) return '-'

  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formatter.format(amount)
}

/**
 * Format percentage
 * 格式化百分比
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format phone number
 * 格式化手机号 (隐藏中间4位)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-'
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(7)}`
  }
  return phone
}

/**
 * Format ID card number
 * 格式化身份证号 (隐藏中间部分)
 */
export function formatIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '-'
  if (idCard.length === 18) {
    return `${idCard.slice(0, 6)}********${idCard.slice(14)}`
  }
  return idCard
}

/**
 * Format email
 * 格式化邮箱 (隐藏部分字符)
 */
export function formatEmail(email: string | null | undefined): string {
  if (!email) return '-'
  const [username, domain] = email.split('@')
  if (!domain) return email

  const visibleChars = Math.min(3, Math.floor(username.length / 2))
  const maskedUsername = username.slice(0, visibleChars) + '***'

  return `${maskedUsername}@${domain}`
}

/**
 * Format number with thousand separators
 * 格式化数字 (千分位分隔)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat('zh-CN').format(num)
}

/**
 * Truncate text with ellipsis
 * 截断文本并添加省略号
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format duration in minutes to human-readable format
 * 格式化时长 (分钟)
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}分钟`
  } else if (mins === 0) {
    return `${hours}小时`
  } else {
    return `${hours}小时${mins}分钟`
  }
}

/**
 * Format score
 * 格式化分数
 */
export function formatScore(
  score: number | null | undefined,
  maxScore?: number
): string {
  if (score === null || score === undefined) return '-'

  if (maxScore) {
    return `${score}/${maxScore}`
  }

  return score.toString()
}

/**
 * Format boolean to Chinese
 * 格式化布尔值为中文
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return value ? '是' : '否'
}

/**
 * Format array to comma-separated string
 * 格式化数组为逗号分隔的字符串
 */
export function formatArray(
  arr: string[] | null | undefined,
  separator: string = ', '
): string {
  if (!arr || arr.length === 0) return '-'
  return arr.join(separator)
}

/**
 * Parse date-time string to Date object
 * 解析日期时间字符串为Date对象
 */
export function parseDateTime(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  try {
    return parseISO(dateStr.replace(' ', 'T'))
  } catch (error) {
    console.error('Failed to parse date:', dateStr, error)
    return null
  }
}

/**
 * Check if date is in the past
 * 检查日期是否已过期
 */
export function isPast(dateStr: string | null | undefined): boolean {
  const date = parseDateTime(dateStr)
  if (!date) return false
  return date < new Date()
}

/**
 * Check if date is in the future
 * 检查日期是否在未来
 */
export function isFuture(dateStr: string | null | undefined): boolean {
  const date = parseDateTime(dateStr)
  if (!date) return false
  return date > new Date()
}

/**
 * Check if current time is between start and end
 * 检查当前时间是否在指定范围内
 */
export function isBetween(
  startStr: string | null | undefined,
  endStr: string | null | undefined
): boolean {
  const start = parseDateTime(startStr)
  const end = parseDateTime(endStr)
  if (!start || !end) return false

  const now = new Date()
  return now >= start && now <= end
}

