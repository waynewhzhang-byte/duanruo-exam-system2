import * as crypto from 'crypto';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ApiResult } from '../common/dto/api-result.dto';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Tenant } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
// @Roles('SUPER_ADMIN') // Assuming roles guard is implemented
export class SuperAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('tenants')
  async getAllTenants(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ): Promise<PaginatedResponse<Tenant & { slug: string }>> {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    const skip = pageNum * sizeNum;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: sizeNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    // Add 'slug' field for frontend compatibility (frontend uses 'slug' but backend uses 'code')
    const tenantsWithSlug = tenants.map((t: Tenant) => ({
      ...t,
      slug: t.code,
    }));

    return PaginationHelper.createResponse(
      tenantsWithSlug,
      total,
      pageNum,
      sizeNum,
    );
  }

  @Post('tenants')
  async createTenant(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantService.createTenant({
      id: crypto.randomUUID(),
      name: dto.name,
      code: dto.code,
      schemaName: `tenant_${dto.code}`,
      contactEmail: dto.contactEmail,
    });
    return ApiResult.ok(tenant);
  }

  @Post('tenants/:id/activate')
  async activateTenant(@Param('id') id: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
    return ApiResult.ok(tenant);
  }

  @Post('tenants/:id/deactivate')
  async deactivateTenant(@Param('id') id: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'INACTIVE', deactivatedAt: new Date() },
    });
    return ApiResult.ok(tenant);
  }

  @Delete('tenants/:id')
  async deleteTenant(@Param('id') id: string) {
    await this.prisma.tenant.delete({
      where: { id },
    });
    return ApiResult.ok(null, 'Tenant deleted');
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ): Promise<
    PaginatedResponse<{
      id: string;
      username: string;
      email: string;
      fullName: string;
      status: string;
      roles: string;
      createdAt: Date;
    }>
  > {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    const skip = pageNum * sizeNum;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: sizeNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          status: true,
          roles: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return PaginationHelper.createResponse(users, total, pageNum, sizeNum);
  }
}
