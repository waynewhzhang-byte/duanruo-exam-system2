/**
 * Typed API hooks for common endpoints
 * These hooks provide type-safe API calls with zod validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete, apiPut } from './api'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import {
  ApplicationResponse,
  ApplicationDetailResponse,
  ApplicationSubmitRequest,
  ApplicationListResponse,
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
  TenantListResponse,
  CreatePositionRequestType,
  UpdatePositionRequestType,
  VenueListResponse,
  VenueListResponseType,
  CreateVenueRequestType,
  UpdateVenueRequestType,
} from './schemas'

// Query keys for cache management
export const queryKeys = {
  applications: {
    all: ['applications'] as const,
    lists: () => [...queryKeys.applications.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.applications.lists(), filters] as const,
    details: () => [...queryKeys.applications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applications.details(), id] as const,
  },
  files: {
    all: ['files'] as const,
    lists: () => [...queryKeys.files.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.files.lists(), filters] as const,
    details: () => [...queryKeys.files.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.files.details(), id] as const,
    my: () => [...queryKeys.files.all, 'my'] as const,
  },
  exams: {
    all: ['exams'] as const,
    lists: () => [...queryKeys.exams.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.exams.lists(), filters] as const,
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
    list: (filters: Record<string, any>) => [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    byApplication: (applicationId: string) => [...queryKeys.tickets.all, 'application', applicationId] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
  payments: {
    config: () => ['payments','config'] as const,
  },
  scores: {
    byApplication: (applicationId: string) => ['scores', 'application', applicationId] as const,
    statistics: (examId: string) => ['scores', 'statistics', examId] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tenants.lists(), filters] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
  },
} as const

// Application hooks

export function useMyApplications(params?: { page?: number; size?: number; status?: string; examId?: string; positionId?: string; sort?: string }) {
  return useQuery({
    queryKey: ['applications','my', params || {}],
    queryFn: () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      if (params?.status) sp.set('status', params.status)
      if (params?.examId) sp.set('examId', params.examId)
      if (params?.positionId) sp.set('positionId', params.positionId)
      if (params?.sort) sp.set('sort', params.sort)
      return apiGet<ApplicationListResponse>(`/applications/my?${sp}`, { schema: ApplicationListResponse })
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
      queryClient.invalidateQueries({ queryKey: ['applications','drafts'] })
      queryClient.invalidateQueries({ queryKey: ['applications','my'] })
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
      queryClient.invalidateQueries({ queryKey: ['applications','drafts'] })
      if (variables?.id) queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(variables.id) })
    },
  })
}

export function useMyDrafts(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: ['applications','drafts','my', params || {}],
    queryFn: () => {
      const sp = new URLSearchParams()
      if (params?.page !== undefined) sp.set('page', String(params.page))
      if (params?.size !== undefined) sp.set('size', String(params.size))
      return apiGet<ApplicationListResponse>(`/applications/drafts/my?${sp}`, { schema: ApplicationListResponse })
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

export function useBatchFileInfo(fileIds: string[]) {
  return useQuery({
    queryKey: ['files', 'batch', [...fileIds].sort((a,b)=>a.localeCompare(b)).join(',')],
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
      file
    }: {
      uploadRequest: FileUploadUrlRequest
      file: File
    }) => {
      // Step 1: Get upload URL
      const uploadUrlResponse = await apiPost<FileUploadUrlResponse>(
        '/files/upload-url',
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
      const confirmResponse = await apiPost<FileUploadConfirmResponse>(
        `/files/${uploadUrlResponse.fileId}/confirm`,
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

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => apiDelete(`/files/${fileId}`),
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

      // API currently returns array directly, not paginated response
      const examsArray = await apiGet<z.infer<typeof ExamResponse>[]>(`/exams?${searchParams}`, {
        schema: z.array(ExamResponse),
        token: token || undefined,
      })

      // Transform to expected paginated format
      return {
        content: examsArray,
        totalElements: examsArray.length,
        totalPages: 1,
        currentPage: 0,
        pageSize: examsArray.length,
        hasNext: false,
        hasPrevious: false,
      } as ExamListResponse
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

export function useExamPositions(examId: string) {
  return useQuery<z.infer<typeof PositionResponse>[]>({
    queryKey: queryKeys.exams.positionsByExam(examId),
    queryFn: () => apiGet<z.infer<typeof PositionResponse>[]>(`/exams/${examId}/positions`, {
      schema: z.array(PositionResponse),
    }),
    enabled: !!examId,
    staleTime: 5 * 60 * 1000,
  })
}

// Position hooks (no schema yet; OpenAPI defines the path but payload shape may vary)
export function usePosition(id: string) {
  return useQuery<z.infer<typeof PositionResponse>>({
    queryKey: ['positions','detail', id],
    queryFn: () => apiGet<z.infer<typeof PositionResponse>>(`/positions/${id}`, { schema: PositionResponse }),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Exam mutations and announcement
const ExamAnnouncementResponse = z.object({ announcement: z.string().optional() })

export function useExamAnnouncement(examId: string) {
  return useQuery({
    queryKey: ['exams','announcement', examId],
    queryFn: () => apiGet(`/exams/${examId}/announcement`, { schema: ExamAnnouncementResponse }),
    enabled: !!examId,
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: Partial<z.infer<typeof ExamUpdateRequest>> }) =>
      apiPut<ExamResponse>(`/exams/${examId}`, data, { schema: ExamResponse, token: token || undefined }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
      if (variables?.examId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
        queryClient.invalidateQueries({ queryKey: ['exams','announcement', variables.examId] })
      }
    },
  })
}

export function useUpdateExamAnnouncement() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationFn: ({ examId, announcement }: { examId: string; announcement: string }) =>
      apiPut(`/exams/${examId}/announcement`, { announcement }, { token: token || undefined }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams','announcement', variables.examId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(variables.examId) })
    },
  })
}

export function useOpenExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (examId: string) => apiPost(`/exams/${examId}/open`),
    onSuccess: (_data, examId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(examId) })
    },
  })
}

export function useCloseExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (examId: string) => apiPost(`/exams/${examId}/close`),
    onSuccess: (_data, examId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(examId) })
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

export function usePayApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      applicationId,
      paymentData
    }: {
      applicationId: string
      paymentData: Record<string, any>
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
    mutationFn: (applicationId: string) => apiPost(`/tickets/application/${applicationId}/generate`, {}),
    onSuccess: (_data, applicationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.byApplication(applicationId) })
    }
  })
}

// Ticket hooks
// NOTE: OpenAPI does not expose GET /tickets/{ticketId} for details.
// Use application-scoped endpoint instead.
export function useTicket(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.tickets.byApplication(applicationId),
    queryFn: () => apiGet(`/tickets/application/${applicationId}`, {
      schema: TicketInfoSchema,
    }),
    enabled: !!applicationId,
  })
}

export function useTicketByApplication(applicationId: string) {
  return useTicket(applicationId)
}

export function useTicketDownload() {
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiGet<TicketDownloadResponse>(`/tickets/${ticketId}/download`, {
        schema: TicketDownloadResponseSchema,
      })

      // Create download link
      const link = document.createElement('a')
      link.href = response.downloadUrl
      link.download = response.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return response
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
    queryFn: () => apiGet<ScoreStatisticsResponse>(`/scores/statistics/exam/${examId}`, {
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
      return await apiPost('/scores/absent', data)
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

export function useBatchRecordScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Array<{
      ticketNo: string
      subjectName: string
      score?: number | null
      isAbsent: boolean
      remarks?: string
    }>) => {
      return await apiPost<{
        successCount: number
        failCount: number
        errors?: Array<{ row: number; message: string }>
      }>('/scores/batch-record', data)
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
    mutationFn: (data: any) =>
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
    mutationFn: async (examId: string) => {
      return apiDelete(`/exams/${examId}`, {
        token: token || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    }
  })
}

// Reviewer queue/task hooks (aligned with OpenAPI)
export function useReviewQueue(params: { examId: string; stage: 'PRIMARY'|'SECONDARY'; positionId?: string; status?: string; page?: number; size?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ['reviews','queue', { examId: params.examId, stage: params.stage, positionId: params.positionId, status: params.status, page: params.page, size: params.size }],
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
    mutationFn: (body: { examId: string; stage: 'PRIMARY'|'SECONDARY'; positionId?: string }) =>
      apiPost('/reviews/queue/pull', body),
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
    mutationFn: (args: { taskId: string; decision: 'APPROVE'|'REJECT'; comment?: string }) =>
      apiPost(`/reviews/tasks/${args.taskId}/decision`, { decision: args.decision, comment: args.comment }),
  })
}


// Review history (strict to canonical endpoint defined in OpenAPI)
export function useReviewHistory(applicationId: string) {
  return useQuery({
    queryKey: ['reviews','history', applicationId],
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
      const url = query ? `/tenants?${query}` : '/tenants'
      const data = await apiGet(url)
      return TenantListResponse.parse(data)
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
      const response = await apiPost('/tenants', data)
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
      const response = await apiPut(`/tenants/${id}`, data)
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
      const response = await apiPost(`/tenants/${id}/activate`, {})
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
      const response = await apiPost(`/tenants/${id}/deactivate`, {})
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
    mutationFn: async (data: CreatePositionRequestType) => {
      return await apiPost('/positions', data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.positionsByExam(variables.examId) })
    },
  })
}

export function useUpdatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePositionRequestType }) => {
      return await apiPut(`/positions/${id}`, data)
    },
    onSuccess: (data: any) => {
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
    mutationFn: async (id: string) => {
      return await apiDelete(`/positions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

// Venue hooks

export function useExamVenues(examId: string) {
  return useQuery({
    queryKey: ['venues', examId],
    queryFn: async () => {
      const response = await apiGet(`/exams/${examId}/venues`)
      return VenueListResponse.parse(response)
    },
    enabled: !!examId,
  })
}

export function useCreateVenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, data }: { examId: string; data: CreateVenueRequestType }) => {
      return await apiPost(`/exams/${examId}/venues`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venues', variables.examId] })
    },
  })
}

export function useUpdateVenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ venueId, data }: { venueId: string; data: UpdateVenueRequestType }) => {
      return await apiPut(`/venues/${venueId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
  })
}

export function useDeleteVenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (venueId: string) => {
      return await apiDelete(`/venues/${venueId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
  })
}

// Exam rules hooks

export function useExamRules(examId: string) {
  return useQuery({
    queryKey: ['exam-rules', examId],
    queryFn: async () => {
      return await apiGet(`/exams/${examId}/rules`)
    },
    enabled: !!examId,
  })
}

export function useUpdateExamRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, rules }: { examId: string; rules: Record<string, any> }) => {
      return await apiPut(`/exams/${examId}/rules`, rules)
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
      return z.array(z.any()).parse(response) // Will use SubjectListResponse when imported
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
    mutationFn: async ({ positionId, data }: { positionId: string; data: any }) => {
      return await apiPost(`/positions/${positionId}/subjects`, data)
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
    mutationFn: async ({ subjectId, data }: { subjectId: string; data: any }) => {
      return await apiPut(`/subjects/${subjectId}`, data)
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
    mutationFn: async (subjectId: string) => {
      return await apiDelete(`/subjects/${subjectId}`)
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

export function useExamStatistics(examId: string) {
  return useQuery({
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
    mutationFn: async (data: { examId: string; strategy: string; venueIds?: string[]; customGroups?: Record<string, string[]> }) => {
      return await apiPost(`/exams/${data.examId}/allocate-seats`, data)
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
    mutationFn: async (examId: string) => {
      return await apiDelete(`/exams/${examId}/seat-assignments`)
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
    mutationFn: async (data: any) => {
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
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
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

// ==================== Exam Form Template API Hooks ====================

/**
 * Get exam form template
 */
export function useExamFormTemplate(examId: string) {
  return useQuery({
    queryKey: ['exam-form-template', examId],
    queryFn: async () => {
      const response = await apiGet(`/exams/${examId}/form-template`)
      return response as { examId: string; templateJson: string | null }
    },
    enabled: !!examId,
  })
}

/**
 * Update exam form template
 */
export function useUpdateExamFormTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ examId, templateJson }: { examId: string; templateJson: string }) => {
      return await apiPut(`/exams/${examId}/form-template`, { templateJson })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-form-template', variables.examId] })
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
  })
}
