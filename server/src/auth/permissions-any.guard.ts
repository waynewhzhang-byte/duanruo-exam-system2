import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_ANY_KEY } from './permissions-any.decorator';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { permissionMatches } from './permission-match';

@Injectable()
export class PermissionsAnyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAny = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_ANY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAny || requiredAny.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user || !user.permissions) {
      throw new ForbiddenException('User permissions not found');
    }

    const hasOne = requiredAny.some((requiredPerm) =>
      user.permissions.some((userPerm) =>
        permissionMatches(userPerm, requiredPerm),
      ),
    );

    if (!hasOne) {
      throw new ForbiddenException(
        `Missing one of required permissions: ${requiredAny.join(', ')}`,
      );
    }

    return true;
  }
}
