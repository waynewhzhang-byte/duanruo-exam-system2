import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('statistics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) { }

  @Get('platform')
  @Permissions('statistics:system:view')
  async getPlatformStatistics() {
    const data =
      await this.statisticsService.getPlatformStatistics();
    return ApiResult.ok(data);
  }

  @Get('tenant/me')
  @UseGuards(TenantGuard)
  @Permissions('statistics:tenant:view')
  async getCurrentTenantStatistics() {
    const data = await this.statisticsService.getTenantStatistics();
    return ApiResult.ok(data);
  }

  @Get('applications')
  @UseGuards(TenantGuard)
  @Permissions('statistics:tenant:view')
  async getApplicationStatistics(
    @Query('examId') examId?: string,
    @Query('positionId') positionId?: string,
  ) {
    const data = await this.statisticsService.getApplicationStatistics(
      examId,
      positionId,
    );
    return ApiResult.ok(data);
  }

  @Get('reviews')
  @UseGuards(TenantGuard)
  @Permissions('statistics:tenant:view')
  async getReviewStatistics(
    @Query('examId') examId?: string,
    @Query('reviewerId') reviewerId?: string,
  ) {
    const data = await this.statisticsService.getReviewStatistics(
      examId,
      reviewerId,
    );
    return ApiResult.ok(data);
  }
}
