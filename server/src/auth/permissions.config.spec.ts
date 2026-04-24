import {
  getPermissionsForRoles,
  ROLE_PERMISSIONS,
  BASE_PERMISSIONS,
} from './permissions.config';

describe('permissions.config', () => {
  describe('getPermissionsForRoles', () => {
    it('should return BASE_PERMISSIONS for empty roles', () => {
      const permissions = getPermissionsForRoles([]);
      for (const perm of BASE_PERMISSIONS) {
        expect(permissions).toContain(perm);
      }
    });

    it('should return BASE_PERMISSIONS for unknown role', () => {
      const permissions = getPermissionsForRoles(['NONEXISTENT_ROLE']);
      for (const perm of BASE_PERMISSIONS) {
        expect(permissions).toContain(perm);
      }
    });

    it('should include CANDIDATE permissions', () => {
      const permissions = getPermissionsForRoles(['CANDIDATE']);
      expect(permissions).toContain('exam:view:public');
      expect(permissions).toContain('profile:view:own');
      expect(permissions).toContain('application:view:own');
      for (const perm of BASE_PERMISSIONS) {
        expect(permissions).toContain(perm);
      }
    });

    it('should include SUPER_ADMIN permissions with full access', () => {
      const permissions = getPermissionsForRoles(['SUPER_ADMIN']);
      expect(permissions).toContain('tenant:view:all');
      expect(permissions).toContain('tenant:create');
      expect(permissions).toContain('user:manage');
      expect(permissions).toContain('exam:create');
      expect(permissions).toContain('exam:delete');
      expect(permissions).toContain('review:primary');
      expect(permissions).toContain('ticket:batch-generate');
      expect(permissions).toContain('seating:allocate');
      for (const perm of BASE_PERMISSIONS) {
        expect(permissions).toContain(perm);
      }
    });

    it('should merge permissions from multiple roles', () => {
      const permissions = getPermissionsForRoles([
        'CANDIDATE',
        'PRIMARY_REVIEWER',
      ]);
      expect(permissions).toContain('exam:view:public');
      expect(permissions).toContain('review:primary');
      expect(permissions).toContain('review:perform');
      for (const perm of BASE_PERMISSIONS) {
        expect(permissions).toContain(perm);
      }
    });

    it('should deduplicate permissions from overlapping roles', () => {
      const singleRole = getPermissionsForRoles(['SUPER_ADMIN']);
      const withOverlap = getPermissionsForRoles([
        'SUPER_ADMIN',
        'TENANT_ADMIN',
      ]);

      const uniqueInOverlap = new Set(withOverlap);
      expect(uniqueInOverlap.size).toBe(withOverlap.length);

      for (const perm of singleRole) {
        expect(withOverlap).toContain(perm);
      }
    });

    it('should handle TENANT_ADMIN permissions', () => {
      const permissions = getPermissionsForRoles(['TENANT_ADMIN']);
      expect(permissions).toContain('exam:create');
      expect(permissions).toContain('application:export');
      expect(permissions).toContain('review:assign');
      expect(permissions).toContain('statistics:tenant:view');
    });

    it('should handle ADMIN permissions', () => {
      const permissions = getPermissionsForRoles(['ADMIN']);
      expect(permissions).toContain('exam:create');
      expect(permissions).toContain('application:export');
      expect(permissions).toContain('statistics:tenant:view');
    });

    it('should handle PRIMARY_REVIEWER permissions', () => {
      const permissions = getPermissionsForRoles(['PRIMARY_REVIEWER']);
      expect(permissions).toContain('review:primary');
      expect(permissions).toContain('review:perform');
      expect(permissions).toContain('application:view:assigned');
      expect(permissions).toContain('exam:view');
      expect(permissions).toContain('file:view');
    });

    it('should handle SECONDARY_REVIEWER permissions', () => {
      const permissions = getPermissionsForRoles(['SECONDARY_REVIEWER']);
      expect(permissions).toContain('review:secondary');
      expect(permissions).toContain('review:perform');
      expect(permissions).toContain('application:view:assigned');
      expect(permissions).toContain('exam:view');
      expect(permissions).toContain('file:view');
    });
  });

  describe('ROLE_PERMISSIONS structure', () => {
    it('should have all expected roles defined', () => {
      const expectedRoles: string[] = [
        'CANDIDATE',
        'SUPER_ADMIN',
        'TENANT_ADMIN',
        'ADMIN',
        'PRIMARY_REVIEWER',
        'SECONDARY_REVIEWER',
      ];
      for (const role of expectedRoles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });

    it('should not have duplicate permissions within any role', () => {
      for (const [_role, perms] of Object.entries(ROLE_PERMISSIONS)) {
        const unique = new Set(perms);
        expect(unique.size).toBe(perms.length);
      }
    });

    it('should use colon-separated permission format', () => {
      for (const perms of Object.values(ROLE_PERMISSIONS)) {
        for (const perm of perms) {
          const parts = perm.split(':');
          expect(parts.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });
});
