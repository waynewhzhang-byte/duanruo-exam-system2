import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../super-admin/dto/create-user.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { code: slug },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }

  @Get(':tenantId/users/details/categorized')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @Permissions('user:view')
  @ApiOperation({ summary: '租户下用户按审核员/考生分类' })
  async getTenantUsersCategorized(@Param('tenantId') tenantId: string) {
    const result = await this.userService.getTenantUsersCategorized(tenantId);
    return ApiResult.ok(result);
  }

  /** Flat list for legacy callers (e.g. admin reviewers page); same entries as categorized, merged. */
  @Get(':tenantId/users/details')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @Permissions('user:view')
  @ApiOperation({ summary: '租户下用户列表（扁平）' })
  async getTenantUsersDetails(@Param('tenantId') tenantId: string) {
    const { reviewers, candidates } =
      await this.userService.getTenantUsersCategorized(tenantId);
    return ApiResult.ok([...reviewers, ...candidates]);
  }

  @Post(':tenantId/users')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @Permissions('user:create')
  @ApiOperation({ summary: '租户管理员创建用户' })
  async createUser(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    // 强制设置租户 ID，防止越权
    dto.tenantId = tenantId;
    // 如果没有指定角色，默认为 CANDIDATE
    if (!dto.tenantRole) {
      dto.tenantRole = 'CANDIDATE';
    }
    const user = await this.userService.createUser(dto);
    return ApiResult.ok(user, '用户创建并关联成功');
  }
}
