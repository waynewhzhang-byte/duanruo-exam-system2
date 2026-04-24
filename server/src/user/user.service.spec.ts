import { UserService } from './user.service';
import type { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: {
    user: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new UserService(prismaMock as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw conflict exception when phone number already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      username: 'another_user',
      email: 'another@example.com',
      phoneNumber: '13800138000',
    });

    await expect(
      service.createUser({
        username: 'tenant_admin_1',
        email: 'tenant-admin@example.com',
        password: 'password123',
        fullName: '租户管理员',
        phoneNumber: '13800138000',
        tenantId: 'tenant-1',
        tenantRole: 'TENANT_ADMIN',
      }),
    ).rejects.toThrow(new ConflictException('手机号已存在'));
  });

  it('should map prisma unique constraint error to conflict exception', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.$transaction.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['phone_number'] },
    });

    await expect(
      service.createUser({
        username: 'tenant_admin_2',
        email: 'tenant-admin-2@example.com',
        password: 'password123',
        fullName: '租户管理员2',
        phoneNumber: '13900139000',
        tenantId: 'tenant-1',
        tenantRole: 'TENANT_ADMIN',
      }),
    ).rejects.toThrow(new ConflictException('手机号已存在'));
  });
});
