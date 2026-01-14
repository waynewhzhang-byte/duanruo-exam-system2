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
    // Check for tenant roles
    const tenantRoles = await this.prisma.userTenantRole.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      include: { tenant: true },
    });

    let roles = JSON.parse(user.roles) as string[];
    let tenantId: string | null = null;

    if (tenantRoles.length > 0) {
      const primaryTenantRole = tenantRoles[0];
      tenantId = primaryTenantRole.tenantId;
      roles = Array.from(new Set([...roles, primaryTenantRole.role]));
    }

    const permissions = this.getPermissionsForRoles(roles);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: roles,
      tenantId: tenantId,
      permissions: permissions,
    };

    const resultUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: roles,
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
    };
  }

  private getPermissionsForRoles(roles: string[]): string[] {
    const permissions = new Set<string>();

    // Basic permissions
    permissions.add('application:view:own');
    permissions.add('application:create');
    permissions.add('file:upload');
    permissions.add('file:view:own');
    permissions.add('ticket:view:own');
    permissions.add('payment:initiate');

    if (roles.includes('SUPER_ADMIN')) {
      permissions.add('tenant:view:all');
      permissions.add('tenant:create');
      permissions.add('user:manage');
      permissions.add('statistics:system:view');
    }

    if (roles.includes('TENANT_ADMIN')) {
      permissions.add('exam:create');
      permissions.add('exam:view');
      permissions.add('exam:edit');
      permissions.add('exam:delete');
      permissions.add('exam:publish');
      permissions.add('exam:open');
      permissions.add('exam:close');
      permissions.add('position:create');
      permissions.add('position:view');
      permissions.add('position:delete');
      permissions.add('statistics:tenant:view');
    }

    if (roles.includes('PRIMARY_REVIEWER')) {
      permissions.add('review:primary');
      permissions.add('review:view');
      permissions.add('review:perform');
    }

    if (roles.includes('SECONDARY_REVIEWER')) {
      permissions.add('review:secondary');
      permissions.add('review:view');
      permissions.add('review:perform');
    }

    return Array.from(permissions);
  }

  async selectTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isSuperAdmin = (JSON.parse(user.roles) as string[]).includes(
      'SUPER_ADMIN',
    );

    // Check access
    const tenantRole = await this.prisma.userTenantRole.findFirst({
      where: {
        userId,
        tenantId,
        active: true,
      },
    });

    if (!isSuperAdmin && !tenantRole) {
      throw new UnauthorizedException('No access to this tenant');
    }

    const roles = Array.from(
      new Set([
        ...(JSON.parse(user.roles) as string[]),
        ...(tenantRole ? [tenantRole.role] : []),
      ]),
    );

    const permissions = this.getPermissionsForRoles(roles);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      tenantId: tenantId,
      roles: roles,
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
        roles: roles,
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
    });

    const roles = Array.from(
      new Set([
        ...(JSON.parse(user.roles) as string[]),
        ...tenantRoles.map((tr) => tr.role),
      ]),
    );

    const permissions = this.getPermissionsForRoles(roles);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: roles,
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
    });

    const roles = Array.from(
      new Set([
        ...(JSON.parse(user.roles) as string[]),
        ...tenantRoles.map((tr) => tr.role),
      ]),
    );

    const permissions = this.getPermissionsForRoles(roles);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: roles,
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
        roles: roles,
        permissions: permissions,
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }
}
