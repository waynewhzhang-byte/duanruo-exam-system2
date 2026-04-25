import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, ReviewStatus } from '../common/enums';

export interface PlatformStatistics {
  totalTenants: number;
  activeTenants: number;
  totalExams: number;
  totalApplications: number;
  totalUsers: number;
  totalRevenue: number;
}

export interface ApplicationStatistics {
  totalApplications: number;
  byStatus: Record<string, number>;
  byExam: Record<string, number>;
  byPosition: Record<string, number>;
  recentApplications: unknown[];
}

export interface ReviewStatistics {
  totalReviews: number;
  pendingPrimary: number;
  pendingSecondary: number;
  approved: number;
  rejected: number;
  averageReviewTime: number;
}

export interface FunnelStep {
  name: string;
  value: number;
  fill: string;
}

export interface PositionScoreAnalysis {
  positionId: string;
  positionTitle: string;
  averageScore: number;
  maxScore: number;
  minScore: number;
  totalCandidates: number;
  scoredCandidates: number;
  passCount: number;
  passRate: number;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  /**
   * 获取招聘流程漏斗数据
   */
  async getFunnelStatistics(examId?: string): Promise<FunnelStep[]> {
    const where: { examId?: string } = {};
    if (examId) where.examId = examId;

    const [total, submitted, primaryPassed, approved, paid, ticketIssued] =
      await Promise.all([
        this.client.application.count({ where }),
        this.client.application.count({
          where: { ...where, status: { notIn: [ApplicationStatus.DRAFT] } },
        }),
        this.client.application.count({
          where: {
            ...where,
            status: {
              in: [
                ApplicationStatus.PRIMARY_PASSED,
                ApplicationStatus.PENDING_SECONDARY_REVIEW,
                ApplicationStatus.APPROVED,
                ApplicationStatus.PAID,
                ApplicationStatus.TICKET_ISSUED,
              ],
            },
          },
        }),
        this.client.application.count({
          where: {
            ...where,
            status: {
              in: [
                ApplicationStatus.APPROVED,
                ApplicationStatus.PAID,
                ApplicationStatus.TICKET_ISSUED,
              ],
            },
          },
        }),
        this.client.application.count({
          where: {
            ...where,
            status: {
              in: [ApplicationStatus.PAID, ApplicationStatus.TICKET_ISSUED],
            },
          },
        }),
        this.client.application.count({
          where: { ...where, status: ApplicationStatus.TICKET_ISSUED },
        }),
      ]);

    return [
      { name: '全部报名', value: total, fill: '#8884d8' },
      { name: '已提交', value: submitted, fill: '#83a6ed' },
      { name: '一审通过', value: primaryPassed, fill: '#8dd1e1' },
      { name: '二审通过', value: approved, fill: '#82ca9d' },
      { name: '已支付', value: paid, fill: '#a4de6c' },
      { name: '已发证', value: ticketIssued, fill: '#d0ed57' },
    ];
  }

  /**
   * 获取成绩深度分析数据
   */
  async getScoreAnalysis(examId: string): Promise<PositionScoreAnalysis[]> {
    const positions = await this.client.position.findMany({
      where: { examId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    const analysis = await Promise.all(
      positions.map(async (pos) => {
        const stats = await this.client.application.aggregate({
          where: {
            positionId: pos.id,
            status: {
              in: [ApplicationStatus.APPROVED, ApplicationStatus.TICKET_ISSUED],
            },
          },
          _avg: { totalWrittenScore: true },
          _max: { totalWrittenScore: true },
          _min: { totalWrittenScore: true },
          _count: { totalWrittenScore: true },
        });

        const passCount = await this.client.application.count({
          where: { positionId: pos.id, writtenPassStatus: 'PASS' },
        });

        return {
          positionId: pos.id,
          positionTitle: pos.title,
          averageScore: stats._avg.totalWrittenScore
            ? Number(stats._avg.totalWrittenScore.toFixed(2))
            : 0,
          maxScore: stats._max.totalWrittenScore
            ? Number(stats._max.totalWrittenScore)
            : 0,
          minScore: stats._min.totalWrittenScore
            ? Number(stats._min.totalWrittenScore)
            : 0,
          totalCandidates: pos._count.applications,
          scoredCandidates: stats._count.totalWrittenScore,
          passCount,
          passRate:
            pos._count.applications > 0
              ? Number(((passCount / pos._count.applications) * 100).toFixed(2))
              : 0,
        };
      }),
    );

    return analysis;
  }

  /**
   * Tenant-level statistics (current tenant)
   */
  async getTenantStatistics() {
    const [totalExams, totalApplications, totalUsers, recentExams] =
      await Promise.all([
        this.client.exam.count(),
        this.client.application.count(),
        this.client.user.count(),
        this.client.exam.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            examStart: true,
            _count: { select: { applications: true } },
          },
        }),
      ]);

    const approvedApplications = await this.client.application.count({
      where: { status: ApplicationStatus.APPROVED },
    });
    const rejectedApplications = await this.client.application.count({
      where: { status: 'REJECTED' },
    });
    const paidApplications = await this.client.application.count({
      where: { status: { in: ['PAID', 'APPROVED', 'TICKET_ISSUED'] } },
    });

    return {
      totalExams,
      activeExams: totalExams,
      completedExams: 0,
      totalApplications,
      approvedApplications,
      rejectedApplications,
      pendingApplications:
        totalApplications - approvedApplications - rejectedApplications,
      paidApplications,
      totalUsers,
      activeUsers: totalUsers,
      totalRevenue: 0,
      recentExams: recentExams.map((exam) => ({
        examId: exam.id,
        examTitle: exam.title,
        startDate: exam.examStart?.toISOString().split('T')[0] || '',
        applications: exam._count.applications,
      })),
    };
  }

  /**
   * Platform-level statistics (public schema + aggregated tenant data)
   */
  async getPlatformStatistics(): Promise<PlatformStatistics> {
    const [totalTenants, activeTenants, totalUsers, tenants] =
      await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count(),
        this.prisma.tenant.findMany({
          where: { status: 'ACTIVE' },
          select: { schemaName: true },
        }),
      ]);

    let totalExams = 0;
    let totalApplications = 0;

    for (const tenant of tenants) {
      const [examCount, appCount] = await PrismaService.runInTenantContext(
        tenant.schemaName,
        () =>
          Promise.all([
            this.client.exam.count(),
            this.client.application.count(),
          ]),
      );
      totalExams += examCount;
      totalApplications += appCount;
    }

    return {
      totalTenants,
      activeTenants,
      totalExams,
      totalApplications,
      totalUsers,
      totalRevenue: 0,
    };
  }

  /**
   * Tenant-scoped application statistics (uses request tenant context)
   */
  async getApplicationStatistics(
    examId?: string,
    positionId?: string,
  ): Promise<ApplicationStatistics> {
    const where: { examId?: string; positionId?: string } = {};
    if (examId) where.examId = examId;
    if (positionId) where.positionId = positionId;

    const totalApplications = await this.client.application.count({ where });

    const [byStatus, byExam, byPosition] = await Promise.all([
      this.client.application.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.client.application.groupBy({
        by: ['examId'],
        where,
        _count: { examId: true },
      }),
      this.client.application.groupBy({
        by: ['positionId'],
        where,
        _count: { positionId: true },
      }),
    ]);

    const recentApplications = await this.client.application.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        createdAt: true,
      },
    });

    return {
      totalApplications,
      byStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count.status]),
      ),
      byExam: Object.fromEntries(
        byExam.map((e) => [e.examId, e._count.examId]),
      ),
      byPosition: Object.fromEntries(
        byPosition.map((p) => [p.positionId, p._count.positionId]),
      ),
      recentApplications,
    };
  }

  /**
   * Tenant-scoped review statistics (uses request tenant context)
   */
  async getReviewStatistics(
    examId?: string,
    reviewerId?: string,
  ): Promise<ReviewStatistics> {
    const where: {
      applicationId?: { in: string[] };
      reviewerId?: string;
    } = {};
    if (reviewerId) where.reviewerId = reviewerId;
    if (examId) {
      const apps = await this.client.application.findMany({
        where: { examId },
        select: { id: true },
      });
      where.applicationId = { in: apps.map((a) => a.id) };
    }

    const [totalReviews, reviews, pendingTasks] = await Promise.all([
      this.client.review.count({ where }),
      this.client.review.findMany({
        where,
        select: { decision: true, reviewedAt: true, createdAt: true },
      }),
      this.client.reviewTask.groupBy({
        by: ['stage'],
        where: where.applicationId
          ? {
              status: { in: ['OPEN', 'ASSIGNED'] },
              applicationId: where.applicationId,
            }
          : { status: { in: ['OPEN', 'ASSIGNED'] } },
        _count: { stage: true },
      }),
    ]);

    const pendingByStage = Object.fromEntries(
      pendingTasks.map((t) => [t.stage, t._count.stage]),
    );
    const pendingPrimary = pendingByStage['PRIMARY'] ?? 0;
    const pendingSecondary = pendingByStage['SECONDARY'] ?? 0;
    const approved = reviews.filter(
      (r) => r.decision === ReviewStatus.APPROVED,
    ).length;
    const rejected = reviews.filter(
      (r) => r.decision === ReviewStatus.REJECTED,
    ).length;

    const reviewedWithTime = reviews.filter(
      (r) => r.reviewedAt && r.createdAt,
    ) as Array<{ reviewedAt: Date; createdAt: Date }>;
    const averageReviewTime =
      reviewedWithTime.length > 0
        ? reviewedWithTime.reduce(
            (sum, r) =>
              sum +
              (r.reviewedAt.getTime() - r.createdAt.getTime()) / (1000 * 60),
            0,
          ) / reviewedWithTime.length
        : 0;

    return {
      totalReviews,
      pendingPrimary,
      pendingSecondary,
      approved,
      rejected,
      averageReviewTime: Math.round(averageReviewTime * 100) / 100,
    };
  }
}
