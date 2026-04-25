import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { UserService } from '../user/user.service';
import { AuditService } from '../common/security/audit.service';
import type { Tenant, User } from '@prisma/client';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/paginated-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { parseUserRoles } from '../auth/roles.util';

export interface CreateTenantInput {
  id: string;
  name: string;
  code: string;
  schemaName: string;
  contactEmail: string;
}

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly userService: UserService,
    private readonly auditService: AuditService,
  ) {}

  async createUser(dto: CreateUserDto) {
    try {
      return await this.userService.createUser(dto);
    } catch (error) {
      this.logger.error(
        `createUser failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getAllTenants(
    page: number,
    size: number,
  ): Promise<PaginatedResponse<Tenant & { slug: string }>> {
    const skip = page * size;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    const tenantsWithSlug = tenants.map((t: Tenant) => ({
      ...t,
      slug: t.code,
    }));

    return PaginationHelper.createResponse(tenantsWithSlug, total, page, size);
  }

  async createTenant(input: CreateTenantInput) {
    return this.tenantService.createTenant(input);
  }

  async activateTenant(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
  }

  async deactivateTenant(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'INACTIVE', deactivatedAt: new Date() },
    });
  }

  async deleteTenant(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async getAllUsers(
    page: number,
    size: number,
  ): Promise<
    PaginatedResponse<{
      id: string;
      username: string;
      email: string;
      fullName: string;
      phoneNumber: string | null;
      status: string;
      roles: string[];
      createdAt: Date;
    }>
  > {
    const skip = page * size;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          status: true,
          roles: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    const parsed = users.map((u) => ({
      ...u,
      roles: parseUserRoles(u.roles),
    }));

    return PaginationHelper.createResponse(parsed, total, page, size);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, dto);
  }

  async deleteUser(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
