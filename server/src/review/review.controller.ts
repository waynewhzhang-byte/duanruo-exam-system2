import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PullTaskRequest, DecisionTaskRequest } from './dto/review.dto';
import { BatchReviewDecisionRequest } from '../common/dto/batch.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/paginated-response.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('stats/me')
  @Permissions('review:view')
  async getMyStats(@Req() req: AuthenticatedRequest) {
    const stats = await this.reviewService.getMyStats(req.user.userId);
    return ApiResult.ok(stats);
  }

  @Post('pull')
  @Permissions('review:perform')
  async pullTask(
    @Req() req: AuthenticatedRequest,
    @Body() request: PullTaskRequest,
  ) {
    const result = await this.reviewService.pullNext(req.user.userId, request);
    if (!result) {
      return ApiResult.ok(null, 'No tasks available in queue');
    }
    return ApiResult.ok(result);
  }

  @Post('decide')
  @Permissions('review:perform')
  async decide(
    @Req() req: AuthenticatedRequest,
    @Body() request: DecisionTaskRequest,
  ) {
    const result = await this.reviewService.decide(req.user.userId, request);
    return ApiResult.ok(result, 'Review decision recorded');
  }

  @Post('batch-decide')
  @Permissions('review:perform')
  async batchDecide(
    @Req() req: AuthenticatedRequest,
    @Body() request: BatchReviewDecisionRequest,
  ) {
    const result = await this.reviewService.batchDecide(
      req.user.userId,
      request.decisions,
    );
    return ApiResult.ok(result, 'Batch review decisions recorded');
  }

  @Post('tasks/:id/heartbeat')
  @Permissions('review:perform')
  async heartbeat(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const result = await this.reviewService.heartbeat(id, req.user.userId);
    return ApiResult.ok(result);
  }

  @Post('tasks/:id/release')
  @Permissions('review:perform')
  async release(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const result = await this.reviewService.release(id, req.user.userId);
    return ApiResult.ok(result);
  }

  @Get('queue')
  @Permissions('review:view')
  async getQueue(
    @Query('examId') examId: string,
    @Query('stage') stage: string,
    @Query('status') status?: string,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { content, total } = await this.reviewService.getQueue({
      examId,
      stage,
      status,
      page: Number(page),
      size: Number(size),
    });
    return PaginationHelper.createResponse(
      content,
      total,
      Number(page),
      Number(size),
    );
  }

  @Get('history')
  @Permissions('review:view')
  async getHistory(
    @Query('examId') examId?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { content, total } = await this.reviewService.getHistory({
      examId,
      reviewerId,
      page: Number(page),
      size: Number(size),
    });
    return PaginationHelper.createResponse(
      content,
      total,
      Number(page),
      Number(size),
    );
  }
}
