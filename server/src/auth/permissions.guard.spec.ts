import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

type MockHttpContext = {
  getHandler: jest.Mock;
  getClass: jest.Mock;
  switchToHttp: () => { getRequest: () => Record<string, unknown> };
};

function asExecutionContext(ctx: MockHttpContext): ExecutionContext {
  return ctx as unknown as ExecutionContext;
}

function makeContext(
  reflector: Reflector,
  permissions: string[] | undefined,
  userPerms: string[],
) {
  if (permissions !== undefined) {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);
  }

  const req = {
    user: {
      userId: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      roles: [],
      permissions: userPerms,
    },
  };

  const ctx: MockHttpContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  };
  return ctx;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  describe('canActivate — no permissions required', () => {
    it('should allow access when no permissions are required', () => {
      const ctx = makeContext(reflector, [], []);
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should allow access when undefined permissions required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx: MockHttpContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => ({}) }),
      };
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });
  });

  describe('canActivate — permission enforcement', () => {
    it('should throw ForbiddenException when user has no user object', () => {
      const ctx: MockHttpContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => ({}) }),
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['exam:view']);

      expect(() => guard.canActivate(asExecutionContext(ctx))).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user lacks required permission', () => {
      const ctx = makeContext(reflector, ['exam:delete'], ['exam:view']);
      expect(() => guard.canActivate(asExecutionContext(ctx))).toThrow(
        ForbiddenException,
      );
      try {
        guard.canActivate(asExecutionContext(ctx));
      } catch (e) {
        expect((e as ForbiddenException).message).toContain('exam:delete');
      }
    });

    it('should allow access when user has exact required permission', () => {
      const ctx = makeContext(reflector, ['exam:view'], ['exam:view']);
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should require ALL permissions when multiple are required', () => {
      const ctx = makeContext(
        reflector,
        ['exam:view', 'exam:create'],
        ['exam:view', 'exam:create'],
      );
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should deny access when missing one of multiple required permissions', () => {
      const ctx = makeContext(
        reflector,
        ['exam:view', 'exam:create'],
        ['exam:view'],
      );
      expect(() => guard.canActivate(asExecutionContext(ctx))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('hasPermission — wildcard matching', () => {
    it('should match global wildcard *', () => {
      const ctx = makeContext(reflector, ['exam:view'], ['*']);
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should match resource-level wildcard (exam:*)', () => {
      const ctx = makeContext(reflector, ['exam:view'], ['exam:*']);
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should match resource-level wildcard for any action', () => {
      const ctx = makeContext(reflector, ['exam:delete'], ['exam:*']);
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should not match resource-level wildcard for different resource', () => {
      const ctx = makeContext(reflector, ['user:delete'], ['exam:*']);
      expect(() => guard.canActivate(asExecutionContext(ctx))).toThrow(
        ForbiddenException,
      );
    });

    it('should match action-level wildcard (exam:view:*)', () => {
      const ctx = makeContext(reflector, ['exam:view:public'], ['exam:view:*']);
      expect(guard.canActivate(asExecutionContext(ctx))).toBe(true);
    });

    it('should not match when user permission has more segments than required', () => {
      const ctx = makeContext(reflector, ['exam:view'], ['exam:view:public']);
      expect(() => guard.canActivate(asExecutionContext(ctx))).toThrow(
        ForbiddenException,
      );
    });
  });
});
