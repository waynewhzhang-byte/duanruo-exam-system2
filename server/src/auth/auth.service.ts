import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

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
      where: {
        userId: user.id,
        active: true,
      },
      include: { tenant: true },
    });

    const globalRoles = JSON.parse(user.roles) as string[];
    let currentTenantId: string | null = null;
    let currentRoles = [...globalRoles];

    if (tenantRoles.length > 0) {
      const primaryTenantRole = tenantRoles[0];
      currentTenantId = primaryTenantRole.tenantId;
      currentRoles = [...globalRoles, primaryTenantRole.role];
    }

    const permissions = this.getPermissionsForRoles(currentRoles);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: currentRoles,
      tenantId: currentTenantId,
      permissions: permissions,
    };

    const resultUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: currentRoles,
      permissions: permissions,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: resultUser,
      tenantRoles: tenantRoles.map((tr) => ({
        tenantId: tr.tenantId,
        tenantName: tr.tenant.name,
        tenantCode: tr.tenant.code,
        role: tr.role,
        active: tr.active,
      })),
    };
  }

  private getPermissionsForRoles(roles: string[]): string[] {
    const permissions = new Set<string>();

    permissions.add('application:view:own');
    permissions.add('application:create');
    permissions.add('file:upload');
    permissions.add('file:view:own');
    permissions.add('ticket:view:own');
    permissions.add('payment:initiate');

    if (roles.includes('CANDIDATE')) {
      permissions.add('exam:view:public');
      permissions.add('application:view:own');
      permissions.add('application:update:own');
      permissions.add('ticket:view:own');
    }

    if (roles.includes('SUPER_ADMIN')) {
      permissions.add('tenant:view:all');
      permissions.add('tenant:create');
      permissions.add('tenant:update');
      permissions.add('tenant:delete');
      permissions.add('user:manage');
      permissions.add('user:view');
      permissions.add('user:create');
      permissions.add('user:update');
      permissions.add('user:delete');
      permissions.add('statistics:system:view');
      permissions.add('exam:view');
      permissions.add('exam:view:all');
      permissions.add('exam:create');
      permissions.add('exam:edit');
      permissions.add('exam:delete');
      permissions.add('exam:publish');
      permissions.add('exam:open');
      permissions.add('exam:close');
      permissions.add('application:view');
      permissions.add('application:view:all');
      permissions.add('application:update');
      permissions.add('application:delete');
      permissions.add('review:view');
      permissions.add('review:view:all');
      permissions.add('review:perform');
      permissions.add('review:primary');
      permissions.add('review:secondary');
      permissions.add('ticket:view');
      permissions.add('ticket:view:all');
      permissions.add('ticket:generate');
      permissions.add('ticket:batch-generate');
      permissions.add('seating:view');
      permissions.add('seating:view:all');
      permissions.add('seating:create');
      permissions.add('seating:edit');
      permissions.add('seating:delete');
      permissions.add('seating:allocate');
      permissions.add('file:view');
      permissions.add('file:view:all');
      permissions.add('file:delete');
      permissions.add('position:view');
      permissions.add('position:create');
      permissions.add('position:edit');
      permissions.add('position:delete');
    }

    if (roles.includes('TENANT_ADMIN')) {
      permissions.add('exam:create');
      permissions.add('exam:view');
      permissions.add('exam:view:all');
      permissions.add('exam:edit');
      permissions.add('exam:delete');
      permissions.add('exam:publish');
      permissions.add('exam:open');
      permissions.add('exam:close');
      permissions.add('position:create');
      permissions.add('position:view');
      permissions.add('position:view:all');
      permissions.add('position:edit');
      permissions.add('position:delete');
      permissions.add('application:view');
      permissions.add('application:view:all');
      permissions.add('application:update');
      permissions.add('application:export');
      permissions.add('review:view');
      permissions.add('review:view:all');
      permissions.add('review:assign');
      permissions.add('ticket:view');
      permissions.add('ticket:view:all');
      permissions.add('ticket:generate');
      permissions.add('ticket:batch-generate');
      permissions.add('seating:view');
      permissions.add('seating:view:all');
      permissions.add('seating:create');
      permissions.add('seating:allocate');
      permissions.add('file:view');
      permissions.add('file:view:all');
      permissions.add('file:delete');
      permissions.add('statistics:tenant:view');
      permissions.add('user:view');
      permissions.add('user:create');
    }

    if (roles.includes('PRIMARY_REVIEWER')) {
      permissions.add('review:primary');
      permissions.add('review:view');
      permissions.add('review:view:assigned');
      permissions.add('review:perform');
      permissions.add('application:view:assigned');
    }

    if (roles.includes('SECONDARY_REVIEWER')) {
      permissions.add('review:secondary');
      permissions.add('review:view');
      permissions.add('review:view:assigned');
      permissions.add('review:perform');
      permissions.add('application:view:assigned');
    }

    return Array.from(permissions);
  }

  async selectTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const globalRoles = JSON.parse(user.roles) as string[];
    const isSuperAdmin = globalRoles.includes('SUPER_ADMIN');

    const tenantRole = await this.prisma.userTenantRole.findFirst({
      where: {
        userId,
        tenantId,
        active: true,
      },
      include: { tenant: true },
    });

    if (!isSuperAdmin && !tenantRole) {
      throw new UnauthorizedException('No access to this tenant');
    }

    const allTenantRoles = await this.prisma.userTenantRole.findMany({
      where: { userId: user.id, active: true },
      include: { tenant: true },
    });

    const currentRoles = Array.from(
      new Set([
        ...globalRoles,
        ...(tenantRole ? [tenantRole.role] : []),
      ]),
    );

    const permissions = this.getPermissionsForRoles(currentRoles);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      tenantId: tenantId,
      roles: currentRoles,
      permissions: permissions,
      status: user.status,
    };

    return {
      token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        roles: currentRoles,
        globalRoles: globalRoles,
        tenantRoles: allTenantRoles.map((tr) => ({
          tenantId: tr.tenantId,
          tenantName: tr.tenant.name,
          tenantCode: tr.tenant.code,
          role: tr.role,
          active: tr.active,
        })),
        permissions: permissions,
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const tenantRoles = await this.prisma.userTenantRole.findMany({
      where: { userId: user.id, active: true },
      include: { tenant: true },
    });

    const globalRoles = JSON.parse(user.roles) as string[];
    const mergedRoles = Array.from(
      new Set([
        ...globalRoles,
        ...tenantRoles.map((tr) => tr.role),
      ]),
    );

    const permissions = this.getPermissionsForRoles(mergedRoles);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: mergedRoles,
      globalRoles: globalRoles,
      tenantRoles: tenantRoles.map((tr) => ({
        tenantId: tr.tenantId,
        tenantName: tr.tenant.name,
        tenantCode: tr.tenant.code,
        role: tr.role,
        active: tr.active,
      })),
      permissions: permissions,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const tenantRoles = await this.prisma.userTenantRole.findMany({
      where: { userId: user.id, active: true },
      include: { tenant: true },
    });

    const globalRoles = JSON.parse(user.roles) as string[];
    const mergedRoles = Array.from(
      new Set([
        ...globalRoles,
        ...tenantRoles.map((tr) => tr.role),
      ]),
    );

    const permissions = this.getPermissionsForRoles(mergedRoles);

    const currentTenantId = tenantRoles.length > 0 ? tenantRoles[0].tenantId : null;

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: mergedRoles,
      tenantId: currentTenantId,
      permissions: permissions,
    };

    return {
      token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        roles: mergedRoles,
        globalRoles: globalRoles,
        tenantRoles: tenantRoles.map((tr) => ({
          tenantId: tr.tenantId,
          tenantName: tr.tenant.name,
          tenantCode: tr.tenant.code,
          role: tr.role,
          active: tr.active,
        })),
        permissions: permissions,
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }
}
