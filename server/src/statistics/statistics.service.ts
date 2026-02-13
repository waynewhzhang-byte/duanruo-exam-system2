import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) { }

  private get client() {
    return this.prisma.client;
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

    const byStatus = await this.client.application.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const byExam = await this.client.application.groupBy({
      by: ['examId'],
      where,
      _count: { examId: true },
    });

    const byPosition = await this.client.application.groupBy({
      by: ['positionId'],
      where,
      _count: { positionId: true },
    });

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
          ? { status: { in: ['OPEN', 'ASSIGNED'] }, applicationId: where.applicationId }
          : { status: { in: ['OPEN', 'ASSIGNED'] } },
        _count: { stage: true },
      }),
    ]);

    const pendingByStage = Object.fromEntries(
      pendingTasks.map((t) => [t.stage, t._count.stage]),
    );
    const pendingPrimary = pendingByStage['PRIMARY'] ?? 0;
    const pendingSecondary = pendingByStage['SECONDARY'] ?? 0;
    const approved = reviews.filter((r) => r.decision === 'APPROVED').length;
    const rejected = reviews.filter((r) => r.decision === 'REJECTED').length;

    const reviewedWithTime = reviews.filter(
      (r) => r.reviewedAt && r.createdAt,
    ) as Array<{ reviewedAt: Date; createdAt: Date }>;
    const averageReviewTime =
      reviewedWithTime.length > 0
        ? reviewedWithTime.reduce(
          (sum, r) =>
            sum +
            (r.reviewedAt.getTime() - r.createdAt.getTime()) /
            (1000 * 60),
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
