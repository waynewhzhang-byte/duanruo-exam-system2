import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { ProfileService, UpdateProfileDto } from './profile.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  /**
   * 获取当前用户档案
   */
  @Get()
  @Permissions('profile:view:own')
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const profile = await this.profileService.getProfile(userId);
    return ApiResult.ok(profile);
  }

  /**
   * 获取脱敏的档案信息（报名时使用）
   */
  @Get('for-application')
  @Permissions('profile:view:own')
  async getProfileForApplication(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const profile = await this.profileService.getMaskedProfile(userId);
    return ApiResult.ok(profile);
  }

  /**
   * 创建/更新档案
   */
  @Post()
  @Permissions('profile:create', 'profile:update')
  async createOrUpdateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.userId;
    const profile = await this.profileService.upsertProfile(userId, dto);
    return ApiResult.ok(profile, '档案保存成功');
  }

  /**
   * 更新档案
   */
  @Put()
  @Permissions('profile:update')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.userId;
    const profile = await this.profileService.updateProfile(userId, dto);
    return ApiResult.ok(profile, '档案更新成功');
  }

  /**
   * 删除档案
   */
  @Delete()
  @Permissions('profile:delete')
  async deleteProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    await this.profileService.deleteProfile(userId);
    return ApiResult.ok(null, '档案删除成功');
  }

  /**
   * 根据用户ID获取档案（管理员用）
   */
  @Get('user/:userId')
  @Permissions('profile:view:all')
  async getUserProfile(@Param('userId') userId: string) {
    const profile = await this.profileService.getProfile(userId);
    return ApiResult.ok(profile);
  }
}
