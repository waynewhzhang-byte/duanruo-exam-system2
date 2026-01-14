import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@Injectable()
export class TenantGuard implements CanActivate {
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
