import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUser: User = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  passwordHash: 'hashed-password',
  status: 'ACTIVE',
  roles: JSON.stringify(['CANDIDATE']),
  emailVerified: true,
  phoneVerified: false,
  department: null,
  jobTitle: null,
  phoneNumber: null,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
  version: BigInt(0),
};

const mockTenantRole = {
  id: 'utr-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'TENANT_ADMIN',
  active: true,
  tenant: { name: 'Test Tenant', code: 'test-tenant' },
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  userTenantRole: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

type JwtSignPayload = { tenantId?: string | null; roles?: string[] };

function getJwtSignPayload(callIndex: number): JwtSignPayload {
  const calls = mockJwtService.sign.mock.calls as unknown[][];
  const row = calls[callIndex];
  return (row?.[0] as JwtSignPayload | undefined) ?? {};
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password123');
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token and user data for user without tenant roles', async () => {
      mockPrisma.userTenantRole.findMany.mockResolvedValue([]);

      const result = await service.login(mockUser);

      expect(result.token).toBe('mock-jwt-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(86400);
      expect(result.user.id).toBe('user-1');
      expect(result.user.roles).toEqual(['CANDIDATE']);
      expect(result.user.permissions).toContain('application:view:own');
      expect(result.tenantRoles).toEqual([]);
    });

    it('should merge global roles with tenant role when tenant roles exist', async () => {
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      const result = await service.login(mockUser);

      expect(result.user.roles).toEqual(
        expect.arrayContaining(['CANDIDATE', 'TENANT_ADMIN']),
      );
      expect(result.user.permissions).toContain('exam:create');
      expect(result.tenantRoles).toHaveLength(1);
      expect(result.tenantRoles[0]).toEqual({
        tenantId: 'tenant-1',
        tenantName: 'Test Tenant',
        tenantCode: 'test-tenant',
        role: 'TENANT_ADMIN',
        active: true,
      });
    });

    it('should include tenantId in JWT payload when tenant roles exist', async () => {
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      await service.login(mockUser);

      expect(getJwtSignPayload(0).tenantId).toBe('tenant-1');
    });

    it('should set tenantId to null when no tenant roles', async () => {
      mockPrisma.userTenantRole.findMany.mockResolvedValue([]);

      await service.login(mockUser);

      expect(getJwtSignPayload(0).tenantId).toBeNull();
    });
  });

  describe('selectTenant', () => {
    it('should throw BadRequestException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.selectTenant('nonexistent-id', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow SUPER_ADMIN to select any tenant', async () => {
      const superAdminUser: User = {
        ...mockUser,
        roles: JSON.stringify(['SUPER_ADMIN']),
      };
      mockPrisma.user.findUnique.mockResolvedValue(superAdminUser);
      mockPrisma.userTenantRole.findFirst.mockResolvedValue(null);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([]);

      const result = await service.selectTenant('user-1', 'tenant-1');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('should throw UnauthorizedException when non-SUPER_ADMIN has no access to tenant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findFirst.mockResolvedValue(null);

      await expect(
        service.selectTenant('user-1', 'unauthorized-tenant'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return merged roles when user has tenant role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findFirst.mockResolvedValue(mockTenantRole);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      const result = await service.selectTenant('user-1', 'tenant-1');

      expect(result.user.roles).toEqual(
        expect.arrayContaining(['CANDIDATE', 'TENANT_ADMIN']),
      );
      expect(result.user.permissions).toContain('exam:create');
    });
  });

  describe('getMe', () => {
    it('should throw BadRequestException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('nonexistent-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return user response with merged roles', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      const result = await service.getMe('user-1');

      expect(result.id).toBe('user-1');
      expect(result.roles).toEqual(
        expect.arrayContaining(['CANDIDATE', 'TENANT_ADMIN']),
      );
      expect(result.permissions).toContain('exam:create');
      expect(result.tenantRoles).toHaveLength(1);
    });

    it('should return user response with global roles only when no tenant roles', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([]);

      const result = await service.getMe('user-1');

      expect(result.roles).toEqual(['CANDIDATE']);
      expect(result.permissions).toContain('application:view:own');
    });
  });

  describe('refreshToken', () => {
    it('should throw BadRequestException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('nonexistent-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return new token and user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      const result = await service.refreshToken('user-1', 'tenant-1');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(86400);
      expect(result.user.id).toBe('user-1');
    });

    it('should preserve tenant session and roles when sessionTenantId matches', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      await service.refreshToken('user-1', 'tenant-1');

      expect(getJwtSignPayload(0).tenantId).toBe('tenant-1');
      expect(getJwtSignPayload(0).roles).toEqual(
        expect.arrayContaining(['CANDIDATE', 'TENANT_ADMIN']),
      );
    });

    it('should use platform-only roles when session tenant is omitted (no cross-tenant merge)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      await service.refreshToken('user-1', undefined);

      expect(getJwtSignPayload(0).tenantId).toBeNull();
      expect(getJwtSignPayload(0).roles).toEqual(['CANDIDATE']);
    });

    it('should set tenantId to null in JWT payload when no tenant roles and no session', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([]);

      await service.refreshToken('user-1', undefined);

      expect(getJwtSignPayload(0).tenantId).toBeNull();
    });

    it('should throw when session tenant is not accessible', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([mockTenantRole]);

      await expect(
        service.refreshToken('user-1', 'other-tenant'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('buildUserResponse', () => {
    it('should construct UserResponse with correct fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTenantRole.findMany.mockResolvedValue([]);

      const result = await service.getMe('user-1');

      expect(result).toMatchObject({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        status: 'ACTIVE',
        globalRoles: ['CANDIDATE'],
        tenantRoles: [],
        emailVerified: true,
        phoneVerified: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      });
      expect(Array.isArray(result.roles)).toBe(true);
      expect(Array.isArray(result.permissions)).toBe(true);
    });
  });
});
