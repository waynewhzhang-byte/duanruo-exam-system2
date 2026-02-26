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
import { SuperAdminService } from './super-admin.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) { }

  @Get('tenants')
  @Permissions('tenant:view:all')
  async getAllTenants(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    return this.superAdminService.getAllTenants(pageNum, sizeNum);
  }

  @Post('tenants')
  @Permissions('tenant:create')
  async createTenant(@Body() dto: CreateTenantDto) {
    const tenant = await this.superAdminService.createTenant({
      id: crypto.randomUUID(),
      name: dto.name,
      code: dto.code,
      schemaName: `tenant_${dto.code}`,
      contactEmail: dto.contactEmail,
    });
    return ApiResult.ok(tenant);
  }

  @Post('tenants/:id/activate')
  @Permissions('tenant:update')
  async activateTenant(@Param('id') id: string) {
    const tenant =
      await this.superAdminService.activateTenant(id);
    return ApiResult.ok(tenant);
  }

  @Post('tenants/:id/deactivate')
  @Permissions('tenant:update')
  async deactivateTenant(@Param('id') id: string) {
    const tenant =
      await this.superAdminService.deactivateTenant(id);
    return ApiResult.ok(tenant);
  }

  @Delete('tenants/:id')
  @Permissions('tenant:delete')
  async deleteTenant(@Param('id') id: string) {
    await this.superAdminService.deleteTenant(id);
    return ApiResult.ok(null, 'Tenant deleted');
  }

  @Get('users')
  @Permissions('user:view')
  async getAllUsers(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    return this.superAdminService.getAllUsers(pageNum, sizeNum);
  }
}
