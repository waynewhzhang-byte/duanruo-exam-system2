import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('statistics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatisticsController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('platform')
    @Permissions('statistics:system:view')
    async getPlatformStatistics() {
        const [totalTenants, activeTenants, totalExams, totalApplications, totalUsers] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
            this.prisma.exam.count(),
            this.prisma.application.count(),
            this.prisma.user.count(),
        ]);

        return ApiResult.ok({
            totalTenants,
            activeTenants,
            totalExams,
            totalApplications,
            totalUsers,
            totalRevenue: 0,
        });
    }

    @Get('applications')
    @Permissions('statistics:tenant:view')
    async getApplicationStatistics(
        @Query('examId') examId?: string,
        @Query('positionId') positionId?: string,
    ) {
        const where: any = {};
        if (examId) where.examId = examId;
        if (positionId) where.positionId = positionId;

        const totalApplications = await this.prisma.application.count({ where });
        // Simplified stats for now
        return ApiResult.ok({
            totalApplications,
            byStatus: {},
            byExam: {},
            byPosition: {},
            recentApplications: [],
        });
    }

    @Get('reviews')
    @Permissions('statistics:tenant:view')
    async getReviewStatistics(
        @Query('examId') examId?: string,
        @Query('reviewerId') reviewerId?: string,
    ) {
        // Simplified stats for now
        return ApiResult.ok({
            totalReviews: 0,
            pendingPrimary: 0,
            pendingSecondary: 0,
            approved: 0,
            rejected: 0,
            averageReviewTime: 0,
        });
    }
}
