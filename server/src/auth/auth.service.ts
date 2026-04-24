import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { getPermissionsForRoles } from './permissions.config';
import * as bcrypt from 'bcrypt';
import { Prisma, User, UserTenantRole } from '@prisma/client';
import { parseUserRoles } from './roles.util';
import { RegisterRequestDto } from './dto/auth.dto';

export interface TenantRoleItem {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  role: string;
  active: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  globalRoles?: string[];
  tenantRoles?: TenantRoleItem[];
  permissions: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

type TenantRoleRow = UserTenantRole & {
  tenant: { name: string; code: string };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<User | null> {
    const normalizedIdentifier = identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedIdentifier },
          { email: normalizedIdentifier },
        ],
      },
    });

    if (!user) {
      return null;
    }

    let isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      // Tolerate accidental copy/paste whitespace without changing
      // the primary password matching behavior.
      const trimmedPass = pass.trim();
      if (trimmedPass !== pass) {
        isPasswordValid = await bcrypt.compare(trimmedPass, user.passwordHash);
      }
    }

    if (isPasswordValid) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const tenantRoles = await this.prisma.userTenantRole.findMany({
      where: { userId: user.id, active: true },
      include: { tenant: true },
    });

    const firstTenantId = tenantRoles[0]?.tenantId ?? null;
    const session = await this.computeSessionForTenant(
      user,
      firstTenantId,
      tenantRoles,
    );

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: session.currentRoles,
      tenantId: session.effectiveTenantId,
      permissions: session.permissions,
    };

    const globalRoles = parseUserRoles(user.roles);
    const resultUser = this.buildUserResponse(
      user,
      session.currentRoles,
      session.permissions,
      {
        globalRoles,
        tenantRoles: session.tenantRoleItems,
      },
    );

    return {
      token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: resultUser,
      tenantRoles: session.tenantRoleItems,
    };
  }

  async registerCandidate(dto: RegisterRequestDto): Promise<UserResponse> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }

    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const phoneNumber = dto.phoneNumber?.trim() || undefined;
    const department = dto.department?.trim() || null;
    const jobTitle = dto.jobTitle?.trim() || null;

    const duplicateFilters: Prisma.UserWhereInput[] = [{ username }, { email }];
    if (phoneNumber) {
      duplicateFilters.push({ phoneNumber });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: duplicateFilters,
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === email) {
        throw new ConflictException('邮箱已存在');
      }
      if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        throw new ConflictException('手机号已存在');
      }
      throw new ConflictException('用户名、邮箱或手机号已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          email,
          fullName,
          passwordHash,
          phoneNumber,
          department,
          jobTitle,
          status: 'ACTIVE',
          roles: JSON.stringify(['CANDIDATE']),
        },
      });

      const roles = ['CANDIDATE'];
      return this.buildUserResponse(
        user,
        roles,
        getPermissionsForRoles(roles),
        {
          globalRoles: roles,
          tenantRoles: [],
        },
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(this.buildUniqueConflictMessage(error));
      }
      throw error;
    }
  }

  async selectTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const globalRoles = parseUserRoles(user.roles);
    const isSuperAdmin = globalRoles.includes('SUPER_ADMIN');

    if (!isSuperAdmin) {
      const utr = await this.prisma.userTenantRole.findFirst({
        where: { userId, tenantId, active: true },
      });
      if (!utr) {
        throw new UnauthorizedException('No access to this tenant');
      }
    }

    const session = await this.computeSessionForTenant(user, tenantId);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      tenantId,
      roles: session.currentRoles,
      permissions: session.permissions,
      status: user.status,
    };

    return {
      token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      user: this.buildUserResponse(
        user,
        session.currentRoles,
        session.permissions,
        {
          globalRoles,
          tenantRoles: session.tenantRoleItems,
        },
      ),
    };
  }

  /**
   * Full role merge (all tenants) for account overview / legacy clients.
   * When `sessionTenantId` is set, returns roles & permissions for that tenant only (matches JWT session).
   */
  async getMe(userId: string, sessionTenantId?: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (sessionTenantId !== undefined) {
      const session = await this.computeSessionForTenant(user, sessionTenantId);
      const globalRoles = parseUserRoles(user.roles);
      return this.buildUserResponse(
        user,
        session.currentRoles,
        session.permissions,
        {
          globalRoles,
          tenantRoles: session.tenantRoleItems,
        },
      );
    }

    const { mergedRoles, tenantRoleItems, globalRoles } =
      await this.resolveUserRoles(user);

    const permissions = getPermissionsForRoles(mergedRoles);

    return this.buildUserResponse(user, mergedRoles, permissions, {
      globalRoles,
      tenantRoles: tenantRoleItems,
    });
  }

  /**
   * Re-issue JWT with the same session semantics as login/select-tenant (no cross-tenant permission merge).
   */
  async refreshToken(userId: string, sessionTenantId?: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const effectiveTenantId =
      sessionTenantId === undefined || sessionTenantId === ''
        ? null
        : sessionTenantId;

    const session = await this.computeSessionForTenant(user, effectiveTenantId);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: session.currentRoles,
      tenantId: session.effectiveTenantId,
      permissions: session.permissions,
    };

    const globalRoles = parseUserRoles(user.roles);

    return {
      token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: this.buildUserResponse(
        user,
        session.currentRoles,
        session.permissions,
        {
          globalRoles,
          tenantRoles: session.tenantRoleItems,
        },
      ),
    };
  }

  /**
   * Effective roles for the active tenant (or platform-only when activeTenantId is null).
   * Super admins may use a tenant context without a UserTenantRole row.
   */
  private async computeSessionForTenant(
    user: User,
    activeTenantId: string | null,
    preloadedTenantRoles?: TenantRoleRow[],
  ): Promise<{
    currentRoles: string[];
    permissions: string[];
    tenantRoleItems: TenantRoleItem[];
    effectiveTenantId: string | null;
  }> {
    const tenantRoles =
      preloadedTenantRoles ??
      (await this.prisma.userTenantRole.findMany({
        where: { userId: user.id, active: true },
        include: { tenant: true },
      }));

    const tenantRoleItems = this.mapTenantRoles(tenantRoles);
    const globalRoles = parseUserRoles(user.roles);
    const isSuperAdmin = globalRoles.includes('SUPER_ADMIN');

    if (!activeTenantId) {
      return {
        currentRoles: globalRoles,
        permissions: getPermissionsForRoles(globalRoles),
        tenantRoleItems,
        effectiveTenantId: null,
      };
    }

    const tenantRole = tenantRoles.find((tr) => tr.tenantId === activeTenantId);

    if (!isSuperAdmin && !tenantRole) {
      throw new UnauthorizedException('No access to this tenant');
    }

    const currentRoles = Array.from(
      new Set([...globalRoles, ...(tenantRole ? [tenantRole.role] : [])]),
    );

    return {
      currentRoles,
      permissions: getPermissionsForRoles(currentRoles),
      tenantRoleItems,
      effectiveTenantId: activeTenantId,
    };
  }

  private buildUserResponse(
    user: User,
    roles: string[],
    permissions: string[],
    extra: { globalRoles: string[]; tenantRoles: TenantRoleItem[] },
  ): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles,
      globalRoles: extra.globalRoles,
      tenantRoles: extra.tenantRoles,
      permissions,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private mapTenantRoles(
    tenantRoles: (UserTenantRole & {
      tenant: { name: string; code: string };
    })[],
  ): TenantRoleItem[] {
    return tenantRoles.map((tr) => ({
      tenantId: tr.tenantId,
      tenantName: tr.tenant.name,
      tenantCode: tr.tenant.code,
      role: tr.role,
      active: tr.active,
    }));
  }

  private async resolveUserRoles(user: User) {
    const tenantRoles = await this.prisma.userTenantRole.findMany({
      where: { userId: user.id, active: true },
      include: { tenant: true },
    });

    const globalRoles = parseUserRoles(user.roles);
    const mergedRoles = Array.from(
      new Set([...globalRoles, ...tenantRoles.map((tr) => tr.role)]),
    );

    return {
      mergedRoles,
      tenantRoleItems: this.mapTenantRoles(tenantRoles),
      globalRoles,
    };
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
}
