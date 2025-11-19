import { z } from 'zod'

// Common UUID schema
export const UUID = z.string().uuid()

// Pagination parameters
export const PaginationParams = z.object({
  page: z.number().min(0).default(0),
  size: z.number().min(1).max(100).default(20),
})

// Date/time formats (matching backend: yyyy-MM-dd HH:mm:ss Asia/Shanghai)
export const DateTimeString = z.string().regex(
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  '日期时间格式应为 yyyy-MM-dd HH:mm:ss'
)

export const DateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  '日期格式应为 yyyy-MM-dd'
)

// Application status enum (matching backend state machine)
export const ApplicationStatus = z.enum([
  'DRAFT',
  'SUBMITTED',
  'AUTO_REJECTED',
  'AUTO_PASSED',
  'PENDING_PRIMARY_REVIEW',
  'PRIMARY_REJECTED',
  'PRIMARY_PASSED',
  'PENDING_SECONDARY_REVIEW',
  'SECONDARY_REJECTED',
  'APPROVED',
  'PAID',
  'TICKET_ISSUED',
  'WITHDRAWN',
  'EXPIRED'
])

// Review stages
export const ReviewStage = z.enum(['PRIMARY', 'SECONDARY'])

// File upload related
export const FileInfo = z.object({
  id: UUID,
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadedAt: DateTimeString,
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
})

// API response wrappers
export const ApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    success: z.boolean().default(true),
    message: z.string().optional(),
  })

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
    pageSize: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  })

// Common types
export type UUID = z.infer<typeof UUID>
export type PaginationParams = z.infer<typeof PaginationParams>
export type ApplicationStatus = z.infer<typeof ApplicationStatus>
export type ReviewStage = z.infer<typeof ReviewStage>
export type FileInfo = z.infer<typeof FileInfo>

// Status display helpers
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  AUTO_REJECTED: '自动拒绝',
  AUTO_PASSED: '自动通过',
  PENDING_PRIMARY_REVIEW: '等待初审',
  PRIMARY_REJECTED: '初审拒绝',
  PRIMARY_PASSED: '初审通过',
  PENDING_SECONDARY_REVIEW: '等待复审',
  SECONDARY_REJECTED: '复审拒绝',
  APPROVED: '审核通过',
  PAID: '已缴费',
  TICKET_ISSUED: '已发证',
  WITHDRAWN: '已撤回',
  EXPIRED: '已过期',
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  AUTO_REJECTED: 'red',
  AUTO_PASSED: 'green',
  PENDING_PRIMARY_REVIEW: 'yellow',
  PRIMARY_REJECTED: 'red',
  PRIMARY_PASSED: 'green',
  PENDING_SECONDARY_REVIEW: 'yellow',
  SECONDARY_REJECTED: 'red',
  APPROVED: 'green',
  PAID: 'green',
  TICKET_ISSUED: 'green',
  WITHDRAWN: 'gray',
  EXPIRED: 'gray',
}
