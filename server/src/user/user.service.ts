import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { UserResponse, UserTenantRoleResponse } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.client.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.mapToResponse(user);
  }

  async findMyTenants(userId: string): Promise<UserTenantRoleResponse[]> {
    const roles = await this.client.userTenantRole.findMany({
      where: { userId, active: true },
      include: { tenant: true },
    });

    return roles.map((r) => ({
      id: r.id,
      userId: r.userId,
      tenantId: r.tenantId,
      role: r.role,
      active: r.active,
      tenant: {
        id: r.tenant.id,
        name: r.tenant.name,
        code: r.tenant.code,
        schemaName: r.tenant.schemaName,
        status: r.tenant.status,
        contactEmail: r.tenant.contactEmail,
        contactPhone: r.tenant.contactPhone ?? undefined,
        createdAt: r.tenant.createdAt,
      },
    }));
  }

  private mapToResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber ?? undefined,
      status: user.status,
      roles: JSON.parse(user.roles) as string[],
      createdAt: user.createdAt,
    };
  }
}
