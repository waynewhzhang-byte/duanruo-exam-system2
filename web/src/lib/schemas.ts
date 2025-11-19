/**
 * Zod schemas for API requests and responses
 * These schemas match the backend DTOs for type safety and validation
 */

import { z } from 'zod'

// Common types
export const UUID = z.string().uuid()
export const DateTimeString = z.string() // yyyy-MM-dd HH:mm:ss format

// Error and pagination schemas (re-exported from api.ts)
export const ErrorResponse = z.object({
  errorCode: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
  path: z.string().optional(),
}).transform((data) => ({
  code: data.errorCode,
  message: data.message,
  traceId: undefined,
  time: data.timestamp,
}))

export const PaginationResponse = <T extends z.ZodTypeAny>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
    pageSize: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  })

// Application Status enum (matching backend)
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

// Tenant schemas
export const TenantStatus = z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED'])

export const Tenant = z.object({
  id: UUID,
  name: z.string(),
  code: z.string().optional(), // Backend may not return code, only slug
  schemaName: z.string().optional(),
  slug: z.string(),
  status: TenantStatus,
  contactEmail: z.string(), // Relaxed email validation - backend validates on create/update
  contactPhone: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
  activatedAt: DateTimeString.nullable().optional(),
  deactivatedAt: DateTimeString.nullable().optional(),
})

export const TenantListResponse = z.object({
  content: z.array(Tenant),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(),
})

export const CreateTenantRequest = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
})

export const UpdateTenantRequest = z.object({
  name: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
})

export type TenantType = z.infer<typeof Tenant>
export type TenantListResponseType = z.infer<typeof TenantListResponse>
export type CreateTenantRequestType = z.infer<typeof CreateTenantRequest>
export type UpdateTenantRequestType = z.infer<typeof UpdateTenantRequest>

// File schemas
export const FileStatus = z.enum(['UPLOADING', 'UPLOADED', 'CONFIRMED', 'FAILED', 'DELETED'])
export const VirusScanStatus = z.enum(['PENDING', 'CLEAN', 'INFECTED', 'FAILED'])

export const FileInfoResponse = z.object({
  fileId: UUID,
  fileName: z.string(),
  originalName: z.string(),
  contentType: z.string(),
  fileSize: z.number(),
  status: FileStatus,
  virusScanStatus: VirusScanStatus,
  fieldKey: z.string(),
  applicationId: UUID.optional(),
  uploadedBy: z.string(),
  uploadedAt: DateTimeString,
  lastAccessedAt: DateTimeString.optional(),
  accessCount: z.number().optional(),
})

export const FileUploadUrlRequest = z.object({
  fileName: z.string(),
  contentType: z.string(),
  fieldKey: z.string(),
})

export const FileUploadUrlResponse = z.object({
  fileId: UUID,
  uploadUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  fieldKey: z.string(),
  expiresIn: z.number(),
})

export const FileUploadConfirmRequest = z.object({
  fileSize: z.number().optional(),
})

export const FileUploadConfirmResponse = z.object({
  fileId: UUID,
  status: FileStatus,
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  virusScanStatus: VirusScanStatus,
  uploadedAt: DateTimeString,
  message: z.string(),
})

export const FileListResponse = PaginationResponse(FileInfoResponse)
export type FileListResponse = z.infer<typeof FileListResponse>

export const FileBatchInfoResponse = z.object({
  files: z.array(FileInfoResponse),
  totalCount: z.number(),
  requestedBy: z.string(),
  requestedAt: DateTimeString,
})
export type FileBatchInfoResponse = z.infer<typeof FileBatchInfoResponse>

export const FileDeleteResponse = z.object({
  fileId: UUID,
  status: FileStatus,
  deletedBy: z.string(),
  message: z.string(),
})

export const ValidateTypeRequest = z.object({
  fileName: z.string(),
  contentType: z.string(),
  fieldKey: z.string(),
})

export const ValidateTypeResponse = z.object({
  valid: z.boolean(),
  reason: z.string(),
  allowedTypes: z.array(z.string()),
  maxSize: z.string(),
})

// Payment config schema
export const PaymentConfigResponse = z.object({
  currency: z.string(),
  stubOnly: z.boolean(),
  channels: z.object({
    alipayEnabled: z.boolean(),
    wechatEnabled: z.boolean(),
    qrcodeEnabled: z.boolean(),
  })
})
export type PaymentConfigResponse = z.infer<typeof PaymentConfigResponse>

// Application schemas
export const AttachmentRef = z.object({
  fileId: UUID,
  fieldKey: z.string(),
})

export const ApplicationSubmitRequest = z.object({
  examId: UUID,
  positionId: UUID,
  formVersion: z.number().default(1),
  payload: z.record(z.string(), z.any()),
  attachments: z.array(AttachmentRef),
})

export const ApplicationResponse = z.object({
  id: UUID,
  examId: UUID,
  positionId: UUID,
  candidateId: UUID,
  formVersion: z.number(),
  status: ApplicationStatus,
  submittedAt: DateTimeString.optional(),
  // optional enriched fields from /applications/my
  examTitle: z.string().optional(),
  positionTitle: z.string().optional(),
})

export const ApplicationDetailResponse = z.object({
  id: UUID,
  examId: UUID,
  positionId: UUID,
  candidateId: UUID,
  formVersion: z.number(),
  payload: z.record(z.string(), z.any()),
  status: ApplicationStatus,
  autoCheckResult: z.record(z.string(), z.any()).optional(),
  finalDecision: z.record(z.string(), z.any()).optional(),
  submittedAt: DateTimeString.optional(),
  statusUpdatedAt: DateTimeString.optional(),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
})

export const ApplicationListResponse = PaginationResponse(ApplicationResponse)
export type ApplicationListResponse = z.infer<typeof ApplicationListResponse>

// User and Auth schemas
export const UserRole = z.enum(['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CANDIDATE', 'PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'EXAMINER'])

export const UserResponse = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  fullName: z.string(),
  phoneNumber: z.string().optional(),
  status: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  lastLoginAt: DateTimeString.optional(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  createdAt: DateTimeString,
})

export const LoginRequest = z.object({
  username: z.string(),
  password: z.string(),
})

export const LoginResponse = z.object({
  token: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
  user: UserResponse,
})

export const RegisterRequest = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  fullName: z.string(),
  phoneNumber: z.string().optional(),
})

// Exam schemas
export const ExamStatus = z.preprocess(
  (v) => (typeof v === 'string' ? v.toUpperCase() : v),
  z.enum([
    // Original planned states
    'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'COMPLETED', 'CANCELLED',
    // Backend current states (compat)
    'OPEN', 'CLOSED'
  ])
)

export const ExamResponse = z.object({
  id: UUID,
  code: z.string(),
  slug: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  announcement: z.string().nullable().optional(),
  registrationStart: DateTimeString.nullable().optional(),
  registrationEnd: DateTimeString.nullable().optional(),
  feeRequired: z.boolean(),
  feeAmount: z.coerce.number().nullable().optional(),
  status: ExamStatus,
  createdBy: z.string(),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
})

export const ExamCreateRequest = z.object({
  code: z.string(),
  slug: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  announcement: z.string().optional(),
  registrationStart: DateTimeString.optional(),
  registrationEnd: DateTimeString.optional(),
  feeRequired: z.boolean().default(false),
  feeAmount: z.number().optional(),
})

export const ExamUpdateRequest = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  announcement: z.string().optional(),
  registrationStart: DateTimeString.optional(),
  registrationEnd: DateTimeString.optional(),
  feeRequired: z.boolean().optional(),
  feeAmount: z.number().optional(),
})

export const ExamListResponse = PaginationResponse(ExamResponse)
export type ExamListResponse = z.infer<typeof ExamListResponse>


// Position schemas (lenient, passthrough for extra fields)
export const PositionResponse = z.object({
  id: UUID.optional(),
  examId: UUID.optional(),
  code: z.string().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().nullish(),
  quota: z.number().nullish(),
  createdAt: DateTimeString.optional(),
  updatedAt: DateTimeString.optional(),
}).passthrough()

export const CreatePositionRequest = z.object({
  examId: UUID,
  code: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  requirements: z.string().optional(),
  quota: z.number().int().positive().optional(),
})

export const UpdatePositionRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  requirements: z.string().optional(),
  quota: z.number().int().positive().optional(),
})

export type CreatePositionRequestType = z.infer<typeof CreatePositionRequest>
export type UpdatePositionRequestType = z.infer<typeof UpdatePositionRequest>

// Venue schemas
export const Venue = z.object({
  venueId: UUID,
  examId: UUID.optional(),
  name: z.string(),
  capacity: z.number().int().positive(),
  seatMap: z.string().optional(),
})

export const VenueListResponse = z.object({
  items: z.array(Venue),
  total: z.number(),
})

export const CreateVenueRequest = z.object({
  name: z.string().min(1).max(200),
  capacity: z.number().int().positive(),
})

export const UpdateVenueRequest = z.object({
  name: z.string().min(1).max(200),
  capacity: z.number().int().positive(),
  seatMap: z.string().optional(),
})

export type VenueType = z.infer<typeof Venue>
export type VenueListResponseType = z.infer<typeof VenueListResponse>
export type CreateVenueRequestType = z.infer<typeof CreateVenueRequest>
export type UpdateVenueRequestType = z.infer<typeof UpdateVenueRequest>

// Review schemas
export const ReviewStage = z.enum(['PRIMARY', 'SECONDARY'])
export const ReviewDecision = z.enum(['APPROVE', 'REJECT'])

export const ReviewApplicationRequest = z.object({
  decision: ReviewDecision,
  comment: z.string().optional(),
  evidence: z.array(z.string()).optional(), // file IDs
})

export const ReviewApplicationResponse = z.object({
  applicationId: UUID,
  reviewerId: z.string(),
  stage: ReviewStage,
  decision: ReviewDecision,
  comment: z.string().optional(),
  reviewedAt: DateTimeString,
})


// Review history (read-only) schemas
export const ReviewHistoryStage = z.enum(['PRIMARY','SECONDARY','AUTO'])
export const ReviewHistoryDecision = z.enum(['APPROVED','REJECTED','PENDING'])
export const ReviewHistoryItemSchema = z.object({
  id: UUID,
  applicationId: UUID,
  stage: ReviewHistoryStage,
  decision: ReviewHistoryDecision,
  reviewerId: z.string().optional(),
  reviewerName: z.string().optional(),
  reviewedAt: DateTimeString,
  comment: z.string().optional(),
})
export type ReviewHistoryItem = z.infer<typeof ReviewHistoryItemSchema>

// Reviewer dashboard stats
export const MyReviewStatsResponse = z.object({
  myAssigned: z.number(),
  todayDone: z.number(),
  weekDone: z.number(),
})
export type MyReviewStatsResponse = z.infer<typeof MyReviewStatsResponse>


// Type exports for convenience
export type ErrorResponse = z.infer<typeof ErrorResponse>
export type ApplicationStatus = z.infer<typeof ApplicationStatus>
export type FileInfoResponse = z.infer<typeof FileInfoResponse>
export type FileUploadUrlRequest = z.infer<typeof FileUploadUrlRequest>
export type FileUploadUrlResponse = z.infer<typeof FileUploadUrlResponse>
export type FileUploadConfirmResponse = z.infer<typeof FileUploadConfirmResponse>
export type ApplicationSubmitRequest = z.infer<typeof ApplicationSubmitRequest>
export type ApplicationResponse = z.infer<typeof ApplicationResponse>
export type ApplicationDetailResponse = z.infer<typeof ApplicationDetailResponse>
export type UserResponse = z.infer<typeof UserResponse>
export type LoginRequest = z.infer<typeof LoginRequest>
export type LoginResponse = z.infer<typeof LoginResponse>
export type ExamResponse = z.infer<typeof ExamResponse>
export type ReviewApplicationRequest = z.infer<typeof ReviewApplicationRequest>
export type ReviewApplicationResponse = z.infer<typeof ReviewApplicationResponse>
export type ValidateTypeRequest = z.infer<typeof ValidateTypeRequest>
export type ValidateTypeResponse = z.infer<typeof ValidateTypeResponse>

// Score schemas
export const ScoreResponse = z.object({
  id: UUID,
  applicationId: UUID,
  subjectId: UUID,
  score: z.number(),
  isAbsent: z.boolean(),
  gradedBy: UUID.nullable(),
  gradedAt: DateTimeString.nullable(),
  remarks: z.string().nullable(),
  subjectName: z.string().nullable().optional(),
  totalScore: z.number().nullable().optional(),
})
export type ScoreResponse = z.infer<typeof ScoreResponse>

export const ScoreStatisticsResponse = z.object({
  examId: UUID,
  totalCount: z.number(),
  validCount: z.number(),
  absentCount: z.number(),
  averageScore: z.number(),
  maxScore: z.number(),
  minScore: z.number(),
})
export type ScoreStatisticsResponse = z.infer<typeof ScoreStatisticsResponse>

// Ticket schemas
export const TicketSubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  description: z.string().optional(),
})

export const TicketInfoSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  applicationId: z.string(),
  examId: z.string(),
  examTitle: z.string(),
  positionId: z.string(),
  positionTitle: z.string(),
  candidateId: z.string(),
  candidateName: z.string(),
  candidateIdNumber: z.string(),
  examDate: z.string(),
  examStartTime: z.string(),
  examEndTime: z.string(),
  venue: z.string(),
  room: z.string(),
  seat: z.string(),
  subjects: z.array(TicketSubjectSchema),
  instructions: z.array(z.string()),
  qrCode: z.string(),
  barcode: z.string(),
  status: z.enum(['VALID', 'EXPIRED', 'USED', 'CANCELLED']),
  issuedAt: z.string(),
  issuedBy: z.string(),
  downloadUrl: z.string().optional(),
  contactInfo: z.object({
    examHotline: z.string(),
    techSupport: z.string(),
    workingHours: z.string(),
  }).optional(),
})

export const TicketListResponseSchema = z.object({
  content: z.array(TicketInfoSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(),
})

export const TicketDownloadResponseSchema = z.object({
  downloadUrl: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
})

export type TicketSubject = z.infer<typeof TicketSubjectSchema>
export type TicketInfo = z.infer<typeof TicketInfoSchema>
export type TicketListResponse = z.infer<typeof TicketListResponseSchema>
export type TicketDownloadResponse = z.infer<typeof TicketDownloadResponseSchema>

// Subject schemas
export const SubjectType = z.enum(['WRITTEN', 'INTERVIEW', 'PRACTICAL', 'OTHER'])

export const SubjectResponse = z.object({
  id: UUID,
  positionId: UUID,
  name: z.string(),
  duration: z.number(), // duration in minutes
  type: SubjectType,
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weight: z.number().optional(),
  ordering: z.number().optional(),
  schedule: z.string().optional(), // JSON string
  createdAt: DateTimeString.optional(),
  updatedAt: DateTimeString.optional(),
})

export const SubjectCreateRequest = z.object({
  name: z.string().min(1).max(200),
  duration: z.number().int().positive(),
  type: SubjectType,
  maxScore: z.number().positive().optional(),
  passingScore: z.number().positive().optional(),
  weight: z.number().min(0).max(1).optional(),
  ordering: z.number().int().optional(),
  schedule: z.string().optional(),
})

export const SubjectUpdateRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  duration: z.number().int().positive().optional(),
  type: SubjectType.optional(),
  maxScore: z.number().positive().optional(),
  passingScore: z.number().positive().optional(),
  weight: z.number().min(0).max(1).optional(),
  ordering: z.number().int().optional(),
  schedule: z.string().optional(),
})

export const SubjectListResponse = z.array(SubjectResponse)

export type SubjectType = z.infer<typeof SubjectType>
export type SubjectResponse = z.infer<typeof SubjectResponse>
export type SubjectCreateRequest = z.infer<typeof SubjectCreateRequest>
export type SubjectUpdateRequest = z.infer<typeof SubjectUpdateRequest>
export type SubjectListResponse = z.infer<typeof SubjectListResponse>

// Payment schemas
export const PaymentMethod = z.enum(['ALIPAY', 'WECHAT', 'MOCK'])
export const PaymentStatus = z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'])

export const PaymentOrderResponse = z.object({
  id: UUID,
  orderNo: z.string(),
  applicationId: UUID,
  amount: z.number(),
  currency: z.string(),
  method: PaymentMethod,
  status: PaymentStatus,
  payUrl: z.string().optional(),
  qrCode: z.string().optional(),
  transactionId: z.string().optional(),
  paidAt: DateTimeString.optional(),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
})

export const PaymentCreateRequest = z.object({
  applicationId: UUID,
  method: PaymentMethod,
  returnUrl: z.string().optional(),
})

export const PaymentCallbackRequest = z.object({
  orderNo: z.string(),
  transactionId: z.string(),
  status: PaymentStatus,
  paidAt: DateTimeString.optional(),
})

export const PaymentListResponse = PaginationResponse(PaymentOrderResponse)

export type PaymentMethod = z.infer<typeof PaymentMethod>
export type PaymentStatus = z.infer<typeof PaymentStatus>
export type PaymentOrderResponse = z.infer<typeof PaymentOrderResponse>
export type PaymentCreateRequest = z.infer<typeof PaymentCreateRequest>
export type PaymentCallbackRequest = z.infer<typeof PaymentCallbackRequest>
export type PaymentListResponse = z.infer<typeof PaymentListResponse>

// Statistics schemas
export const PositionStatistics = z.object({
  positionId: UUID,
  positionTitle: z.string(),
  applications: z.number(),
  approved: z.number(),
  rejected: z.number(),
  paid: z.number(),
  maxApplicants: z.number().optional(),
  fillRate: z.number().optional(),
})

export const ExamStatisticsResponse = z.object({
  examId: UUID,
  examTitle: z.string(),
  totalApplications: z.number(),
  approvedApplications: z.number(),
  rejectedApplications: z.number(),
  paidApplications: z.number(),
  totalPositions: z.number(),
  positionStatistics: z.record(z.string(), PositionStatistics).optional(),
  pendingFirstReview: z.number(),
  pendingSecondReview: z.number(),
  autoApproved: z.number(),
  autoRejected: z.number(),
  totalRevenue: z.number(),
  averagePaymentAmount: z.number(),
  assignedSeats: z.number(),
  unassignedSeats: z.number(),
  ticketsIssued: z.number(),
  ticketsNotIssued: z.number(),
})

export const ApplicationStatisticsResponse = z.object({
  totalApplications: z.number(),
  byStatus: z.record(z.string(), z.number()),
  byExam: z.record(z.string(), z.number()),
  byPosition: z.record(z.string(), z.number()),
  recentApplications: z.array(ApplicationResponse),
})

export const ReviewStatisticsResponse = z.object({
  totalReviews: z.number(),
  pendingPrimary: z.number(),
  pendingSecondary: z.number(),
  approved: z.number(),
  rejected: z.number(),
  averageReviewTime: z.number(), // in minutes
  byReviewer: z.record(z.string(), z.object({
    reviewerId: UUID,
    reviewerName: z.string(),
    totalReviews: z.number(),
    approved: z.number(),
    rejected: z.number(),
  })).optional(),
})

export const PlatformStatisticsResponse = z.object({
  totalTenants: z.number(),
  activeTenants: z.number(),
  totalExams: z.number(),
  totalApplications: z.number(),
  totalUsers: z.number(),
  totalRevenue: z.number(),
})

export type PositionStatistics = z.infer<typeof PositionStatistics>
export type ExamStatisticsResponse = z.infer<typeof ExamStatisticsResponse>
export type ApplicationStatisticsResponse = z.infer<typeof ApplicationStatisticsResponse>
export type ReviewStatisticsResponse = z.infer<typeof ReviewStatisticsResponse>
export type PlatformStatisticsResponse = z.infer<typeof PlatformStatisticsResponse>

// Notification schemas
export const NotificationChannel = z.enum(['EMAIL', 'SMS', 'IN_APP'])
export const NotificationStatus = z.enum(['PENDING', 'SENT', 'FAILED', 'READ'])

export const NotificationTemplateResponse = z.object({
  id: UUID,
  code: z.string(),
  name: z.string(),
  channel: NotificationChannel,
  subject: z.string().optional(),
  content: z.string(),
  variables: z.array(z.string()).optional(),
  enabled: z.boolean(),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
})

export const NotificationHistoryResponse = z.object({
  id: UUID,
  templateId: UUID.optional(),
  templateCode: z.string().optional(),
  recipientId: UUID,
  recipientEmail: z.string().optional(),
  recipientPhone: z.string().optional(),
  channel: NotificationChannel,
  subject: z.string().optional(),
  content: z.string(),
  status: NotificationStatus,
  sentAt: DateTimeString.optional(),
  readAt: DateTimeString.optional(),
  errorMessage: z.string().optional(),
  createdAt: DateTimeString,
})

export const NotificationListResponse = PaginationResponse(NotificationHistoryResponse)

export type NotificationChannel = z.infer<typeof NotificationChannel>
export type NotificationStatus = z.infer<typeof NotificationStatus>
export type NotificationTemplateResponse = z.infer<typeof NotificationTemplateResponse>
export type NotificationHistoryResponse = z.infer<typeof NotificationHistoryResponse>
export type NotificationListResponse = z.infer<typeof NotificationListResponse>

// Seat Assignment schemas
export const SeatAllocationStrategy = z.enum([
  'POSITION_FIRST_SUBMITTED_AT',
  'RANDOM',
  'SUBMITTED_AT_FIRST',
  'POSITION_FIRST_RANDOM',
  'CUSTOM_GROUP'
])

export const SeatAssignmentResponse = z.object({
  id: UUID,
  examId: UUID,
  applicationId: UUID,
  venueId: UUID,
  venueName: z.string(),
  roomNumber: z.string(),
  seatNumber: z.string(),
  candidateName: z.string(),
  candidateIdNumber: z.string(),
  positionTitle: z.string(),
  assignedAt: DateTimeString,
})

export const SeatAllocationRequest = z.object({
  examId: UUID,
  strategy: SeatAllocationStrategy,
  venueIds: z.array(UUID).optional(),
  customGroups: z.record(z.string(), z.array(UUID)).optional(),
})

export const SeatAllocationResponse = z.object({
  examId: UUID,
  totalAssigned: z.number(),
  totalUnassigned: z.number(),
  assignments: z.array(SeatAssignmentResponse),
  strategy: SeatAllocationStrategy,
  allocatedAt: DateTimeString,
})

export const SeatAssignmentListResponse = PaginationResponse(SeatAssignmentResponse)

export type SeatAllocationStrategy = z.infer<typeof SeatAllocationStrategy>
export type SeatAssignmentResponse = z.infer<typeof SeatAssignmentResponse>
export type SeatAllocationRequest = z.infer<typeof SeatAllocationRequest>
export type SeatAllocationResponse = z.infer<typeof SeatAllocationResponse>
export type SeatAssignmentListResponse = z.infer<typeof SeatAssignmentListResponse>

// Form Template schemas
export const FormFieldType = z.enum([
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'EMAIL',
  'PHONE',
  'DATE',
  'SELECT',
  'RADIO',
  'CHECKBOX',
  'FILE',
  'ID_CARD',
  'ADDRESS'
])

export const FormFieldValidation = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().optional(),
})

export const FormFieldOption = z.object({
  label: z.string(),
  value: z.string(),
})

export const FormField = z.object({
  key: z.string(),
  label: z.string(),
  type: FormFieldType,
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(FormFieldOption).optional(),
  validation: FormFieldValidation.optional(),
  helpText: z.string().optional(),
  order: z.number().optional(),
})

export const FormTemplate = z.object({
  id: UUID.optional(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(FormField),
  version: z.number().optional(),
  isLocked: z.boolean().optional(),
  createdAt: DateTimeString.optional(),
  updatedAt: DateTimeString.optional(),
})

export type FormFieldType = z.infer<typeof FormFieldType>
export type FormFieldValidation = z.infer<typeof FormFieldValidation>
export type FormFieldOption = z.infer<typeof FormFieldOption>
export type FormField = z.infer<typeof FormField>
export type FormTemplate = z.infer<typeof FormTemplate>
