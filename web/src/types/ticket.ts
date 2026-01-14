/**
 * Ticket Template and Admission Ticket Types
 * 准考证模板和准考证相关类型定义
 */

import { z } from 'zod'

// ===========================
// Ticket Number Rule Types
// ===========================

export type TicketNumberRuleType =
  | 'FIXED_PREFIX'      // 固定前缀
  | 'YEAR'              // 年份 (YYYY)
  | 'MONTH'             // 月份 (MM)
  | 'DAY'               // 日期 (DD)
  | 'EXAM_CODE'         // 考试代码
  | 'POSITION_CODE'     // 岗位代码
  | 'SUBJECT_CODE'      // 科目代码
  | 'SEQUENCE'          // 顺序号
  | 'RANDOM'            // 随机数
  | 'CHECKSUM'          // 校验位

export interface TicketNumberRuleComponent {
  type: TicketNumberRuleType
  value?: string        // For FIXED_PREFIX
  length?: number       // For SEQUENCE, RANDOM
  format?: string       // For date components (YYYY, MM, DD, YY, etc.)
  padding?: 'left' | 'right' | 'none'
  padChar?: string
}

export interface TicketNumberRule {
  name: string
  description?: string
  components: TicketNumberRuleComponent[]
  separator?: string    // Separator between components
  example?: string      // Example output
}

// ===========================
// Ticket Template Types
// ===========================

export interface TicketTemplate {
  id?: string
  examId: string
  ticketNumberRule: TicketNumberRule
  qrCodeEnabled: boolean
  barcodeEnabled: boolean
  logoUrl?: string
  headerText?: string
  footerText?: string
  includePhoto: boolean
  includeExamInfo: boolean
  includeVenueInfo: boolean
  includeCandidateInfo: boolean
  customFields?: Record<string, string>
  templateStyle?: TicketTemplateStyle
  createdAt?: string
  updatedAt?: string
  // 准考证编号组成配置
  includeExamCode?: boolean      // 是否包含考试代码
  includeExamName?: boolean      // 是否包含考试名称
  includePositionCode?: boolean  // 是否包含岗位代码
  includePositionName?: boolean  // 是否包含岗位名称
  separator?: string             // 分隔符
  customPrefix?: string          // 自定义前缀
}

export interface TicketTemplateStyle {
  pageSize: 'A4' | 'A5' | 'LETTER'
  orientation: 'PORTRAIT' | 'LANDSCAPE'
  fontSize: number
  fontFamily: string
  primaryColor?: string
  secondaryColor?: string
  borderEnabled: boolean
  borderColor?: string
  borderWidth?: number
}

// ===========================
// Ticket Types
// ===========================

export interface Ticket {
  id: string
  ticketNumber: string
  applicationId: string
  examId: string
  candidateId: string
  candidateName: string
  candidateIdCard?: string
  candidatePhoto?: string
  examName: string
  examDate?: string
  venueId?: string
  venueName?: string
  roomNumber?: string
  seatNumber?: string
  subjectName?: string
  qrCodeData?: string
  barcodeData?: string
  pdfUrl?: string
  status: TicketStatus
  generatedAt?: string
  validFrom?: string
  validUntil?: string
}

export type TicketStatus =
  | 'VALID'         // 有效
  | 'USED'          // 已使用
  | 'EXPIRED'       // 已过期
  | 'CANCELLED'     // 已取消
  | 'REVOKED'       // 已撤销

// ===========================
// Batch Generation Types
// ===========================

export interface BatchGenerateTicketsRequest {
  examId: string
  applicationIds?: string[]  // If empty, generate for all eligible applications
  positionIds?: string[]     // Filter by positions
  subjectIds?: string[]      // Filter by subjects
  overwriteExisting?: boolean
}

export interface BatchGenerateTicketsResponse {
  totalRequested: number
  successCount: number
  failureCount: number
  skippedCount: number
  tickets: Ticket[]
  errors?: Array<{
    applicationId: string
    reason: string
  }>
}

// ===========================
// Ticket Statistics Types
// ===========================

export interface TicketStatistics {
  examId: string
  totalGenerated: number
  validCount: number
  usedCount: number
  expiredCount: number
  cancelledCount: number
  revokedCount: number
  byPosition: Array<{
    positionId: string
    positionName: string
    count: number
  }>
  bySubject: Array<{
    subjectId: string
    subjectName: string
    count: number
  }>
  byVenue?: Array<{
    venueId: string
    venueName: string
    count: number
  }>
}

// ===========================
// Ticket Validation Types
// ===========================

export interface TicketValidationRequest {
  ticketNumber?: string
  qrCode?: string
  barcode?: string
}

export interface TicketValidationResponse {
  valid: boolean
  ticket?: Ticket
  reason?: string
  validationTime: string
}

export interface TicketVerificationRequest {
  ticketId: string
  verificationCode?: string
}

export interface TicketVerificationResponse {
  verified: boolean
  ticket?: Ticket
  message?: string
}

// ===========================
// Zod Schemas for Validation
// ===========================

export const TicketNumberRuleComponentSchema = z.object({
  type: z.enum([
    'FIXED_PREFIX',
    'YEAR',
    'MONTH',
    'DAY',
    'EXAM_CODE',
    'POSITION_CODE',
    'SUBJECT_CODE',
    'SEQUENCE',
    'RANDOM',
    'CHECKSUM',
  ]),
  value: z.string().optional(),
  length: z.number().int().positive().optional(),
  format: z.string().optional(),
  padding: z.enum(['left', 'right', 'none']).optional(),
  padChar: z.string().length(1).optional(),
})

export const TicketNumberRuleSchema = z.object({
  name: z.string().min(1, '规则名称不能为空'),
  description: z.string().optional(),
  components: z.array(TicketNumberRuleComponentSchema).min(1, '至少需要一个组件'),
  separator: z.string().optional(),
  example: z.string().optional(),
})

export const TicketTemplateStyleSchema = z.object({
  pageSize: z.enum(['A4', 'A5', 'LETTER']),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
  fontSize: z.number().int().min(8).max(24),
  fontFamily: z.string(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  borderEnabled: z.boolean(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
})

export const TicketTemplateSchema = z.object({
  id: z.string().optional(),
  examId: z.string().uuid('无效的考试ID'),
  ticketNumberRule: TicketNumberRuleSchema,
  qrCodeEnabled: z.boolean(),
  barcodeEnabled: z.boolean(),
  logoUrl: z.string().url('无效的Logo URL').optional(),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  includePhoto: z.boolean(),
  includeExamInfo: z.boolean(),
  includeVenueInfo: z.boolean(),
  includeCandidateInfo: z.boolean(),
  customFields: z.record(z.string()).optional(),
  templateStyle: TicketTemplateStyleSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const TicketStatusSchema = z.enum(['VALID', 'USED', 'EXPIRED', 'CANCELLED', 'REVOKED'])

export const TicketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  applicationId: z.string(),
  examId: z.string(),
  candidateId: z.string(),
  candidateName: z.string(),
  candidateIdCard: z.string().optional(),
  candidatePhoto: z.string().optional(),
  examName: z.string(),
  examDate: z.string().optional(),
  venueId: z.string().optional(),
  venueName: z.string().optional(),
  roomNumber: z.string().optional(),
  seatNumber: z.string().optional(),
  subjectName: z.string().optional(),
  qrCodeData: z.string().optional(),
  barcodeData: z.string().optional(),
  pdfUrl: z.string().optional(),
  status: TicketStatusSchema,
  generatedAt: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
})

export const BatchGenerateTicketsRequestSchema = z.object({
  examId: z.string().uuid('无效的考试ID'),
  applicationIds: z.array(z.string().uuid()).optional(),
  positionIds: z.array(z.string().uuid()).optional(),
  subjectIds: z.array(z.string().uuid()).optional(),
  overwriteExisting: z.boolean().optional(),
})

export const BatchGenerateTicketsResponseSchema = z.object({
  totalRequested: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  skippedCount: z.number(),
  tickets: z.array(TicketSchema),
  errors: z.array(z.object({
    applicationId: z.string(),
    reason: z.string(),
  })).optional(),
})

export const TicketStatisticsSchema = z.object({
  examId: z.string(),
  totalGenerated: z.number(),
  validCount: z.number(),
  usedCount: z.number(),
  expiredCount: z.number(),
  cancelledCount: z.number(),
  revokedCount: z.number(),
  byPosition: z.array(z.object({
    positionId: z.string(),
    positionName: z.string(),
    count: z.number(),
  })),
  bySubject: z.array(z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    count: z.number(),
  })),
  byVenue: z.array(z.object({
    venueId: z.string(),
    venueName: z.string(),
    count: z.number(),
  })).optional(),
})

export const TicketValidationRequestSchema = z.object({
  ticketNumber: z.string().optional(),
  qrCode: z.string().optional(),
  barcode: z.string().optional(),
}).refine(
  (data) => data.ticketNumber || data.qrCode || data.barcode,
  { message: '必须提供准考证号、二维码或条形码中的至少一项' }
)

export const TicketValidationResponseSchema = z.object({
  valid: z.boolean(),
  ticket: TicketSchema.optional(),
  reason: z.string().optional(),
  validationTime: z.string(),
})

export const TicketVerificationRequestSchema = z.object({
  ticketId: z.string(),
  verificationCode: z.string().optional(),
})

export const TicketVerificationResponseSchema = z.object({
  verified: z.boolean(),
  ticket: TicketSchema.optional(),
  message: z.string().optional(),
})

// ===========================
// Predefined Template Presets
// ===========================

export const TICKET_NUMBER_RULE_PRESETS: Record<string, TicketNumberRule> = {
  STANDARD: {
    name: '标准格式',
    description: '年份-考试代码-顺序号 (例: 2024-EXAM001-000001)',
    components: [
      { type: 'YEAR', format: 'YYYY' },
      { type: 'EXAM_CODE' },
      { type: 'SEQUENCE', length: 6, padding: 'left', padChar: '0' },
    ],
    separator: '-',
    example: '2024-EXAM001-000001',
  },
  SIMPLE: {
    name: '简洁格式',
    description: '考试代码+顺序号 (例: EXAM001000001)',
    components: [
      { type: 'EXAM_CODE' },
      { type: 'SEQUENCE', length: 6, padding: 'left', padChar: '0' },
    ],
    separator: '',
    example: 'EXAM001000001',
  },
  DETAILED: {
    name: '详细格式',
    description: '年月日-考试-岗位-顺序号 (例: 20240315-EXAM001-POS001-0001)',
    components: [
      { type: 'YEAR', format: 'YYYY' },
      { type: 'MONTH', format: 'MM' },
      { type: 'DAY', format: 'DD' },
      { type: 'EXAM_CODE' },
      { type: 'POSITION_CODE' },
      { type: 'SEQUENCE', length: 4, padding: 'left', padChar: '0' },
    ],
    separator: '-',
    example: '20240315-EXAM001-POS001-0001',
  },
  WITH_CHECKSUM: {
    name: '带校验位',
    description: '年份-考试代码-顺序号-校验位 (例: 2024-EXAM001-000001-7)',
    components: [
      { type: 'YEAR', format: 'YYYY' },
      { type: 'EXAM_CODE' },
      { type: 'SEQUENCE', length: 6, padding: 'left', padChar: '0' },
      { type: 'CHECKSUM' },
    ],
    separator: '-',
    example: '2024-EXAM001-000001-7',
  },
}

export const DEFAULT_TICKET_TEMPLATE_STYLE: TicketTemplateStyle = {
  pageSize: 'A4',
  orientation: 'PORTRAIT',
  fontSize: 12,
  fontFamily: 'SimSun',
  primaryColor: '#000000',
  secondaryColor: '#666666',
  borderEnabled: true,
  borderColor: '#000000',
  borderWidth: 1,
}

export const DEFAULT_TICKET_TEMPLATE: Partial<TicketTemplate> = {
  qrCodeEnabled: true,
  barcodeEnabled: false,
  includePhoto: true,
  includeExamInfo: true,
  includeVenueInfo: true,
  includeCandidateInfo: true,
  templateStyle: DEFAULT_TICKET_TEMPLATE_STYLE,
}
