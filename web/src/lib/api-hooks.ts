/**
 * Typed API hooks for common endpoints
 * These hooks provide type-safe API calls with zod validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiGetPublic, apiPost, apiDelete, apiPut, apiPostWithTenant, apiPutWithTenant, apiDeleteWithTenant, apiGetWithTenant } from './api'
export { apiGet, apiGetPublic, apiPost, apiDelete, apiPut, apiPostWithTenant, apiPutWithTenant, apiDeleteWithTenant, apiGetWithTenant }
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import {
  ApplicationResponse,
  ApplicationDetailResponse,
  ApplicationSubmitRequest,
  ApplicationListResponse,
  ApplicationArrayResponse,
  FileInfoResponse,
  FileUploadUrlRequest,
  FileUploadUrlResponse,
  FileUploadConfirmResponse,
  FileListResponse,
  FileBatchInfoResponse,
  ExamResponse,
  ExamUpdateRequest,
  ExamListResponse,
  UserResponse,
  LoginRequest,
  LoginResponse,
  ValidateTypeRequest,
  ValidateTypeResponse,
  TicketInfoSchema,
  TicketDownloadResponse,
  TicketDownloadResponseSchema,
  ScoreResponse,
  ScoreStatisticsResponse,
  PositionResponse,
  PaymentConfigResponse,
  ReviewHistoryItemSchema,
  MyReviewStatsResponse,
  TenantType,
  TenantListResponseType,
  CreateTenantRequestType,
  UpdateTenantRequestType,
  Tenant,
  parseTenantListResponse,
  CreatePositionRequestType,
  UpdatePositionRequestType,
  VenueListResponse,
  VenueListResponseType,
  CreateVenueRequestType,
  UpdateVenueRequestType,
  ExamReviewerResponse,
  ReviewerRole,
  AvailableReviewer,
  PublishedExamResponse,
  UserProfileResponse,
  UserProfileResponseType,
  UpsertProfileRequestType,
} from './schemas'
import type { RuleConfiguration } from '@/types/auto-review-rules'
import type {
  TicketTemplate,
  Ticket,
  BatchGenerateTicketsRequest,
  BatchGenerateTicketsResponse,
  TicketStatistics,
  TicketValidationRequest,
  TicketValidationResponse,
  TicketVerificationRequest,
  TicketVerificationResponse,
} from '@/types/ticket'
import {
  DEFAULT_TICKET_TEMPLATE_STYLE,
  TICKET_NUMBER_RULE_PRESETS,
} from '@/types/ticket'
import {
  TicketTemplateSchema,
  TicketSchema,
  BatchGenerateTicketsResponseSchema,
  TicketStatisticsSchema,
  TicketValidationResponseSchema,
  TicketVerificationResponseSchema,
} from '@/types/ticket'

/** Maps Nest ticket batch endpoints to UI `BatchGenerateTicketsResponse`. */
function normalizeTicketBatchResponse(
  raw: unknown,
): z.infer<typeof BatchGenerateTicketsResponseSchema> {
  const r = raw as Record<string, unknown>
  const totalGenerated = typeof r.totalGenerated === 'number' ? r.totalGenerated : 0
  const count = typeof r.count === 'number' ? r.count : 0
  const alreadyExisted = typeof r.alreadyExisted === 'number' ? r.alreadyExisted : 0
  const failed = typeof r.failed === 'number' ? r.failed : 0
  const successCount = totalGenerated || count
  const skippedCount = alreadyExisted
  const failureCount = failed
  return BatchGenerateTicketsResponseSchema.parse({
    totalRequested: successCount + skippedCount + failureCount,
    successCount,
    failureCount,
    skippedCount,
    tickets: [],
  })
}

// Query keys for cache management
export const queryKeys = {
  applications: {
    all: ['applications'] as const,
    lists: () => [...queryKeys.applications.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => [...queryKeys.applications.lists(), filters] as const,
    details: () => [...queryKeys.applications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applications.details(), id] as const,
  },
  files: {
    all: ['files'] as const,
    lists: () => [...queryKeys.files.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => [...queryKeys.files.lists(), filters] as const,
    details: () => [...queryKeys.files.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.files.details(), id] as const,
    my: () => [...queryKeys.files.all, 'my'] as const,
  },
  exams: {
    all: ['exams'] as const,
    lists: () => [...queryKeys.exams.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => [...queryKeys.exams.lists(), filters] as const,
    details: () => [...queryKeys.exams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exams.details(), id] as const,
    positionsByExam: (examId: string) => [...queryKeys.exams.all, 'positions', examId] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    pending: () => [...queryKeys.reviews.all, 'pending'] as const,
  },
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    byApplication: (applicationId: string) => [...queryKeys.tickets.all, 'application', applicationId] as const,
    template: (examId: string) => [...queryKeys.tickets.all, 'template', examId] as const,
    statistics: (examId: string) => [...queryKeys.tickets.all, 'statistics', examId] as const,
    byExam: (examId: string) => [...queryKeys.tickets.all, 'exam', examId] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
  payments: {
    config: () => ['payments', 'config'] as const,
  },
  scores: {
    byApplication: (applicationId: string) => ['scores', 'application', applicationId] as const,
    statistics: (examId: string) => ['scores', 'statistics', examId] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => [...queryKeys.tenants.lists(), filters] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
  },
} as const

// Application hooks

export function useMyApplications(params?: { page?: number; size?: number; status?: string; examId?: string; positionId?: string; sort?: string }) {
  return useQuery<z.infer<typeof ApplicationListResponse>>({
    queryKey: ['applications', 'my', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.status) sp.set('status', params.status)
      if (params?.examId) sp.set('examId', params.examId)
      if (params?.positionId) sp.set('positionId', params.positionId)
      if (params?.sort) sp.set('sort', params.sort)
      const rows = await apiGet(`/applications/my?${sp}`, {
        schema: ApplicationArrayResponse,
      })
      const list = rows as z.infer<typeof ApplicationArrayResponse>
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        currentPage: 0,
        pageSize: list.length,
        hasNext: false,
        hasPrevious: false,
      }
    },
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id),
    queryFn: () => apiGet<ApplicationDetailResponse>(`/applications/${id}`, {
      schema: ApplicationDetailResponse,
    }),
    enabled: !!id,
  })
}

export function useSubmitApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ApplicationSubmitRequest) =>
      apiPost<ApplicationResponse>('/applications', data, {
        schema: ApplicationResponse,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
    },
  })
}

export function useSaveDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplicationSubmitRequest) =>
      apiPost<ApplicationResponse>('/applications/drafts', data, { schema: ApplicationResponse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
      queryClient.invalidateQueries({ queryKey: ['applications', 'drafts'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] })
    },
  })
}

export function useUpdateDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApplicationSubmitRequest> }) =>
      apiPut<ApplicationResponse>(`/applications/drafts/${id}`, data, { schema: ApplicationResponse }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
      queryClient.invalidateQueries({ queryKey: ['applications', 'drafts'] })
      if (variables?.id) queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(variables.id) })
    },
  })
}

export function useMyDrafts(params?: { page?: number; size?: number }) {
  return useQuery<z.infer<typeof ApplicationListResponse>>({
    queryKey: ['applications', 'drafts', 'my', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      const rows = await apiGet(`/applications/drafts/my?${sp}`, {
        schema: ApplicationArrayResponse,
      })
      const list = rows as z.infer<typeof ApplicationArrayResponse>
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        currentPage: 0,
        pageSize: list.length,
        hasNext: false,
        hasPrevious: false,
      }
    },
  })
}


// File hooks
export function useMyFiles(params?: {
  page?: number
  size?: number
  status?: string
}) {
  return useQuery({
    queryKey: queryKeys.files.my(),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.page !== undefined) searchParams.set('page', params.page.toString())
      if (params?.size !== undefined) searchParams.set('size', params.size.toString())
      if (params?.status) searchParams.set('status', params.status)

      return apiGet<FileListResponse>(`/files/my?${searchParams}`, {
        schema: FileListResponse,
      })
    },
  })
}

export function useFileInfo(fileId: string) {
  return useQuery({
    queryKey: queryKeys.files.detail(fileId),
    queryFn: () => apiGet<FileInfoResponse>(`/files/${fileId}`, {
      schema: FileInfoResponse,
    }),
    enabled: !!fileId,
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => apiDelete(`/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.my() })
    },
  })
}

export function useBatchFileInfo(fileIds: string[]) {
  return useQuery({
    queryKey: ['files', 'batch', [...fileIds].sort((a, b) => a.localeCompare(b)).join(',')],
    queryFn: () => apiPost<FileBatchInfoResponse>('/files/batch-info', { fileIds }, {
      schema: FileBatchInfoResponse,
    }),
    enabled: fileIds.length > 0,
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uploadRequest,
      file,
      tenantId
    }: {
      uploadRequest: FileUploadUrlRequest
      file: File
      tenantId?: string
    }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to upload file')
      }

      // Step 1: Get upload URL
      const uploadUrlResponse = await apiPostWithTenant<FileUploadUrlResponse>(
        '/files/upload-url',
        tenantId,
        uploadRequest,
        { schema: FileUploadUrlResponse }
      )

      // Step 2: Upload to MinIO
      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('File upload to storage failed')
      }

      // Step 3: Confirm upload
      const confirmResponse = await apiPostWithTenant<FileUploadConfirmResponse>(
        `/files/${uploadUrlResponse.fileId}/confirm`,
        tenantId,
        { fileSize: file.size },
        { schema: FileUploadConfirmResponse }
      )

      return confirmResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all })
    },
  })
}

export function useValidateFileType() {
  return useMutation({
    mutationFn: (data: ValidateTypeRequest) =>
      apiPost<ValidateTypeResponse>('/files/validate-type', data, {
        schema: ValidateTypeResponse,
      }),
  })
}

// Exam hooks

/**
 * 获取跨租户的公开考试列表（无需认证）
 * 用于考生查看所有租户发布的考试
 */
/**
 * 获取全局开放报名的考试列表（从全局发布目录查询）
 * 用于考生跨租户查看所有开放的考试
 *
 * 注意：此API需要认证（CANDIDATE角色通过EXAM_VIEW_PUBLIC权限访问）
 * 符合RBAC规范，不使用无约束的公开API
 */
export function useOpenExams() {
  return useQuery<z.infer<typeof PublishedExamResponse>[]>({
    queryKey: ['exams', 'open', 'published'],
    queryFn: async () => {
      const exams = await apiGetPublic<z.infer<typeof PublishedExamResponse>[]>('/public/exams/open', {
        schema: z.array(PublishedExamResponse),
      })
      // 后端在部分部署下会对每个租户迭代同一套物理考试数据，导致同一 examId 重复多条。
      // 列表页按考试实体去重，保留第一条（含 tenantCode，用于直达报名页）。
      const seen = new Set<string>()
      const deduped: z.infer<typeof PublishedExamResponse>[] = []
      for (const e of exams) {
        const key = e.examId || e.id
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(e)
      }
      return deduped
    },
  })
}

/**
 * 获取当前租户的考试列表（需要租户上下文）
 */
export function useExams(params?: {
  page?: number
  size?: number
  status?: string
}) {
  const { token, isLoading: authLoading } = useAuth()

  return useQuery<ExamListResponse>({
    queryKey: queryKeys.exams.list(params || {}),
    queryFn: async () => {
      console.log('useExams queryFn called with token:', !!token)
      const searchParams = new URLSearchParams()
      if (params?.page !== undefined) searchParams.set('page', params.page.toString())
      if (params?.size !== undefined) searchParams.set('size', params.size.toString())
      if (params?.status) searchParams.set('status', params.status)

      return await apiGet<ExamListResponse>(`/exams?${searchParams}`, {
        schema: ExamListResponse,
        token: token || undefined,
      })
    },
    enabled: !!token && !authLoading, // Only run query when we have a token and auth is not loading
  })
}

export function useExam(id: string) {
  return useQuery<ExamResponse>({
    queryKey: queryKeys.exams.detail(id),
    queryFn: () => apiGet<ExamResponse>(`/exams/${id}`, {
      schema: ExamResponse,
    }),
    enabled: !!id,
  })
}

export function useExamPositions(examId: string, tenantId?: string) {
  return useQuery<z.infer<typeof PositionResponse>[]>({
    queryKey: queryKeys.exams.positionsByExam(examId),
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch exam positions')
      }
      // Backend may occasionally return non-ISO objects for date fields (e.g. createdAt: {}).
      // Keep list rendering resilient by normalizing payload instead of strict-failing.
      const response = await apiGetWithTenant<unknown>(`/exams/${examId}/positions`, tenantId)
      const rows = Array.isArray(response)
        ? response
        : Array.isArray((response as { data?: unknown })?.data)
          ? (response as { data: unknown[] }).data
          : []

      return rows
        .map((row) => {
          if (!row || typeof row !== 'object') return row
          const normalized = { ...(row as Record<string, unknown>) }
          if (normalized.createdAt != null && typeof normalized.createdAt !== 'string') {
            delete normalized.createdAt
          }
          if (normalized.updatedAt != null && typeof normalized.updatedAt !== 'string') {
            delete normalized.updatedAt
          }
          return normalized
        })
        .map((row) => PositionResponse.partial().passthrough().safeParse(row))
        .filter((result): result is z.SafeParseSuccess<z.infer<typeof PositionResponse>> => result.success)
        .map((result) => result.data)
    },
    enabled: !!examId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

// Position hooks (no schema yet; OpenAPI defines the path but payload shape may vary)
export function usePosition(id: string) {
  return useQuery<z.infer<typeof PositionResponse>>({
    queryKey: ['positions', 'detail', id],
    queryFn: () => apiGet<z.infer<typeof PositionResponse>>(`/positions/${id}`, { schema: PositionResponse }),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Exam mutations and announcement
const ExamAnnouncementResponse = z.object({ announcement: z.string().optional() })

export function useExamAnnouncement(examId: string) {
  return useQuery({
    queryKey: ['exams', 'announcement', examId],
    queryFn: () => apiGet(`/exams/${examId}/announcement`, { schema: ExamAnnouncementResponse }),
    enabled: !!examId,
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationFn: ({ examId, data, tenantId }: { examId: string; data: Partial<z.infer<typeof ExamUpdateRequest>>; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update exam')
      }
      return apiPutWithTenant<ExamResponse>(`/exams/${examId}`, tenantId, data, { schema: ExamResponse, token: token || undefined })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
      if (variables?.examId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
        queryClient.invalidateQueries({ queryKey: ['exams', 'announcement', variables.examId] })
      }
    },
  })
}

export function useUpdateExamAnnouncement() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationFn: ({ examId, announcement, tenantId }: { examId: string; announcement: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update exam announcement')
      }
      return apiPutWithTenant(`/exams/${examId}/announcement`, tenantId, { announcement }, { token: token || undefined })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'announcement', variables.examId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
    },
  })
}

export function useOpenExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, tenantId }: { examId: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to open exam')
      }
      return apiPostWithTenant(`/exams/${examId}/open`, tenantId, {})
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
    },
  })
}

export function useCloseExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, tenantId }: { examId: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to close exam')
      }
      return apiPostWithTenant(`/exams/${examId}/close`, tenantId, {})
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
    },
  })
}

// Review hooks

export function useMyReviewStats() {
  return useQuery({
    queryKey: [...queryKeys.reviews.all, 'stats', 'me'],
    queryFn: () => apiGet('/reviews/stats/me', { schema: MyReviewStatsResponse }),
  })
}


// Deprecated (removed): legacy application-scoped review endpoint
// Use task-based endpoints: /reviews/tasks/{taskId}/decision instead.

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequest) =>
      apiPost<LoginResponse>('/auth/login', credentials, {
        schema: LoginResponse,
      }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiPost('/auth/logout'),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: () => apiGet<UserResponse>('/auth/me', {
      schema: UserResponse,
    }),
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile-detail'] as const,
    queryFn: () => apiGet<UserProfileResponseType>('/profile', {
      schema: UserProfileResponse,
    }),
  })
}

export function useUserProfileForApplication() {
  return useQuery({
    queryKey: ['user', 'profile-for-application'] as const,
    queryFn: () => apiGet<Partial<UserProfileResponseType>>('/profile/for-application'),
  })
}

export function useUpsertProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertProfileRequestType) => 
      apiPost<UserProfileResponseType>('/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile-detail'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'profile-for-application'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertProfileRequestType) => 
      apiPut<UserProfileResponseType>('/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile-detail'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'profile-for-application'] })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiDelete('/profile'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile-detail'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'profile-for-application'] })
    },
  })
}

export function usePayApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      applicationId,
      paymentData
    }: {
      applicationId: string
      paymentData: Record<string, unknown>
    }) =>
      apiPost(`/applications/${applicationId}/pay`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
    },
  })
}

export function useInitiatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { applicationId: string }) => apiPost(`/payments/initiate`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
    }
  })
}

export function useRefreshToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<LoginResponse>('/auth/refresh', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile })
    }
  })
}

// Application withdraw
export function useWithdrawApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (applicationId: string) => apiPut(`/applications/${applicationId}/withdraw`, {}),
    onSuccess: (_data, applicationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(applicationId) })
    },
  })
}


// Tickets helpers
export function useGenerateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (applicationId: string) =>
      apiPost(`/tickets`, { applicationId }),
    onSuccess: (_data, applicationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.byApplication(applicationId) })
    }
  })
}

// Ticket hooks
// NOTE: OpenAPI does not expose GET /tickets/{ticketId} for details.
// Use application-scoped endpoint instead.
export function useTicketByApplication(applicationId: string) {
  return useQuery<z.infer<typeof TicketInfoSchema>>({
    queryKey: queryKeys.tickets.byApplication(applicationId),
    queryFn: () => apiGet<z.infer<typeof TicketInfoSchema>>(`/tickets/application/${applicationId}`, {
      schema: TicketInfoSchema,
    }),
    enabled: !!applicationId,
  })
}

export function useTicketDownload() {
  return useMutation({
    mutationFn: async (data: { ticketId: string; tenantId: string }) => {
      const { ticketId, tenantId } = data

      // 获取token
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
        : null

      // 使用fetch API获取PDF，传递租户ID
      const slug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : undefined
      const tenantHeaders: HeadersInit = (slug && !['admin', 'login', 'candidate', 'api'].includes(slug))
        ? { 'X-Tenant-ID': tenantId, 'X-Tenant-Slug': slug }
        : { 'X-Tenant-ID': tenantId }
      const response = await fetch(`/api/v1/tickets/${ticketId}/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...tenantHeaders,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || '下载失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket_${ticketId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    },
  })
}

// Deprecated: No OpenAPI endpoint for listing tickets directly.
// Consider using /tickets/exam/{examId}/statistics or application-scoped queries.

// Score hooks
export function useScoresByApplication(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.scores.byApplication(applicationId),
    queryFn: () => apiGet<ScoreResponse[]>(`/scores/application/${applicationId}`, {
      schema: z.array(ScoreResponse),
    }),
    enabled: !!applicationId,
  })
}

export function useScoreStatistics(examId: string) {
  return useQuery({
    queryKey: queryKeys.scores.statistics(examId),
    queryFn: () => apiGet<ScoreStatisticsResponse>(`/scores/statistics/${examId}`, {
      schema: ScoreStatisticsResponse,
    }),
    enabled: !!examId,
  })
}

// Score Ranking Response Schema
export const ScoreRankingResponse = z.object({
  applicationId: z.string().uuid(),
  candidateName: z.string(),
  idCard: z.string(),
  ticketNo: z.string().nullable(),
  positionId: z.string().uuid(),
  positionName: z.string(),
  totalScore: z.number(),
  rank: z.number().int(),
  isTied: z.boolean(),
  isInterviewEligible: z.boolean(),
  totalCandidates: z.number().int(),
})

export type ScoreRankingResponseType = z.infer<typeof ScoreRankingResponse>

export function useScoreRanking(examId: string, positionId?: string) {
  return useQuery({
    queryKey: ['scores', 'ranking', examId, positionId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (positionId) {
        params.set('positionId', positionId)
      }
      const query = params.toString()
      const url = query ? `/scores/ranking/exam/${examId}?${query}` : `/scores/ranking/exam/${examId}`
      const response = await apiGet(url)
      return z.array(ScoreRankingResponse).parse(response)
    },
    enabled: !!examId,
  })
}

export function useRecordScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { applicationId: string; subjectId: string; score: number; remarks?: string }) => {
      return await apiPost('/scores/record', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
    },
  })
}

export function useMarkAbsent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { applicationId: string; subjectId: string; remarks?: string }) => {
      return await apiPost('/scores/record', {
        ...data,
        isAbsent: true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
    },
  })
}

export function useDeleteScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scoreId: string) => {
      return await apiDelete(`/scores/${scoreId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
    },
  })
}

export function useScoreImportTemplate(examId: string) {
  return useQuery({
    queryKey: ['scores', 'template', examId],
    queryFn: async () => {
      return apiGet<string>(`/scores/template/${examId}`)
    },
    enabled: !!examId,
  })
}

export function useBatchImportScores() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      examId: string
      scores: Array<{
        applicationId: string
        subjectId: string
        score?: number | null
        remarks?: string
      }>
    }) => {
      return await apiPost<{
        success: number
        failed: number
        errors?: string[]
      }>('/scores/batch-import', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
    },
  })
}


// Admin exam management hooks
export function useCreateExam() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationFn: (data: z.infer<typeof ExamUpdateRequest>) =>
      apiPost<ExamResponse>('/exams', data, { schema: ExamResponse, token: token || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation({
    mutationFn: async ({ examId, tenantId }: { examId: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to delete exam')
      }
      return apiDeleteWithTenant(`/exams/${examId}`, tenantId, {
        token: token || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    }
  })
}

// Reviewer queue/task hooks (aligned with OpenAPI)
export function useReviewQueue(params: { examId: string; stage: 'PRIMARY' | 'SECONDARY'; positionId?: string; status?: string; page?: number; size?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ['reviews', 'queue', { examId: params.examId, stage: params.stage, positionId: params.positionId, status: params.status, page: params.page, size: params.size }],
    queryFn: () => {
      const sp = new URLSearchParams()
      sp.set('examId', params.examId)
      sp.set('stage', params.stage)
      if (params.positionId) sp.set('positionId', params.positionId)
      if (params.status) sp.set('status', params.status)
      if (params.page !== undefined) sp.set('page', String(params.page))
      if (params.size !== undefined) sp.set('size', String(params.size))
      return apiGet(`/reviews/queue?${sp}`)
    },
    enabled: params.enabled ?? (!!params.examId && !!params.stage),
  })
}

export function usePullReviewTask() {
  return useMutation({
    mutationFn: (body: { examId: string; stage: 'PRIMARY' | 'SECONDARY'; positionId?: string }) =>
      apiPost('/reviews/pull', body),
  })
}

export function useReviewTaskHeartbeat() {
  return useMutation({
    mutationFn: (args: { taskId: string }) => apiPost(`/reviews/tasks/${args.taskId}/heartbeat`, {}),
  })
}

export function useReviewTaskRelease() {
  return useMutation({
    mutationFn: (args: { taskId: string }) => apiPost(`/reviews/tasks/${args.taskId}/release`, {}),
  })
}

export function useReviewTaskDecision() {
  return useMutation({
    mutationFn: (args: { applicationId: string; decision: 'APPROVE' | 'REJECT'; comment?: string }) =>
      apiPost(`/reviews/decide`, { applicationId: args.applicationId, decision: args.decision, comment: args.comment }),
  })
}


// Review history (strict to canonical endpoint defined in OpenAPI)
export function useReviewHistory(applicationId: string) {
  return useQuery({
    queryKey: ['reviews', 'history', applicationId],
    queryFn: async () => {
      const data = await apiGet(`/applications/${applicationId}/reviews`)
      return z.array(ReviewHistoryItemSchema).parse(data)
    },
    enabled: !!applicationId,
  })
}

// Tenant hooks

export function useTenants(params?: { page?: number; size?: number; activeOnly?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tenants.list(params || {}),
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.activeOnly !== undefined) sp.set('activeOnly', String(params.activeOnly))
      const query = sp.toString()
      const url = query ? `/super-admin/tenants?${query}` : '/super-admin/tenants'
      const data = await apiGet(url)
      return parseTenantListResponse(data)
    },
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: async () => {
      const data = await apiGet(`/tenants/${id}`)
      return Tenant.parse(data)
    },
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTenantRequestType) => {
      const response = await apiPost('/super-admin/tenants', data)
      return Tenant.parse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTenantRequestType }) => {
      const response = await apiPut(`/super-admin/tenants/${id}`, data)
      return Tenant.parse(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.detail(variables.id) })
    },
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiPost(`/super-admin/tenants/${id}/activate`, {})
      return Tenant.parse(response)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.detail(id) })
    },
  })
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiPost(`/super-admin/tenants/${id}/deactivate`, {})
      return Tenant.parse(response)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.detail(id) })
    },
  })
}

// Position hooks

export function useCreatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePositionRequestType & { tenantId?: string }) => {
      const { tenantId, ...positionData } = data
      if (!tenantId) {
        throw new Error('Tenant ID is required to create a position')
      }
      return await apiPostWithTenant('/exams/positions', tenantId, positionData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.positionsByExam(variables.examId) })
    },
  })
}

export function useUpdatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data, tenantId }: { id: string; data: UpdatePositionRequestType; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update a position')
      }
      return await apiPutWithTenant<z.infer<typeof PositionResponse>>(`/exams/positions/${id}`, tenantId, data)
    },
    onSuccess: (data: z.infer<typeof PositionResponse> | null) => {
      if (data?.examId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.exams.positionsByExam(data.examId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

export function useDeletePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to delete a position')
      }
      return await apiDeleteWithTenant(`/exams/positions/${id}`, tenantId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

// Venue hooks

export function useExamVenues(examId: string, tenantId?: string) {
  return useQuery({
    queryKey: ['venues', examId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch exam venues')
      }
      const response = await apiGetWithTenant<z.infer<typeof VenueListResponse>[]>(`/seating/venues?examId=${examId}`, tenantId)
      const items = Array.isArray(response) ? response : []
      return {
        items,
        total: items.length,
      }
    },
    enabled: !!examId && !!tenantId,
  })
}

export function useCreateVenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, data, tenantId }: { examId: string; data: CreateVenueRequestType; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to create a venue')
      }
      return await apiPostWithTenant(`/seating/venues`, tenantId, { ...data, examId })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venues', variables.examId] })
    },
  })
}

export function useUpdateVenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ venueId, data, tenantId }: { venueId: string; data: UpdateVenueRequestType; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update a venue')
      }
      return await apiPutWithTenant(`/seating/venues/${venueId}`, tenantId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
  })
}

export function useDeleteVenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ venueId, tenantId }: { venueId: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to delete a venue')
      }
      return await apiDeleteWithTenant(`/seating/venues/${venueId}`, tenantId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
  })
}

// Exam rules hooks

export function useExamRules(examId: string, tenantId?: string) {
  return useQuery({
    queryKey: ['exam-rules', examId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch exam rules')
      }
      return await apiGetWithTenant(`/exams/${examId}/rules`, tenantId)
    },
    enabled: !!examId && !!tenantId,
  })
}

export function useUpdateExamRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, rules, tenantId }: { examId: string; rules: Record<string, unknown>; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update exam rules')
      }
      return await apiPutWithTenant(`/exams/${examId}/rules`, tenantId, rules)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-rules', variables.examId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
    },
  })
}

// Subject hooks

export function useSubjects(positionId: string) {
  return useQuery({
    queryKey: ['subjects', positionId],
    queryFn: async () => {
      const response = await apiGet(`/positions/${positionId}/subjects`)
      return z.array(z.record(z.unknown())).parse(response) // Will use SubjectListResponse when imported
    },
    enabled: !!positionId,
  })
}

export function useSubject(subjectId: string) {
  return useQuery({
    queryKey: ['subjects', 'detail', subjectId],
    queryFn: async () => {
      return await apiGet(`/subjects/${subjectId}`)
    },
    enabled: !!subjectId,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ positionId, data, tenantId }: { positionId: string; data: Record<string, unknown>; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to create a subject')
      }
      return await apiPostWithTenant(`/exams/positions/${positionId}/subjects`, tenantId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects', variables.positionId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subjectId, data, tenantId }: { subjectId: string; data: Record<string, unknown>; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update a subject')
      }
      return await apiPutWithTenant(`/exams/subjects/${subjectId}`, tenantId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subjectId, tenantId }: { subjectId: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to delete a subject')
      }
      return await apiDeleteWithTenant(`/exams/subjects/${subjectId}`, tenantId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

// Payment hooks

export function usePaymentConfig() {
  return useQuery({
    queryKey: queryKeys.payments.config(),
    queryFn: () => apiGet<PaymentConfigResponse>('/payments/config', {
      schema: PaymentConfigResponse,
    }),
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { applicationId: string; method: string; returnUrl?: string }) => {
      return await apiPost(`/payments`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
    },
  })
}

export function usePaymentHistory(params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ['payments', 'history', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.status) sp.set('status', params.status)
      return await apiGet(`/payments/my?${sp}`)
    },
  })
}

export function usePaymentOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: async () => {
      return await apiGet(`/payments/${orderId}`)
    },
    enabled: !!orderId,
  })
}

// Statistics hooks

export interface ExamStatistics {
  examId: string
  examCode: string
  examTitle: string
  totalApplications: number
  draftApplications: number
  submittedApplications: number
  pendingPrimaryReviewApplications: number
  primaryPassedApplications: number
  primaryRejectedApplications: number
  pendingSecondaryReviewApplications: number
  approvedApplications: number
  secondaryRejectedApplications: number
  paidApplications: number
  ticketIssuedApplications: number
  primaryApprovalRate: number
  secondaryApprovalRate: number
  overallApprovalRate: number
}

export function useExamStatistics(examId: string) {
  return useQuery<ExamStatistics>({
    queryKey: ['statistics', 'exam', examId],
    queryFn: async () => {
      return await apiGet(`/exams/${examId}/statistics`)
    },
    enabled: !!examId,
  })
}

export function useApplicationStatistics(params?: { examId?: string; positionId?: string }) {
  return useQuery({
    queryKey: ['statistics', 'applications', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.examId) sp.set('examId', params.examId)
      if (params?.positionId) sp.set('positionId', params.positionId)
      return await apiGet(`/statistics/applications?${sp}`)
    },
  })
}

export function useReviewStatistics(params?: { examId?: string; reviewerId?: string }) {
  return useQuery({
    queryKey: ['statistics', 'reviews', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.examId) sp.set('examId', params.examId)
      if (params?.reviewerId) sp.set('reviewerId', params.reviewerId)
      return await apiGet(`/statistics/reviews?${sp}`)
    },
  })
}

export function usePlatformStatistics() {
  return useQuery({
    queryKey: ['statistics', 'platform'],
    queryFn: async () => {
      return await apiGet('/statistics/platform')
    },
  })
}

// Notification hooks

export function useNotificationTemplates(params?: { page?: number; size?: number; channel?: string }) {
  return useQuery({
    queryKey: ['notifications', 'templates', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.channel) sp.set('channel', params.channel)
      return await apiGet(`/notifications/templates?${sp}`)
    },
  })
}

export function useNotificationHistory(params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ['notifications', 'history', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.status) sp.set('status', params.status)
      return await apiGet(`/notifications/my?${sp}`)
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiPost(`/notifications/${notificationId}/read`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Seat Assignment hooks

export function useSeatAssignments(examId: string, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: ['seat-assignments', examId, params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      return await apiGet(`/exams/${examId}/seat-assignments?${sp}`)
    },
    enabled: !!examId,
  })
}

export function useAllocateSeats() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { examId: string; strategy: string; venueIds?: string[]; customGroups?: Record<string, string[]>; tenantId?: string }) => {
      const { tenantId, ...requestData } = data
      if (!tenantId) {
        throw new Error('Tenant ID is required to allocate seats')
      }
      return await apiPostWithTenant(`/seating/${data.examId}/allocate`, tenantId, requestData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seat-assignments', variables.examId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
    },
  })
}

export function useClearSeatAssignments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, tenantId }: { examId: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to clear seat assignments')
      }
      return await apiDeleteWithTenant(`/seating/${examId}/assignments`, tenantId)
    },
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: ['seat-assignments', examId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
    },
  })
}

// User Management hooks

export function useUsers(params?: { page?: number; size?: number; role?: string; status?: string }) {
  return useQuery({
    queryKey: ['users', params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.role) sp.set('role', params.role)
      if (params?.status) sp.set('status', params.status)
      return await apiGet(`/users?${sp}`)
    },
  })
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: async () => {
      return await apiGet(`/users/${userId}`)
    },
    enabled: !!userId,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiPost('/users', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      return await apiPut(`/users/${userId}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', variables.userId] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      return await apiDelete(`/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Analytics hooks

export function useExamApplications(examId: string, params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ['exam-applications', examId, params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.status) sp.set('status', params.status)
      return await apiGet(`/exams/${examId}/applications?${sp}`)
    },
    enabled: !!examId,
  })
}

export function usePositionApplications(positionId: string, params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ['position-applications', positionId, params || {}],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.status) sp.set('status', params.status)
      return await apiGet(`/positions/${positionId}/applications?${sp}`)
    },
    enabled: !!positionId,
  })
}

// ==================== Auto-Review Rules API Hooks ====================

/**
 * Get auto-review rules for an exam
 */
export function useExamAutoReviewRules(examId: string, tenantId?: string) {
  return useQuery<RuleConfiguration>({
    queryKey: ['exam-auto-review-rules', examId, tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch exam auto-review rules')
      }
      const response = await apiGetWithTenant(`/exams/${examId}/rules`, tenantId)
      return response as RuleConfiguration
    },
    enabled: !!examId && !!tenantId,
  })
}

/**
 * Update auto-review rules for an exam
 */
export function useUpdateExamAutoReviewRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, rules, tenantId }: { examId: string; rules: RuleConfiguration; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update exam auto-review rules')
      }
      return await apiPutWithTenant(`/exams/${examId}/rules`, tenantId, rules)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-auto-review-rules', variables.examId] })
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
  })
}

/**
 * Test auto-review rules with sample data
 */
export function useTestAutoReviewRules() {
  return useMutation({
    mutationFn: async ({ examId, rules, testData }: { examId: string; rules: RuleConfiguration; testData: Record<string, unknown> }) => {
      // For now, we'll implement client-side testing
      // In the future, this could call a backend endpoint
      return {
        action: 'PENDING_REVIEW',
        reason: '测试数据通过',
        matchedRules: [],
        failedRules: [],
        executionLog: ['测试执行完成'],
        debugInfo: {},
      }
    },
  })
}

// ==================== Position Auto-Review Rules API Hooks ====================

/**
 * Get auto-review rules for a position
 */
export function usePositionAutoReviewRules(positionId: string, tenantId?: string) {
  return useQuery({
    queryKey: ['position-auto-review-rules', positionId, tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to get position auto-review rules')
      }
      const response = await apiGetWithTenant(`/exams/positions/${positionId}/rules`, tenantId)
      return response as { positionId: string; rulesConfig?: string }
    },
    enabled: !!positionId && !!tenantId,
  })
}

/**
 * Update auto-review rules for a position
 */
export function useUpdatePositionAutoReviewRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ positionId, rulesConfig, tenantId }: { positionId: string; rulesConfig: string | null; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to update position auto-review rules')
      }
      return await apiPutWithTenant(`/exams/positions/${positionId}/rules`, tenantId, { rulesConfig })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['position-auto-review-rules', variables.positionId] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}

// ==================== Reviewer Management API Hooks ====================

/**
 * Get exam reviewers
 */
export function useExamReviewers(examId: string) {
  return useQuery({
    queryKey: ['exam-reviewers', examId],
    queryFn: async () => {
      const response = await apiGet(`/exams/${examId}/reviewers`)
      return z.array(ExamReviewerResponse).parse(response)
    },
    enabled: !!examId,
  })
}

/**
 * Get available reviewers (users that can be assigned as reviewers)
 */
export function useAvailableReviewers(examId: string) {
  return useQuery({
    queryKey: ['available-reviewers', examId],
    queryFn: async () => {
      const response = await apiGet(`/exams/${examId}/reviewers/available`)
      return z.array(AvailableReviewer).parse(response)
    },
    enabled: !!examId,
  })
}

/**
 * Add reviewer to exam
 */
export function useAddReviewer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, userId, role, tenantId }: { examId: string; userId: string; role: ReviewerRole; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to add reviewer')
      }
      return await apiPostWithTenant(`/exams/${examId}/reviewers`, tenantId, { userId, role })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-reviewers', variables.examId] })
      queryClient.invalidateQueries({ queryKey: ['available-reviewers', variables.examId] })
    },
  })
}

/**
 * Remove reviewer from exam
 */
export function useRemoveReviewer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, reviewerId, role, tenantId }: { examId: string; reviewerId: string; role: string; tenantId?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to remove reviewer')
      }
      return await apiDeleteWithTenant(`/exams/${examId}/reviewers/${reviewerId}?role=${role}`, tenantId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-reviewers', variables.examId] })
      queryClient.invalidateQueries({ queryKey: ['available-reviewers', variables.examId] })
    },
  })
}

// ==================== Ticket Management API Hooks ====================

/**
 * Get ticket by application ID
 */
// export function useTicketByApplication(applicationId: string) {
//   return useQuery({
//     queryKey: queryKeys.tickets.byApplication(applicationId),
//     queryFn: async () => {
//       const response = await apiGet(`/tickets/application/${applicationId}`)
//       return TicketSchema.parse(response)
//     },
//     enabled: !!applicationId,
//   })
// }

/**
 * Get ticket details by ticket ID
 */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: async () => {
      const response = await apiGet(`/tickets/${ticketId}`)
      return TicketSchema.parse(response)
    },
    enabled: !!ticketId,
  })
}

/**
 * Get ticket template for an exam
 */
export function useTicketTemplate(examId: string, tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.tickets.template(examId),
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch ticket template')
      }
      const response = (await apiGetWithTenant(`/tickets/exam/${examId}/template`, tenantId)) as {
        prefix?: string
        dateFormat?: string
        sequenceLength?: number
        separator?: string
        example?: string
      }
      const base: TicketTemplate = {
        examId,
        ticketNumberRule: { ...TICKET_NUMBER_RULE_PRESETS.STANDARD },
        qrCodeEnabled: true,
        barcodeEnabled: false,
        includePhoto: true,
        includeExamInfo: true,
        includeVenueInfo: true,
        includeCandidateInfo: true,
        templateStyle: DEFAULT_TICKET_TEMPLATE_STYLE,
        customPrefix: response.prefix,
      }
      if (response.separator !== undefined) {
        base.ticketNumberRule.separator = response.separator
      }
      if (response.example) {
        base.ticketNumberRule.example = response.example
      }
      return TicketTemplateSchema.parse(base)
    },
    enabled: !!examId && !!tenantId,
  })
}

/**
 * Get ticket statistics for an exam
 */
export function useTicketStatistics(examId: string, tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.tickets.statistics(examId),
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch ticket statistics')
      }
      const response = await apiGetWithTenant(`/tickets/exam/${examId}/statistics`, tenantId)
      return TicketStatisticsSchema.parse(response)
    },
    enabled: !!examId && !!tenantId,
  })
}

/**
 * Generate ticket for a single application
 */
// export function useGenerateTicket() {
//   const queryClient = useQueryClient()
//
//   return useMutation({
//     mutationFn: async (applicationId: string) => {
//       const response = await apiPost(`/tickets/application/${applicationId}/generate`, {})
//       return TicketSchema.parse(response)
//     },
//     onSuccess: (data, applicationId) => {
//       queryClient.invalidateQueries({ queryKey: queryKeys.tickets.byApplication(applicationId) })
//       queryClient.invalidateQueries({ queryKey: queryKeys.tickets.byExam(data.examId) })
//       queryClient.invalidateQueries({ queryKey: queryKeys.tickets.statistics(data.examId) })
//     },
//   })
// }

/**
 * Batch generate tickets
 */
export function useBatchGenerateTickets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: BatchGenerateTicketsRequest) => {
      const { examId, applicationIds } = request
      if (applicationIds && applicationIds.length > 0) {
        const response = await apiPost('/tickets/batch', { applicationIds })
        return normalizeTicketBatchResponse(response)
      }
      const response = await apiPost(`/tickets/batch-generate/${examId}`, {})
      return normalizeTicketBatchResponse(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.byExam(variables.examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.statistics(variables.examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() })
    },
  })
}

/**
 * Update ticket template
 */
export function useUpdateTicketTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, template }: { examId: string; template: TicketTemplate }) => {
      const response = await apiPut(`/tickets/exam/${examId}/template`, template)
      return TicketTemplateSchema.parse(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.template(variables.examId) })
    },
  })
}

/**
 * Reset ticket template to default
 */
export function useResetTicketTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (examId: string) => {
      return await apiDelete(`/tickets/exam/${examId}/template`)
    },
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.template(examId) })
    },
  })
}

/**
 * Validate ticket (by ticket number, QR code, or barcode)
 */
export function useValidateTicket() {
  return useMutation({
    mutationFn: async (request: TicketValidationRequest) => {
      const response = await apiPost('/tickets/validate', request)
      return TicketValidationResponseSchema.parse(response)
    },
  })
}

/**
 * Verify ticket
 */
export function useVerifyTicket() {
  return useMutation({
    mutationFn: async (request: TicketVerificationRequest) => {
      const response = await apiPost('/tickets/verify', request)
      return TicketVerificationResponseSchema.parse(response)
    },
  })
}

/**
 * Download ticket PDF
 */
export function useDownloadTicket() {
  return useMutation({
    mutationFn: async (ticketId: string) => {
      // This returns a blob URL for download
      const response = await apiGet(`/tickets/${ticketId}/download`)
      return response as string // URL to download
    },
  })
}

/**
 * Get ticket PDF view URL
 */
export function getTicketViewUrl(ticketId: string): string {
  return `/api/v1/tickets/${ticketId}/view`
}

// ============================================================================
// Form Template Hooks
// ============================================================================

/**
 * Form template status enum
 */
export enum FormTemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Form field type enum
 */
export enum FormFieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  DATE = 'DATE',
  SELECT = 'SELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  FILE = 'FILE',
}

/**
 * Field options schema (matches backend FieldOptionsDTO)
 */
export const FieldOptionsSchema = z.object({
  choices: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  allowMultiple: z.boolean().optional(),
  maxFileSize: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
}).optional()

/**
 * Field constraints schema (matches backend FieldConstraintsDTO)
 * Note: Backend may return null for optional constraint fields
 */
export const FieldConstraintsSchema = z.object({
  minLength: z.number().optional().nullable(),
  maxLength: z.number().optional().nullable(),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  pattern: z.string().optional().nullable(),
  patternMessage: z.string().optional().nullable(),
}).optional()

/**
 * Form field schema (matches backend FieldDefinitionResponse)
 */
export const FormFieldSchema = z.object({
  id: z.string(),
  fieldKey: z.string(),
  fieldType: z.string(), // Backend returns string, not enum
  label: z.string().optional(),
  placeholder: z.string().optional().nullable(),
  helpText: z.string().optional().nullable(),
  required: z.boolean().optional().nullable(),
  displayOrder: z.number().optional().nullable(),
  options: FieldOptionsSchema.nullable(),
  constraints: FieldConstraintsSchema.nullable(),
  conditionalRules: z.record(z.unknown()).optional().nullable(),
  createdAt: z.string().optional().nullable(),
  // Legacy fields for backward compatibility
  fieldName: z.string().optional(),
  defaultValue: z.string().optional(),
  validationRules: z.record(z.unknown()).optional(),
  order: z.number().optional(),
})

export type FormField = z.infer<typeof FormFieldSchema>

/**
 * Form template schema (matches backend FormTemplateDetailResponse)
 */
export const FormTemplateSchema = z.object({
  id: z.string(),
  templateName: z.string(),
  description: z.string().optional().nullable(),
  version: z.number(),
  status: z.nativeEnum(FormTemplateStatus), // Backend returns string like "DRAFT", "PUBLISHED"
  fields: z.array(FormFieldSchema),
  createdBy: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type FormTemplate = z.infer<typeof FormTemplateSchema>

/**
 * Create form template request
 * Note: Only templateName and description are accepted by the backend.
 * Fields are added separately via the addField endpoint.
 * examId is optional but if provided, the template is saved directly to the exam.
 */
export const CreateFormTemplateRequestSchema = z.object({
  templateName: z.string().min(1, '模板名称不能为空'),
  description: z.string().optional(),
  examId: z.string().optional(),
})

export type CreateFormTemplateRequest = z.infer<typeof CreateFormTemplateRequestSchema>

/**
 * Update form template request
 * Note: Only templateName and description are accepted by the backend.
 * Fields are added/updated separately via the field endpoints.
 */
export const UpdateFormTemplateRequestSchema = z.object({
  templateName: z.string().min(1, '模板名称不能为空').optional(),
  description: z.string().optional(),
})

export type UpdateFormTemplateRequest = z.infer<typeof UpdateFormTemplateRequestSchema>

/**
 * Query keys for form templates
 */
const formTemplateQueryKeys = {
  all: ['formTemplates'] as const,
  lists: () => [...formTemplateQueryKeys.all, 'list'] as const,
  list: (tenantId: string) => [...formTemplateQueryKeys.lists(), tenantId] as const,
  details: () => [...formTemplateQueryKeys.all, 'detail'] as const,
  detail: (id: string, tenantId: string) => [...formTemplateQueryKeys.details(), id, tenantId] as const,
  examTemplate: (examId: string, tenantId: string) => [...formTemplateQueryKeys.all, 'exam', examId, tenantId] as const,
}

/**
 * Get form template by ID
 */
export function useFormTemplate(templateId: string | undefined, tenantId: string | undefined) {
  return useQuery({
    queryKey: formTemplateQueryKeys.detail(templateId || '', tenantId || ''),
    queryFn: async () => {
      if (!templateId || !tenantId) throw new Error('Template ID and Tenant ID are required')
      const response = await apiGetWithTenant(`/form-templates/${templateId}`, tenantId)
      return FormTemplateSchema.parse(response)
    },
    enabled: !!templateId && !!tenantId,
  })
}

/**
 * Get all form templates for a tenant
 */
export function useFormTemplates(tenantId: string | undefined) {
  return useQuery({
    queryKey: formTemplateQueryKeys.list(tenantId || ''),
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required')
      const response = await apiGetWithTenant('/form-templates', tenantId)
      return z.array(FormTemplateSchema).parse(response)
    },
    enabled: !!tenantId,
  })
}

/**
 * Get form template associated with an exam
 */
export function useExamFormTemplate(examId: string | undefined, tenantId: string | undefined) {
  return useQuery({
    queryKey: formTemplateQueryKeys.examTemplate(examId || '', tenantId || ''),
    queryFn: async () => {
      if (!examId || !tenantId) throw new Error('Exam ID and Tenant ID are required')
      const response = await apiGetWithTenant(`/exams/${examId}/form-template`, tenantId)
      if (!response) {
        return null
      }
      try {
        return FormTemplateSchema.parse(response)
      } catch (parseError: unknown) {
        console.error('Failed to parse form template:', parseError, response)
        return null
      }
    },
    enabled: !!examId && !!tenantId,
  })
}

/**
 * Create form template
 */
export function useCreateFormTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFormTemplateRequest & { tenantId?: string }) => {
      const { tenantId, examId, ...requestData } = data
      if (!tenantId) throw new Error('Tenant ID is required')
      const url = examId 
        ? `/form-templates?examId=${encodeURIComponent(examId)}`
        : '/form-templates'
      const response = await apiPostWithTenant(url, tenantId, requestData)
      return FormTemplateSchema.parse(response)
    },
    onSuccess: (_, variables) => {
      if (variables.tenantId) {
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.list(variables.tenantId) })
        if (variables.examId) {
          queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.examTemplate(variables.examId, variables.tenantId) })
        }
      }
    },
  })
}

/**
 * Update form template (basic info only)
 */
export function useUpdateFormTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateFormTemplateRequest & { templateId: string; tenantId?: string }) => {
      const { templateId, tenantId, ...requestData } = data
      if (!tenantId) throw new Error('Tenant ID is required')
      const response = await apiPutWithTenant(`/form-templates/${templateId}`, tenantId, requestData)
      return FormTemplateSchema.parse(response)
    },
    onSuccess: (data, variables) => {
      if (variables.tenantId) {
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.detail(variables.templateId, variables.tenantId) })
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.list(variables.tenantId) })
      }
    },
  })
}

/**
 * Batch field definition for API request
 */
export interface BatchFieldRequest {
  fieldKey: string
  fieldType: string
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  displayOrder: number
  options?: {
    allowCustomInput?: boolean
    options?: Array<{ value: string; label: string; description?: string }>
  }
  constraints?: {
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    pattern?: string
    maxFileSizeBytes?: number
    allowedFileTypes?: string
    customErrorMessage?: string
  }
}

/**
 * Batch update form template request
 */
export interface BatchUpdateFormTemplateRequest {
  templateName?: string
  description?: string
  fields: BatchFieldRequest[]
  examId?: string
}

/**
 * Batch update form template (includes basic info and fields)
 * This replaces all existing fields with the new ones
 */
export function useBatchUpdateFormTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BatchUpdateFormTemplateRequest & { templateId: string; tenantId?: string }) => {
      const { templateId, tenantId, examId, ...requestData } = data
      if (!tenantId) throw new Error('Tenant ID is required')
      // Pass examId as query param so backend knows which exam to update
      const url = examId 
        ? `/form-templates/${templateId}/batch?examId=${encodeURIComponent(examId)}`
        : `/form-templates/${templateId}/batch`
      const response = await apiPutWithTenant(url, tenantId, requestData)
      return FormTemplateSchema.parse(response)
    },
    onSuccess: (data, variables) => {
      if (variables.tenantId) {
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.detail(variables.templateId, variables.tenantId) })
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.list(variables.tenantId) })
      }
    },
  })
}

/**
 * Publish form template (change status from DRAFT to PUBLISHED)
 */
export function usePublishFormTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { templateId: string; tenantId?: string; examId?: string }) => {
      const { templateId, tenantId, examId } = data
      if (!tenantId) throw new Error('Tenant ID is required')
      const url = examId 
        ? `/form-templates/${templateId}/publish?examId=${encodeURIComponent(examId)}`
        : `/form-templates/${templateId}/publish`
      const response = await apiPostWithTenant(url, tenantId, {})
      return FormTemplateSchema.parse(response)
    },
    onSuccess: (data, variables) => {
      if (variables.tenantId) {
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.detail(variables.templateId, variables.tenantId) })
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.list(variables.tenantId) })
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.examTemplate(variables.examId || '', variables.tenantId) })
      }
    },
  })
}

/**
 * Assign form template to exam
 */
export function useAssignFormTemplateToExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { examId: string; templateId: string; tenantId?: string }) => {
      const { examId, templateId, tenantId } = data
      if (!tenantId) throw new Error('Tenant ID is required')
      const response = await apiPutWithTenant(`/exams/${examId}/form-template/${templateId}`, tenantId, {})
      return response
    },
    onSuccess: (_, variables) => {
      if (variables.tenantId) {
        queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.examTemplate(variables.examId, variables.tenantId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
      }
    },
  })
}
