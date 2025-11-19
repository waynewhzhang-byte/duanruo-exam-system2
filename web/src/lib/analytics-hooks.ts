/**
 * Analytics API hooks for dashboard statistics and reporting
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from './api'
import { z } from 'zod'

// Analytics schemas
export const OverviewStatsSchema = z.object({
  totalExams: z.number(),
  totalApplications: z.number(),
  totalCandidates: z.number(),
  totalRevenue: z.number(),
  activeExams: z.number(),
  pendingReviews: z.number(),
  completedPayments: z.number(),
  issuedTickets: z.number(),
})

export const ExamStatsSchema = z.object({
  examId: z.string(),
  examTitle: z.string(),
  totalApplications: z.number(),
  approvedApplications: z.number(),
  rejectedApplications: z.number(),
  pendingApplications: z.number(),
  revenue: z.number(),
  averageProcessingTime: z.number(), // in hours
  conversionRate: z.number(), // percentage
})

export const ApplicationTrendSchema = z.object({
  date: z.string(),
  applications: z.number(),
  approvals: z.number(),
  rejections: z.number(),
  payments: z.number(),
})

export const ReviewerPerformanceSchema = z.object({
  reviewerId: z.string(),
  reviewerName: z.string(),
  totalReviews: z.number(),
  averageReviewTime: z.number(), // in hours
  approvalRate: z.number(), // percentage
  workload: z.number(), // current pending reviews
})

export const PaymentAnalyticsSchema = z.object({
  totalRevenue: z.number(),
  averagePaymentAmount: z.number(),
  paymentMethodStats: z.array(z.object({
    method: z.string(),
    count: z.number(),
    amount: z.number(),
  })),
  dailyRevenue: z.array(z.object({
    date: z.string(),
    amount: z.number(),
  })),
})

export const CandidateAnalyticsSchema = z.object({
  totalCandidates: z.number(),
  newCandidatesThisMonth: z.number(),
  candidatesByEducation: z.array(z.object({
    education: z.string(),
    count: z.number(),
  })),
  candidatesByAge: z.array(z.object({
    ageRange: z.string(),
    count: z.number(),
  })),
  topCities: z.array(z.object({
    city: z.string(),
    count: z.number(),
  })),
})

export const SystemPerformanceSchema = z.object({
  averageResponseTime: z.number(),
  errorRate: z.number(),
  uptime: z.number(),
  activeUsers: z.number(),
  peakConcurrentUsers: z.number(),
  storageUsage: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
})

// Type exports
export type OverviewStats = z.infer<typeof OverviewStatsSchema>
export type ExamStats = z.infer<typeof ExamStatsSchema>
export type ApplicationTrend = z.infer<typeof ApplicationTrendSchema>
export type ReviewerPerformance = z.infer<typeof ReviewerPerformanceSchema>
export type PaymentAnalytics = z.infer<typeof PaymentAnalyticsSchema>
export type CandidateAnalytics = z.infer<typeof CandidateAnalyticsSchema>
export type SystemPerformance = z.infer<typeof SystemPerformanceSchema>

// Query keys
const analyticsKeys = {
  all: ['analytics'] as const,
  overview: () => [...analyticsKeys.all, 'overview'] as const,
  examStats: (params?: { examId?: string; dateRange?: string }) => 
    [...analyticsKeys.all, 'exam-stats', params] as const,
  applicationTrends: (params?: { dateRange?: string; granularity?: string }) => 
    [...analyticsKeys.all, 'application-trends', params] as const,
  reviewerPerformance: (params?: { dateRange?: string }) => 
    [...analyticsKeys.all, 'reviewer-performance', params] as const,
  paymentAnalytics: (params?: { dateRange?: string }) => 
    [...analyticsKeys.all, 'payment-analytics', params] as const,
  candidateAnalytics: (params?: { dateRange?: string }) => 
    [...analyticsKeys.all, 'candidate-analytics', params] as const,
  systemPerformance: () => [...analyticsKeys.all, 'system-performance'] as const,
}

// Analytics hooks
export function useOverviewStats() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: () => apiGet<OverviewStats>('/analytics/overview', {
      schema: OverviewStatsSchema,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useExamStats(params?: { examId?: string; dateRange?: string }) {
  return useQuery({
    queryKey: analyticsKeys.examStats(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.examId) searchParams.set('examId', params.examId)
      if (params?.dateRange) searchParams.set('dateRange', params.dateRange)
      
      return apiGet<ExamStats[]>(`/analytics/exam-stats?${searchParams}`, {
        schema: z.array(ExamStatsSchema),
      })
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useApplicationTrends(params?: { dateRange?: string; granularity?: string }) {
  return useQuery({
    queryKey: analyticsKeys.applicationTrends(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.dateRange) searchParams.set('dateRange', params.dateRange)
      if (params?.granularity) searchParams.set('granularity', params.granularity)
      
      return apiGet<ApplicationTrend[]>(`/analytics/application-trends?${searchParams}`, {
        schema: z.array(ApplicationTrendSchema),
      })
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function useReviewerPerformance(params?: { dateRange?: string }) {
  return useQuery({
    queryKey: analyticsKeys.reviewerPerformance(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.dateRange) searchParams.set('dateRange', params.dateRange)
      
      return apiGet<ReviewerPerformance[]>(`/analytics/reviewer-performance?${searchParams}`, {
        schema: z.array(ReviewerPerformanceSchema),
      })
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function usePaymentAnalytics(params?: { dateRange?: string }) {
  return useQuery({
    queryKey: analyticsKeys.paymentAnalytics(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.dateRange) searchParams.set('dateRange', params.dateRange)
      
      return apiGet<PaymentAnalytics>(`/analytics/payment-analytics?${searchParams}`, {
        schema: PaymentAnalyticsSchema,
      })
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
  })
}

export function useCandidateAnalytics(params?: { dateRange?: string }) {
  return useQuery({
    queryKey: analyticsKeys.candidateAnalytics(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.dateRange) searchParams.set('dateRange', params.dateRange)
      
      return apiGet<CandidateAnalytics>(`/analytics/candidate-analytics?${searchParams}`, {
        schema: CandidateAnalyticsSchema,
      })
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useSystemPerformance() {
  return useQuery({
    queryKey: analyticsKeys.systemPerformance(),
    queryFn: () => apiGet<SystemPerformance>('/analytics/system-performance', {
      schema: SystemPerformanceSchema,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

// Utility functions for date range handling
export const dateRanges = {
  '7d': '最近7天',
  '30d': '最近30天',
  '90d': '最近90天',
  '1y': '最近1年',
  'custom': '自定义',
} as const

export type DateRange = keyof typeof dateRanges

export function getDateRangeLabel(range: DateRange): string {
  return dateRanges[range]
}

export function getDateRangeParams(range: DateRange, customStart?: string, customEnd?: string): string {
  if (range === 'custom' && customStart && customEnd) {
    return `${customStart},${customEnd}`
  }
  return range
}
