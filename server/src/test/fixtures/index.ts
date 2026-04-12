import {
  User,
  Tenant,
  Exam,
  Application,
  Position,
  Prisma,
} from '@prisma/client';

export const testUsers = {
  superAdmin: {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'superadmin',
    email: 'superadmin@example.com',
    passwordHash: '$2b$10$test',
    fullName: 'Super Admin',
    roles: '["SUPER_ADMIN"]',
    status: 'ACTIVE',
  } as User,

  tenantAdmin: {
    id: '00000000-0000-0000-0000-000000000020',
    username: 'admin',
    email: 'admin@demo.edu.cn',
    passwordHash: '$2b$10$test',
    fullName: 'Demo Admin',
    roles: '[]',
    status: 'ACTIVE',
  } as User,

  reviewer1: {
    id: '00000000-0000-0000-0000-000000000030',
    username: 'reviewer1',
    email: 'reviewer1@demo.edu.cn',
    passwordHash: '$2b$10$test',
    fullName: 'Primary Reviewer',
    roles: '[]',
    status: 'ACTIVE',
  } as User,

  candidate1: {
    id: '00000000-0000-0000-0000-000000000040',
    username: 'candidate1',
    email: 'candidate1@example.com',
    passwordHash: '$2b$10$test',
    fullName: 'Test Candidate',
    roles: '["CANDIDATE"]',
    status: 'ACTIVE',
  } as User,
};

export const testTenants = {
  demo: {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Demo University',
    code: 'demo',
    schemaName: 'tenant_demo',
    status: 'ACTIVE',
    contactEmail: 'hr@demo.edu.cn',
  } as Tenant,
};

export const testExams = {
  exam1: {
    id: '00000000-0000-0000-0000-000000000100',
    code: 'EXAM2026',
    title: '2026年度招聘考试',
    description: '技术岗位招聘',
    status: 'DRAFT',
    feeRequired: false,
  } as unknown as Exam,

  exam2: {
    id: '00000000-0000-0000-0000-000000000101',
    code: 'EXAM2026-PAID',
    title: '2026年度付费考试',
    description: '付费考试',
    status: 'REGISTRATION_OPEN',
    feeRequired: true,
    feeAmount: new Prisma.Decimal(100),
    createdAt: new Date(),
    updatedAt: new Date(),
    announcement: null,
    registrationStart: null,
    registrationEnd: null,
    examStart: null,
    examEnd: null,
    createdBy: null,
    ticketTemplate: null,
    formTemplate: null,
    formTemplateId: null,
  } as unknown as Exam,
};

export const testPositions = {
  position1: {
    id: '00000000-0000-0000-0000-000000000200',
    examId: testExams.exam1.id,
    code: 'DEV',
    title: '开发工程师',
    quota: 10,
  } as Position,
};

export const testApplications = {
  app1: {
    id: '00000000-0000-0000-0000-000000000300',
    candidateId: testUsers.candidate1.id,
    examId: testExams.exam1.id,
    positionId: testPositions.position1.id,
    status: 'DRAFT',
    payload: { name: 'Test', education: '本科' },
    createdAt: new Date(),
    updatedAt: new Date(),
    formVersion: 1,
    submittedAt: null,
    totalWrittenScore: null,
    writtenPassScore: null,
    writtenPassStatus: null,
    interviewEligibility: null,
    finalResult: null,
    interviewTime: null,
    interviewLocation: null,
    interviewRoom: null,
  } as unknown as Application,
};

export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userTenantRole: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};
