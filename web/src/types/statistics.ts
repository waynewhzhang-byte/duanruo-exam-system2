export interface RecentExam {
    examId: string
    examTitle: string
    startDate: string
    applications: number
}

export interface TenantStatistics {
    tenantId: string
    tenantName: string

    // Exam Stats
    totalExams: number
    activeExams: number
    completedExams: number

    // Application Stats
    totalApplications: number
    approvedApplications: number
    rejectedApplications: number
    paidApplications: number

    // User Stats
    totalUsers: number
    activeUsers: number

    // Revenue
    totalRevenue: number

    // Recent Activity
    recentExams: RecentExam[]
}
