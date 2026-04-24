import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PERMISSIONS_ANY_KEY } from './permissions-any.decorator';

const CANDIDATE_SELF_SERVICE_PERMISSIONS = new Set([
  'application:view:own',
  'application:create',
  'ticket:view:own',
  'payment:initiate',
  'payment:view:own',
  'file:upload',
  'file:view',
  'profile:view:own',
  'profile:create',
  'profile:update',
  'profile:delete',
]);

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const headerTenantId = request.headers['x-tenant-id'] as string;

    if (!user) {
      return true; // Let JwtAuthGuard handle this
    }

    // Super Admins can access any tenant
    if (user.roles && user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredAnyPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_ANY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const hasCandidateOnlyPermissions =
      requiredPermissions?.every((permission) =>
        CANDIDATE_SELF_SERVICE_PERMISSIONS.has(permission),
      ) ?? false;
    const hasCandidateAnyPermission =
      requiredAnyPermissions?.some((permission) =>
        CANDIDATE_SELF_SERVICE_PERMISSIONS.has(permission),
      ) ?? false;

    const isCandidateSelfService =
      Array.isArray(user.roles) &&
      user.roles.includes('CANDIDATE') &&
      (hasCandidateOnlyPermissions || hasCandidateAnyPermission);

    if (isCandidateSelfService) {
      return true;
    }

    // For other users, if they are accessing a tenant-specific resource,
    // the header tenant ID must match the JWT tenant ID.
    if (headerTenantId && user.tenantId && headerTenantId !== user.tenantId) {
      throw new ForbiddenException(
        'Tenant mismatch: You do not have access to this tenant',
      );
    }

    // If no tenant ID in JWT, but trying to access a tenant
    if (headerTenantId && !user.tenantId) {
      // This might happen if user just logged in globally but hasn't selected a tenant
      throw new ForbiddenException('No tenant selected in session');
    }

    return true;
  }
}
