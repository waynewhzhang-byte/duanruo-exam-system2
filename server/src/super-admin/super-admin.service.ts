import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import type { Tenant } from '@prisma/client';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/paginated-response.dto';

export interface CreateTenantInput {
  id: string;
  name: string;
  code: string;
  schemaName: string;
  contactEmail: string;
}

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) { }

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
      status: string;
      roles: string;
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
          status: true,
          roles: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return PaginationHelper.createResponse(users, total, page, size);
  }
}
