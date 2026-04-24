import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, User } from '@prisma/client';
import { UserResponse, UserTenantRoleResponse } from './dto/user.dto';
import { parseUserRoles } from '../auth/roles.util';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../super-admin/dto/create-user.dto';
import { UpdateUserDto } from '../super-admin/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  async createUser(dto: CreateUserDto) {
    const normalizedPhoneNumber = dto.phoneNumber?.trim() || undefined;

    const duplicateFilters: Prisma.UserWhereInput[] = [
      { username: dto.username },
      { email: dto.email },
    ];
    if (normalizedPhoneNumber) {
      duplicateFilters.push({ phoneNumber: normalizedPhoneNumber });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: duplicateFilters,
      },
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === dto.email) {
        throw new ConflictException('邮箱已存在');
      }
      if (
        normalizedPhoneNumber &&
        existingUser.phoneNumber === normalizedPhoneNumber
      ) {
        throw new ConflictException('手机号已存在');
      }
      throw new ConflictException('用户名、邮箱或手机号已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username: dto.username,
            email: dto.email,
            fullName: dto.fullName,
            passwordHash,
            phoneNumber: normalizedPhoneNumber,
            status: 'ACTIVE',
            roles: JSON.stringify(dto.globalRoles || []),
            emailVerified: true,
          },
        });

        if (dto.tenantId && dto.tenantRole) {
          await tx.userTenantRole.create({
            data: {
              userId: user.id,
              tenantId: dto.tenantId,
              role: dto.tenantRole,
              active: true,
            },
          });
        }

        return user;
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(this.buildUniqueConflictMessage(error));
      }
      throw error;
    }
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is { code: string; meta?: { target?: unknown } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }

  private buildUniqueConflictMessage(error: {
    meta?: { target?: unknown };
  }): string {
    const targets = Array.isArray(error.meta?.target) ? error.meta.target : [];
    const labels = new Set<string>();

    for (const target of targets) {
      if (target === 'username') {
        labels.add('用户名');
      } else if (target === 'email') {
        labels.add('邮箱');
      } else if (target === 'phone_number' || target === 'phoneNumber') {
        labels.add('手机号');
      }
    }

    if (labels.size > 0) {
      return `${Array.from(labels).join('、')}已存在`;
    }

    return '用户名、邮箱或手机号已存在';
  }

  /**
   * Super-admin 更新用户：密码与全局角色写入规则与 {@link createUser} 一致
   *（bcrypt 哈希、`passwordHash`、`roles` 存 JSON 字符串）。
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.email !== undefined) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existingEmail) {
        throw new BadRequestException('Email already in use');
      }
      updateData.email = dto.email;
    }

    if (dto.username !== undefined) {
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: dto.username, id: { not: id } },
      });
      if (existingUsername) {
        throw new BadRequestException('Username already in use');
      }
      updateData.username = dto.username;
    }

    if (dto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName;
    }

    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.globalRoles !== undefined) {
      updateData.roles = JSON.stringify(dto.globalRoles);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.client.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.mapToResponse(user);
  }

  /** Get users in a tenant grouped as reviewers (PRIMARY/SECONDARY_REVIEWER, TENANT_ADMIN) and candidates (CANDIDATE). */
  async getTenantUsersCategorized(tenantId: string): Promise<{
    reviewers: Array<{ user: UserResponse; tenantRoles: string[] }>;
    candidates: Array<{ user: UserResponse; tenantRoles: string[] }>;
  }> {
    const roles = await this.client.userTenantRole.findMany({
      where: { tenantId, active: true },
      include: { user: true },
      orderBy: { role: 'asc' },
    });

    const byUser = new Map<string, { user: User; roles: string[] }>();
    for (const r of roles) {
      const existing = byUser.get(r.userId);
      if (existing) {
        existing.roles.push(r.role);
      } else {
        byUser.set(r.userId, { user: r.user, roles: [r.role] });
      }
    }

    const reviewerRoles = new Set([
      'TENANT_ADMIN',
      'PRIMARY_REVIEWER',
      'SECONDARY_REVIEWER',
    ]);
    const reviewers: Array<{ user: UserResponse; tenantRoles: string[] }> = [];
    const candidates: Array<{ user: UserResponse; tenantRoles: string[] }> = [];

    for (const { user, roles: userRoles } of byUser.values()) {
      const entry = {
        user: this.mapToResponse(user),
        tenantRoles: userRoles,
      };
      const isReviewer = userRoles.some((role) => reviewerRoles.has(role));
      if (isReviewer) {
        reviewers.push(entry);
      } else {
        candidates.push(entry);
      }
    }

    return { reviewers, candidates };
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
      roles: parseUserRoles(user.roles),
      createdAt: user.createdAt,
    };
  }
}
