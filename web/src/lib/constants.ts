/**
 * Application constants
 * 应用常量定义
 */

import { z } from 'zod'
import type {
  ApplicationStatus,
  ExamStatus,
  PaymentStatus,
  NotificationStatus,
  SubjectType,
} from './schemas'
import {
  FileStatus,
  VirusScanStatus,
  UserRole,
} from './schemas'

/**
 * Application Status Labels
 * 报名状态标签
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  AUTO_REJECTED: '自动拒绝',
  AUTO_PASSED: '自动通过',
  PENDING_PRIMARY_REVIEW: '待一审',
  PRIMARY_REJECTED: '一审拒绝',
  PRIMARY_PASSED: '一审通过',
  PENDING_SECONDARY_REVIEW: '待二审',
  SECONDARY_REJECTED: '二审拒绝',
  APPROVED: '审核通过',
  PAID: '已缴费',
  TICKET_ISSUED: '已发证',
  WITHDRAWN: '已撤销',
  EXPIRED: '已过期',
}

/**
 * Application Status Colors (Tailwind CSS classes)
 * 报名状态颜色
 */
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  AUTO_REJECTED: 'bg-red-100 text-red-800',
  AUTO_PASSED: 'bg-green-100 text-green-800',
  PENDING_PRIMARY_REVIEW: 'bg-yellow-100 text-yellow-800',
  PRIMARY_REJECTED: 'bg-red-100 text-red-800',
  PRIMARY_PASSED: 'bg-green-100 text-green-800',
  PENDING_SECONDARY_REVIEW: 'bg-orange-100 text-orange-800',
  SECONDARY_REJECTED: 'bg-red-100 text-red-800',
  APPROVED: 'bg-green-100 text-green-800',
  PAID: 'bg-purple-100 text-purple-800',
  TICKET_ISSUED: 'bg-indigo-100 text-indigo-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
}

/**
 * Exam Status Labels
 * 考试状态标签
 */
export const EXAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  REGISTRATION_OPEN: '报名中',
  REGISTRATION_CLOSED: '报名结束',
  OPEN: '开放',
  CLOSED: '关闭',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

/**
 * Exam Status Colors
 * 考试状态颜色
 */
export const EXAM_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  REGISTRATION_OPEN: 'bg-green-100 text-green-800',
  REGISTRATION_CLOSED: 'bg-orange-100 text-orange-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

/**
 * Payment Status Labels
 * 支付状态标签
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: '待支付',
  PAID: '已支付',
  FAILED: '支付失败',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
}

/**
 * Payment Status Colors
 * 支付状态颜色
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

/**
 * File Status Labels
 * 文件状态标签
 */
export const FILE_STATUS_LABELS: Record<z.infer<typeof FileStatus>, string> = {
  UPLOADING: '上传中',
  UPLOADED: '已上传',
  AVAILABLE: '可用',
  CONFIRMED: '已确认',
  FAILED: '上传失败',
  DELETED: '已删除',
  EXPIRED: '已过期',
  QUARANTINED: '已隔离',
}

/**
 * Virus Scan Status Labels
 * 病毒扫描状态标签
 */
export const VIRUS_SCAN_STATUS_LABELS: Record<z.infer<typeof VirusScanStatus>, string> = {
  PENDING: '待扫描',
  SCANNING: '扫描中',
  CLEAN: '安全',
  INFECTED: '发现病毒',
  FAILED: '扫描失败',
  SKIPPED: '已跳过',
}

/**
 * Notification Status Labels
 * 通知状态标签
 */
export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  PENDING: '待发送',
  SENT: '已发送',
  FAILED: '发送失败',
  READ: '已读',
}

/**
 * Subject Type Labels
 * 科目类型标签
 */
export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  WRITTEN: '笔试',
  INTERVIEW: '面试',
  PRACTICAL: '实操',
  OTHER: '其他',
}

/**
 * User Role Labels
 * 用户角色标签
 */
export const USER_ROLE_LABELS: Record<z.infer<typeof UserRole>, string> = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  TENANT_ADMIN: '租户管理员',
  CANDIDATE: '考生',
  PRIMARY_REVIEWER: '一级审核员',
  SECONDARY_REVIEWER: '二级审核员',
  EXAMINER: '考官',
}

/**
 * Gender Labels
 * 性别标签
 */
export const GENDER_LABELS: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
}

/**
 * Education Level Labels
 * 学历标签
 */
export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  HIGH_SCHOOL: '高中',
  ASSOCIATE: '大专',
  BACHELOR: '本科',
  MASTER: '硕士',
  DOCTORATE: '博士',
}

/**
 * File Type Icons
 * 文件类型图标映射
 */
export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  default: '📎',
}

/**
 * Allowed File Types
 * 允许的文件类型
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
]

/**
 * Max File Size (10MB)
 * 最大文件大小
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Pagination Defaults
 * 分页默认值
 */
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/**
 * Date Format
 * 日期格式
 */
export const DATE_FORMAT = 'yyyy-MM-dd'
export const TIME_FORMAT = 'HH:mm:ss'
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss'

/**
 * API Base URL
 * API基础URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || '/api/v1'

/**
 * Application Routes
 * 应用路由
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Candidate routes
  CANDIDATE: {
    DASHBOARD: '/candidate',
    EXAMS: '/candidate/exams',
    EXAM_DETAIL: (examId: string) => `/candidate/exams/${examId}`,
    APPLICATIONS: '/candidate/applications',
    APPLICATION_DETAIL: (id: string) => `/candidate/applications/${id}`,
    TICKETS: '/candidate/tickets',
    SCORES: '/candidate/scores',
    PAYMENT: (applicationId: string) => `/candidate/payment/${applicationId}`,
  },
  
  // Reviewer routes
  REVIEWER: {
    DASHBOARD: '/reviewer',
    QUEUE: '/reviewer/queue',
    TASKS: '/reviewer/tasks',
    APPLICATION_DETAIL: (id: string) => `/reviewer/applications/${id}`,
  },
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin',
    EXAMS: '/admin/exams',
    EXAM_DETAIL: (examId: string) => `/admin/exams/${examId}`,
    POSITIONS: (examId: string) => `/admin/exams/${examId}/positions`,
    REVIEWERS: '/admin/reviewers',
    USERS: '/admin/users',
    TENANTS: '/admin/tenants',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
  },
} as const

/**
 * Query Keys for React Query
 * React Query查询键
 */
export const QUERY_KEYS = {
  EXAMS: 'exams',
  EXAM: 'exam',
  POSITIONS: 'positions',
  POSITION: 'position',
  SUBJECTS: 'subjects',
  APPLICATIONS: 'applications',
  APPLICATION: 'application',
  REVIEWS: 'reviews',
  TICKETS: 'tickets',
  PAYMENTS: 'payments',
  FILES: 'files',
  USERS: 'users',
  TENANTS: 'tenants',
  STATISTICS: 'statistics',
  NOTIFICATIONS: 'notifications',
} as const

