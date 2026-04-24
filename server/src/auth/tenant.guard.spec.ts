import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { PERMISSIONS_ANY_KEY } from './permissions-any.decorator';
import { PERMISSIONS_KEY } from './permissions.decorator';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows global candidate self-service requests without tenant session', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) return ['application:create'];
      if (key === PERMISSIONS_ANY_KEY) return undefined;
      return undefined;
    });
    const guard = new TenantGuard(reflector as unknown as Reflector);

    const allowed = guard.canActivate(
      createContext({
        user: {
          userId: 'candidate-1',
          roles: ['CANDIDATE'],
          permissions: ['application:create'],
        },
        headers: {
          'x-tenant-id': 'tenant-1',
        },
      }),
    );

    expect(allowed).toBe(true);
  });

  it('rejects non-candidate requests with tenant header and no tenant session', () => {
    reflector.getAllAndOverride.mockReturnValue(['exam:view']);
    const guard = new TenantGuard(reflector as unknown as Reflector);

    expect(() =>
      guard.canActivate(
        createContext({
          user: {
            userId: 'admin-1',
            roles: ['TENANT_ADMIN'],
            permissions: ['exam:view'],
          },
          headers: {
            'x-tenant-id': 'tenant-1',
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects tenant mismatch for non-candidate self-service routes', () => {
    reflector.getAllAndOverride.mockReturnValue(['exam:view']);
    const guard = new TenantGuard(reflector as unknown as Reflector);

    expect(() =>
      guard.canActivate(
        createContext({
          user: {
            userId: 'admin-1',
            tenantId: 'tenant-1',
            roles: ['TENANT_ADMIN'],
            permissions: ['exam:view'],
          },
          headers: {
            'x-tenant-id': 'tenant-2',
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
