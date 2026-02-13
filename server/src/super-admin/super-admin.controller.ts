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
import { CreateTenantDto } from './dto/create-tenant.dto';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) { }

  @Get('tenants')
  async getAllTenants(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    return this.superAdminService.getAllTenants(pageNum, sizeNum);
  }

  @Post('tenants')
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
  async activateTenant(@Param('id') id: string) {
    const tenant =
      await this.superAdminService.activateTenant(id);
    return ApiResult.ok(tenant);
  }

  @Post('tenants/:id/deactivate')
  async deactivateTenant(@Param('id') id: string) {
    const tenant =
      await this.superAdminService.deactivateTenant(id);
    return ApiResult.ok(tenant);
  }

  @Delete('tenants/:id')
  async deleteTenant(@Param('id') id: string) {
    await this.superAdminService.deleteTenant(id);
    return ApiResult.ok(null, 'Tenant deleted');
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    return this.superAdminService.getAllUsers(pageNum, sizeNum);
  }
}
