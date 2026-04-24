import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ExamService } from './exam.service';

function buildExam(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exam-1',
    code: 'EXAM-001',
    title: '公开考试',
    description: '说明',
    announcement: '<p>公告</p>',
    registrationStart: new Date('2026-04-01T00:00:00.000Z'),
    registrationEnd: new Date('2026-05-01T00:00:00.000Z'),
    examStart: new Date('2026-05-10T00:00:00.000Z'),
    examEnd: new Date('2026-05-10T02:00:00.000Z'),
    feeRequired: false,
    feeAmount: null,
    ticketTemplate: null,
    formTemplate: null,
    formTemplateId: null,
    status: 'OPEN',
    createdBy: 'user-1',
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ExamService', () => {
  let service: ExamService;

  const mockPrisma = {
    publicClient: {
      tenant: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
    client: {
      exam: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      position: {
        findMany: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExamService(
      mockPrisma as unknown as PrismaService,
      {} as unknown as UserService,
    );
  });

  it('aggregates OPEN public exams across active tenants', async () => {
    mockPrisma.publicClient.tenant.findMany.mockResolvedValue([
      {
        id: 'tenant-a',
        name: 'Tenant A',
        code: 'tenant-a',
        schemaName: 'tenant_a',
        status: 'ACTIVE',
      },
      {
        id: 'tenant-b',
        name: 'Tenant B',
        code: 'tenant-b',
        schemaName: 'tenant_b',
        status: 'ACTIVE',
      },
    ]);
    mockPrisma.client.exam.findMany.mockImplementation(() => {
      const schema = PrismaService.getTenantSchema();
      if (schema === 'tenant_a') {
        return [
          {
            ...buildExam({ id: 'exam-a', code: 'ALPHA-001', title: 'Alpha' }),
            _count: { positions: 2 },
          },
        ];
      }
      if (schema === 'tenant_b') {
        return [
          {
            ...buildExam({
              id: 'exam-b',
              code: 'BETA-001',
              title: 'Beta',
              updatedAt: new Date('2026-04-21T00:00:00.000Z'),
            }),
            _count: { positions: 1 },
          },
        ];
      }
      return [];
    });

    const result = await service.findOpenPublicExams();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      examId: 'exam-b',
      tenantCode: 'tenant-b',
      code: 'BETA-001',
      positionCount: 1,
    });
    expect(result[1]).toMatchObject({
      examId: 'exam-a',
      tenantCode: 'tenant-a',
      code: 'ALPHA-001',
      positionCount: 2,
    });
  });

  it('resolves a public exam by tenant code and exam code', async () => {
    mockPrisma.publicClient.tenant.findFirst.mockResolvedValue({
      id: 'tenant-a',
      name: 'Tenant A',
      code: 'tenant-a',
      schemaName: 'tenant_a',
      status: 'ACTIVE',
    });
    mockPrisma.client.exam.findUnique.mockResolvedValue({
      ...buildExam({ id: 'exam-a', code: 'ALPHA-001', title: 'Alpha' }),
      _count: { positions: 3 },
    });

    const result = await service.findPublicExamByTenantAndCode(
      'tenant-a',
      'ALPHA-001',
    );

    expect(result).toMatchObject({
      examId: 'exam-a',
      tenantId: 'tenant-a',
      tenantCode: 'tenant-a',
      code: 'ALPHA-001',
      positionCount: 3,
    });
    expect(mockPrisma.client.exam.findUnique).toHaveBeenCalledWith({
      where: { code: 'ALPHA-001' },
      include: { _count: { select: { positions: true } } },
    });
  });

  it('returns public positions for a tenant exam code', async () => {
    mockPrisma.publicClient.tenant.findFirst.mockResolvedValue({
      id: 'tenant-a',
      name: 'Tenant A',
      code: 'tenant-a',
      schemaName: 'tenant_a',
      status: 'ACTIVE',
    });
    mockPrisma.client.exam.findUnique.mockResolvedValueOnce({
      id: 'exam-a',
      status: 'OPEN',
    });
    mockPrisma.client.position.findMany.mockResolvedValue([
      {
        id: 'position-1',
        examId: 'exam-a',
        code: 'POS-1',
        title: '岗位一',
        description: '描述',
        requirements: '要求',
        quota: 5,
        rulesConfig: null,
        createdAt: new Date('2026-04-20T00:00:00.000Z'),
        subjects: [],
      },
    ]);

    const result = await service.findPublicExamPositions(
      'tenant-a',
      'ALPHA-001',
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: 'position-1',
        examId: 'exam-a',
        title: '岗位一',
        quota: 5,
      }),
    ]);
  });

  it('throws when tenant is not active or missing', async () => {
    mockPrisma.publicClient.tenant.findFirst.mockResolvedValue(null);

    await expect(
      service.findPublicExamByTenantAndCode('missing', 'EXAM-001'),
    ).rejects.toThrow(NotFoundException);
  });
});
