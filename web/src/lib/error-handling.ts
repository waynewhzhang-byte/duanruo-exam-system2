/**
 * Comprehensive error handling utilities for API calls and form validation
 */

import { APIError } from './api'
import { ErrorResponse } from './schemas'
import { z } from 'zod'

// Error types for different scenarios
export type AppError = 
  | APIError
  | ValidationError
  | NetworkError
  | UnknownError

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class UnknownError extends Error {
  constructor(message: string = 'An unexpected error occurred') {
    super(message)
    this.name = 'UnknownError'
  }
}

// Error message mapping for common API error codes
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'INVALID_CREDENTIALS': '用户名或密码错误',
  'TOKEN_EXPIRED': '登录已过期，请重新登录',
  'UNAUTHORIZED': '您没有权限执行此操作',
  'FORBIDDEN': '访问被拒绝',
  
  // Validation errors
  'VALIDATION_ERROR': '输入数据不符合要求',
  'REQUIRED_FIELD_MISSING': '必填字段不能为空',
  'INVALID_FORMAT': '数据格式不正确',
  'DUPLICATE_ENTRY': '数据已存在',
  
  // Application errors
  'APPLICATION_NOT_FOUND': '申请不存在',
  'EXAM_NOT_FOUND': '考试不存在',
  'INVALID_REGISTRATION_WINDOW': '不在报名时间范围内',
  'APPLICATION_ALREADY_SUBMITTED': '申请已提交，无法重复提交',
  'INVALID_APPLICATION_STATUS': '申请状态不允许此操作',
  
  // File errors
  'FILE_NOT_FOUND': '文件不存在',
  'FILE_TOO_LARGE': '文件大小超过限制',
  'INVALID_FILE_TYPE': '不支持的文件类型',
  'UPLOAD_FAILED': '文件上传失败',
  'VIRUS_DETECTED': '文件包含病毒，上传被拒绝',
  
  // Review errors
  'REVIEW_NOT_ALLOWED': '您没有权限审核此申请',
  'REVIEW_ALREADY_COMPLETED': '此申请已完成审核',
  'INVALID_REVIEW_STAGE': '审核阶段不正确',
  
  // Payment errors
  'PAYMENT_FAILED': '支付失败',
  'PAYMENT_ALREADY_COMPLETED': '已完成支付',
  'INVALID_PAYMENT_AMOUNT': '支付金额不正确',
  
  // Network errors
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT_ERROR': '请求超时，请重试',
  'SERVER_ERROR': '服务器错误，请稍后重试',
  
  // Generic errors
  'UNKNOWN_ERROR': '发生未知错误，请联系管理员',
  'MAINTENANCE_MODE': '系统维护中，请稍后访问',
}

// Get user-friendly error message
export function getErrorMessage(error: AppError | string): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error
  }
  
  if (error instanceof APIError) {
    return ERROR_MESSAGES[error.code] || error.message
  }
  
  if (error instanceof ValidationError) {
    return ERROR_MESSAGES[error.code] || error.message
  }
  
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
}

// Error handling for React components
export function handleError(error: unknown): AppError {
  if (error instanceof APIError || 
      error instanceof ValidationError || 
      error instanceof NetworkError) {
    return error
  }
  
  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('connection')) {
      return new NetworkError(error.message)
    }
    
    return new UnknownError(error.message)
  }
  
  return new UnknownError('An unexpected error occurred')
}

// Zod validation error handler
export function handleZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map(err => {
    const field = err.path.join('.')
    const message = err.message
    return new ValidationError(field, message, 'VALIDATION_ERROR')
  })
}

// Error notification helper
export interface ErrorNotification {
  title: string
  message: string
  type: 'error' | 'warning' | 'info'
  duration?: number
}

export function createErrorNotification(error: AppError): ErrorNotification {
  if (error instanceof APIError) {
    if (error.isUnauthorized) {
      return {
        title: '认证失败',
        message: getErrorMessage(error),
        type: 'warning',
        duration: 5000,
      }
    }
    
    if (error.isForbidden) {
      return {
        title: '权限不足',
        message: getErrorMessage(error),
        type: 'warning',
        duration: 5000,
      }
    }
    
    if (error.isValidationError) {
      return {
        title: '输入错误',
        message: getErrorMessage(error),
        type: 'warning',
        duration: 4000,
      }
    }
    
    if (error.status >= 500) {
      return {
        title: '服务器错误',
        message: getErrorMessage(error),
        type: 'error',
        duration: 6000,
      }
    }
  }
  
  if (error instanceof NetworkError) {
    return {
      title: '网络错误',
      message: getErrorMessage(error),
      type: 'error',
      duration: 5000,
    }
  }
  
  if (error instanceof ValidationError) {
    return {
      title: '验证错误',
      message: getErrorMessage(error),
      type: 'warning',
      duration: 4000,
    }
  }
  
  return {
    title: '错误',
    message: getErrorMessage(error),
    type: 'error',
    duration: 5000,
  }
}

// Retry logic for failed requests
export interface RetryOptions {
  maxRetries: number
  delay: number
  backoff: boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options

  let lastError: Error = new Error('Retry failed')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on certain errors
      if (error instanceof APIError) {
        if (error.isUnauthorized || error.isForbidden || error.isValidationError) {
          throw error
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  throw lastError
}

// Error boundary helper for React
export function isRecoverableError(error: AppError): boolean {
  if (error instanceof APIError) {
    // Network errors and server errors are potentially recoverable
    return error.status === 0 || error.status >= 500
  }
  
  if (error instanceof NetworkError) {
    return true
  }
  
  return false
}

// Form error helper
export function getFieldError(
  errors: ValidationError[],
  fieldName: string
): string | undefined {
  const error = errors.find(err => err.field === fieldName)
  return error ? getErrorMessage(error) : undefined
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      const error = handleError(event.reason)
      const notification = createErrorNotification(error)
      
      // You can integrate with your notification system here
      console.error('Error notification:', notification)
    })
  }
}
