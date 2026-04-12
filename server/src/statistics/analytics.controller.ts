import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';

/**
 * Dashboard analytics routes expected by `web/src/lib/analytics-hooks.ts`.
 * Data is tenant-scoped via Prisma tenant context.
 */
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly prisma: PrismaService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  @Get('overview')
  @Permissions('statistics:tenant:view')
  async overview() {
    const tenantStats = await this.statisticsService.getTenantStatistics();
    const reviewStats = await this.statisticsService.getReviewStatistics();

    const [activeExams, issuedTickets, completedPayments] = await Promise.all([
      this.client.exam.count({
        where: {
          status: { in: ['REGISTRATION_OPEN', 'OPEN', 'IN_PROGRESS'] },
        },
      }),
      this.client.ticket.count(),
      this.client.paymentOrder.count({ where: { status: 'SUCCESS' } }),
    ]);

    return {
      totalExams: tenantStats.totalExams,
      totalApplications: tenantStats.totalApplications,
      totalCandidates: tenantStats.totalUsers,
      totalRevenue: tenantStats.totalRevenue,
      activeExams,
      pendingReviews: reviewStats.pendingPrimary + reviewStats.pendingSecondary,
      completedPayments,
      issuedTickets,
    };
  }

  @Get('exam-stats')
  @Permissions('statistics:tenant:view')
  async examStats(
    @Query('examId') examId?: string,
    @Query('dateRange') _dateRange?: string,
  ) {
    const exams = await this.client.exam.findMany({
      where: examId ? { id: examId } : undefined,
      select: {
        id: true,
        title: true,
      },
    });

    const rows = await Promise.all(
      exams.map(async (exam) => {
        const apps = await this.client.application.findMany({
          where: { examId: exam.id },
          select: { status: true },
        });
        const totalApplications = apps.length;
        const approvedApplications = apps.filter((a) =>
          ['APPROVED', 'PAID', 'TICKET_ISSUED'].includes(a.status),
        ).length;
        const rejectedApplications = apps.filter((a) =>
          ['PRIMARY_REJECTED', 'SECONDARY_REJECTED', 'AUTO_REJECTED'].includes(
            a.status,
          ),
        ).length;
        const pendingApplications = apps.filter((a) =>
          [
            'SUBMITTED',
            'PENDING_PRIMARY_REVIEW',
            'PENDING_SECONDARY_REVIEW',
          ].includes(a.status),
        ).length;

        return {
          examId: exam.id,
          examTitle: exam.title,
          totalApplications,
          approvedApplications,
          rejectedApplications,
          pendingApplications,
          revenue: 0,
          averageProcessingTime: 0,
          conversionRate:
            totalApplications > 0
              ? Math.round((approvedApplications / totalApplications) * 10000) /
                100
              : 0,
        };
      }),
    );

    return rows;
  }

  @Get('application-trends')
  @Permissions('statistics:tenant:view')
  applicationTrends(
    @Query('dateRange') _dateRange?: string,
    @Query('granularity') _granularity?: string,
  ) {
    return [] as Array<{
      date: string;
      applications: number;
      approvals: number;
      rejections: number;
      payments: number;
    }>;
  }

  @Get('reviewer-performance')
  @Permissions('statistics:tenant:view')
  reviewerPerformance(@Query('dateRange') _dateRange?: string) {
    return [] as Array<{
      reviewerId: string;
      reviewerName: string;
      totalReviews: number;
      averageReviewTime: number;
      approvalRate: number;
      workload: number;
    }>;
  }

  @Get('payment-analytics')
  @Permissions('statistics:tenant:view')
  paymentAnalytics(@Query('dateRange') _dateRange?: string) {
    return {
      totalRevenue: 0,
      averagePaymentAmount: 0,
      paymentMethodStats: [] as Array<{
        method: string;
        count: number;
        amount: number;
      }>,
      dailyRevenue: [] as Array<{ date: string; amount: number }>,
    };
  }

  @Get('candidate-analytics')
  @Permissions('statistics:tenant:view')
  async candidateAnalytics(@Query('dateRange') _dateRange?: string) {
    const totalCandidates = await this.client.user.count();
    return {
      totalCandidates,
      newCandidatesThisMonth: 0,
      candidatesByEducation: [] as Array<{ education: string; count: number }>,
      candidatesByAge: [] as Array<{ ageRange: string; count: number }>,
      topCities: [] as Array<{ city: string; count: number }>,
    };
  }

  @Get('system-performance')
  @Permissions('statistics:tenant:view')
  systemPerformance() {
    return {
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 99.9,
      activeUsers: 0,
      peakConcurrentUsers: 0,
      storageUsage: {
        used: 0,
        total: 1,
        percentage: 0,
      },
    };
  }
}
