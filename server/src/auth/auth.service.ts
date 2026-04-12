import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { getPermissionsForRoles } from './permissions.config';
import * as bcrypt from 'bcrypt';
import { User, UserTenantRole } from '@prisma/client';
import { parseUserRoles } from './roles.util';

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

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
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
}
