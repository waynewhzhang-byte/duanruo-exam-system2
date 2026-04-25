import * as crypto from 'crypto';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { parseUserRoles } from '../auth/roles.util';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('super-admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('tenants')
  @Permissions('tenant:view:all')
  @ApiOperation({ summary: '获取所有租户列表' })
  @ApiResponse({ status: 200, description: '成功返回分页租户列表' })
  async getAllTenants(@Query('page') page = 0, @Query('size') size = 10) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    return this.superAdminService.getAllTenants(pageNum, sizeNum);
  }

  @Post('users')
  @Permissions('user:create')
  @ApiOperation({ summary: '创建系统用户/租户管理员' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.superAdminService.createUser(dto);
    const { passwordHash: _passwordHash, ...safe } = user;
    return ApiResult.ok({ ...safe, roles: parseUserRoles(user.roles) });
  }

  @Patch('users/:id')
  @Permissions('user:update')
  @ApiOperation({ summary: '更新系统用户' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.superAdminService.updateUser(id, dto);
    const { passwordHash: _passwordHash, ...safe } = user;
    return ApiResult.ok({ ...safe, roles: parseUserRoles(user.roles) });
  }

  @Delete('users/:id')
  @Permissions('user:delete')
  @ApiOperation({ summary: '删除系统用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  async deleteUser(@Param('id') id: string) {
    await this.superAdminService.deleteUser(id);
    return ApiResult.ok(null, 'User deleted');
  }

  @Post('tenants')
  @Permissions('tenant:create')
  @ApiOperation({ summary: '创建新租户' })
  @ApiResponse({ status: 201, description: '租户创建成功' })
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
  @ApiOperation({ summary: '激活租户' })
  async activateTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.activateTenant(id);
    return ApiResult.ok(tenant);
  }

  @Post('tenants/:id/deactivate')
  @Permissions('tenant:update')
  @ApiOperation({ summary: '停用租户' })
  async deactivateTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.deactivateTenant(id);
    return ApiResult.ok(tenant);
  }

  @Delete('tenants/:id')
  @Permissions('tenant:delete')
  @ApiOperation({ summary: '彻底删除租户' })
  async deleteTenant(@Param('id') id: string) {
    await this.superAdminService.deleteTenant(id);
    return ApiResult.ok(null, 'Tenant deleted');
  }

  @Get('users')
  @Permissions('user:view')
  @ApiOperation({ summary: '获取系统所有用户列表' })
  async getAllUsers(@Query('page') page = 0, @Query('size') size = 10) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    return this.superAdminService.getAllUsers(pageNum, sizeNum);
  }
}
