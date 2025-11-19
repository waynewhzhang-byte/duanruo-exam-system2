/**
 * Validation utility functions
 * 验证工具函数
 */

/**
 * Validate Chinese ID card number
 * 验证中国身份证号码
 */
export function validateIdCard(idCard: string): boolean {
  if (!idCard || typeof idCard !== 'string') return false

  // 18位身份证号码正则
  const pattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/

  if (!pattern.test(idCard)) return false

  // 验证校验码
  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * factors[i]
  }

  const checkCode = checkCodes[sum % 11]
  return idCard[17].toUpperCase() === checkCode
}

/**
 * Validate Chinese mobile phone number
 * 验证中国手机号码
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false

  // 中国手机号正则 (1开头,第二位3-9,共11位)
  const pattern = /^1[3-9]\d{9}$/
  return pattern.test(phone)
}

/**
 * Validate email address
 * 验证邮箱地址
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  // 邮箱正则
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

/**
 * Validate password strength
 * 验证密码强度
 * 要求: 至少8位,包含大小写字母、数字和特殊字符
 */
export function validatePassword(password: string): {
  valid: boolean
  message?: string
} {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' }
  }

  if (password.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' }
  }

  if (password.length > 50) {
    return { valid: false, message: '密码最多50个字符' }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length

  if (strength < 3) {
    return {
      valid: false,
      message: '密码必须包含大写字母、小写字母、数字和特殊字符中的至少3种',
    }
  }

  return { valid: true }
}

/**
 * Validate username
 * 验证用户名
 * 要求: 3-50个字符,只能包含字母、数字、下划线和连字符
 */
export function validateUsername(username: string): {
  valid: boolean
  message?: string
} {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: '用户名不能为空' }
  }

  if (username.length < 3) {
    return { valid: false, message: '用户名至少需要3个字符' }
  }

  if (username.length > 50) {
    return { valid: false, message: '用户名最多50个字符' }
  }

  const pattern = /^[a-zA-Z0-9_-]+$/
  if (!pattern.test(username)) {
    return {
      valid: false,
      message: '用户名只能包含字母、数字、下划线和连字符',
    }
  }

  return { valid: true }
}

/**
 * Validate file type
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file || !allowedTypes || allowedTypes.length === 0) return false

  return allowedTypes.includes(file.type)
}

/**
 * Validate file size
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  if (!file || !maxSize) return false

  return file.size <= maxSize
}

/**
 * Validate URL
 * 验证URL
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate Chinese name
 * 验证中文姓名
 * 要求: 2-50个字符,只能包含中文、字母和·
 */
export function validateChineseName(name: string): {
  valid: boolean
  message?: string
} {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: '姓名不能为空' }
  }

  if (name.length < 2) {
    return { valid: false, message: '姓名至少需要2个字符' }
  }

  if (name.length > 50) {
    return { valid: false, message: '姓名最多50个字符' }
  }

  const pattern = /^[\u4e00-\u9fa5a-zA-Z·]+$/
  if (!pattern.test(name)) {
    return {
      valid: false,
      message: '姓名只能包含中文、字母和·',
    }
  }

  return { valid: true }
}

/**
 * Validate positive number
 * 验证正数
 */
export function validatePositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value)
}

/**
 * Validate integer
 * 验证整数
 */
export function validateInteger(value: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && !isNaN(value)
}

/**
 * Validate date range
 * 验证日期范围
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date
): {
  valid: boolean
  message?: string
} {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  if (isNaN(start.getTime())) {
    return { valid: false, message: '开始日期无效' }
  }

  if (isNaN(end.getTime())) {
    return { valid: false, message: '结束日期无效' }
  }

  if (start >= end) {
    return { valid: false, message: '开始日期必须早于结束日期' }
  }

  return { valid: true }
}

/**
 * Validate required field
 * 验证必填字段
 */
export function validateRequired(value: any): {
  valid: boolean
  message?: string
} {
  if (value === null || value === undefined) {
    return { valid: false, message: '此字段为必填项' }
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message: '此字段不能为空' }
  }

  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, message: '至少需要选择一项' }
  }

  return { valid: true }
}

/**
 * Validate min length
 * 验证最小长度
 */
export function validateMinLength(
  value: string,
  minLength: number
): {
  valid: boolean
  message?: string
} {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: '值无效' }
  }

  if (value.length < minLength) {
    return {
      valid: false,
      message: `至少需要${minLength}个字符`,
    }
  }

  return { valid: true }
}

/**
 * Validate max length
 * 验证最大长度
 */
export function validateMaxLength(
  value: string,
  maxLength: number
): {
  valid: boolean
  message?: string
} {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: '值无效' }
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      message: `最多${maxLength}个字符`,
    }
  }

  return { valid: true }
}

/**
 * Validate pattern
 * 验证正则表达式
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  message?: string
): {
  valid: boolean
  message?: string
} {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: '值无效' }
  }

  if (!pattern.test(value)) {
    return {
      valid: false,
      message: message || '格式不正确',
    }
  }

  return { valid: true }
}

