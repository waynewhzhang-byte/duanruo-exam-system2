import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ReviewService } from '../review/review.service';
import { ApplicationSubmitRequest } from './dto/application.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('applications')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly reviewService: ReviewService,
  ) { }

  @Get('my')
  @Permissions('application:view:own')
  async getMyApplications(@Req() req: AuthenticatedRequest) {
    const apps = await this.applicationService.listMyEnriched(req.user.userId);
    return ApiResult.ok(apps);
  }

  @Get()
  @Permissions('application:view:all')
  async listAll(
    @Query('examId') examId?: string,
    @Query('status') status?: string,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    const { content, total } = await this.applicationService.listAll({
      examId,
      status,
      page: Number(page),
      size: Number(size),
    });
    return {
      success: true,
      data: {
        content,
        total,
        page: Number(page),
        size: Number(size),
      },
    };
  }

  @Get('drafts/my')
  @Permissions('application:view:own') // Users can view their own drafts
  async getMyDrafts(@Req() req: AuthenticatedRequest) {
    const drafts = await this.applicationService.listMyDrafts(req.user.userId);
    return ApiResult.ok(drafts);
  }

  @Post()
  @Permissions('application:create')
  async submit(
    @Body() request: ApplicationSubmitRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const app = await this.applicationService.submit(req.user.userId, request);
    return ApiResult.ok(app, 'Application submitted successfully');
  }

  @Post('drafts')
  @Permissions('application:create') // Also for saving drafts
  async saveDraft(
    @Body() request: ApplicationSubmitRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const app = await this.applicationService.saveDraft(
      req.user.userId,
      request,
    );
    return ApiResult.ok(app, 'Draft saved successfully');
  }

  @Get(':id')
  @Permissions('application:view:own')
  async getById(@Param('id') id: string) {
    const app = await this.applicationService.findById(id);
    return ApiResult.ok(app);
  }

  @Get(':id/reviews')
  @Permissions('review:view')
  async getReviews(@Param('id') id: string) {
    const reviews = await this.reviewService.getByApplicationId(id);
    return ApiResult.ok(reviews);
  }
}
