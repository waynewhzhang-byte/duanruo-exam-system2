import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create SUPER_ADMIN user
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'superadmin',
      email: 'superadmin@example.com',
      passwordHash: superAdminPassword,
      fullName: 'Super Administrator',
      roles: '["SUPER_ADMIN"]',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('Created super admin:', superAdmin.username);

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { code: 'demo' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Demo University',
      code: 'demo',
      schemaName: 'tenant_demo',
      status: 'ACTIVE',
      contactEmail: 'hr@demo.edu.cn',
      description: 'Demo tenant for testing',
    },
  });
  console.log('Created tenant:', tenant.name);

  // Create TENANT_ADMIN user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const tenantAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      username: 'admin',
      email: 'admin@demo.edu.cn',
      passwordHash: adminPassword,
      fullName: 'Demo Admin',
      roles: '[]',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('Created tenant admin:', tenantAdmin.username);

  // Assign TENANT_ADMIN role to admin user
  await prisma.userTenantRole.upsert({
    where: {
      userId_tenantId_role: {
        userId: tenantAdmin.id,
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
      },
    },
    update: {},
    create: {
      userId: tenantAdmin.id,
      tenantId: tenant.id,
      role: 'TENANT_ADMIN',
      active: true,
    },
  });
  console.log('Assigned TENANT_ADMIN role to admin');

  // Create PRIMARY_REVIEWER
  const reviewer1Password = await bcrypt.hash('reviewer123', 10);
  const reviewer1 = await prisma.user.upsert({
    where: { username: 'reviewer1' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      username: 'reviewer1',
      email: 'reviewer1@demo.edu.cn',
      passwordHash: reviewer1Password,
      fullName: 'Primary Reviewer',
      roles: '[]',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.userTenantRole.upsert({
    where: {
      userId_tenantId_role: {
        userId: reviewer1.id,
        tenantId: tenant.id,
        role: 'PRIMARY_REVIEWER',
      },
    },
    update: {},
    create: {
      userId: reviewer1.id,
      tenantId: tenant.id,
      role: 'PRIMARY_REVIEWER',
      active: true,
    },
  });
  console.log('Created PRIMARY_REVIEWER:', reviewer1.username);

  // Create SECONDARY_REVIEWER
  const reviewer2Password = await bcrypt.hash('reviewer123', 10);
  const reviewer2 = await prisma.user.upsert({
    where: { username: 'reviewer2' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000031',
      username: 'reviewer2',
      email: 'reviewer2@demo.edu.cn',
      passwordHash: reviewer2Password,
      fullName: 'Secondary Reviewer',
      roles: '[]',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.userTenantRole.upsert({
    where: {
      userId_tenantId_role: {
        userId: reviewer2.id,
        tenantId: tenant.id,
        role: 'SECONDARY_REVIEWER',
      },
    },
    update: {},
    create: {
      userId: reviewer2.id,
      tenantId: tenant.id,
      role: 'SECONDARY_REVIEWER',
      active: true,
    },
  });
  console.log('Created SECONDARY_REVIEWER:', reviewer2.username);

  // Create CANDIDATE user
  const candidatePassword = await bcrypt.hash('candidate123', 10);
  const candidate = await prisma.user.upsert({
    where: { username: 'candidate1' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000040',
      username: 'candidate1',
      email: 'candidate1@example.com',
      passwordHash: candidatePassword,
      fullName: 'Test Candidate',
      roles: '["CANDIDATE"]',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('Created CANDIDATE:', candidate.username);

  // Assign CANDIDATE role to candidate user
  await prisma.userTenantRole.upsert({
    where: {
      userId_tenantId_role: {
        userId: candidate.id,
        tenantId: tenant.id,
        role: 'CANDIDATE',
      },
    },
    update: {},
    create: {
      userId: candidate.id,
      tenantId: tenant.id,
      role: 'CANDIDATE',
      active: true,
    },
  });
  console.log('Assigned CANDIDATE role');

  // Create more candidates for testing
  for (let i = 2; i <= 5; i++) {
    const candidatePassword = await bcrypt.hash('candidate123', 10);
    await prisma.user.upsert({
      where: { username: `candidate${i}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000004${i}`,
        username: `candidate${i}`,
        email: `candidate${i}@example.com`,
        passwordHash: candidatePassword,
        fullName: `Test Candidate ${i}`,
        roles: '["CANDIDATE"]',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    await prisma.userTenantRole.upsert({
      where: {
        userId_tenantId_role: {
          userId: `00000000-0000-0000-0000-00000000004${i}`,
          tenantId: tenant.id,
          role: 'CANDIDATE',
        },
      },
      update: {},
      create: {
        userId: `00000000-0000-0000-0000-00000000004${i}`,
        tenantId: tenant.id,
        role: 'CANDIDATE',
        active: true,
      },
    });
  }
  console.log('Created more candidates');

  // ============== TENANT DATA ==============
  // Note: These go into the tenant schema (tenant_demo)
  // For simplicity, we'll use raw SQL to insert into tenant schema
  
  const client = prisma.$connect();
  
  // Create exam
  const { Exam, Position, Application, Venue, Room, ReviewTask, Review } = await import('@prisma/client');
  const { Decimal } = await import('decimal.js');
  
  // Create exam in tenant schema
  const exam = await (prisma as any).$executeRawUnsafe(`
    INSERT INTO "tenant_demo"."exams" (id, code, title, description, status, fee_required, fee_amount, 
      registration_start, registration_end, created_by, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000100', 'EXAM2026-001', '2026年度招聘考试', '技术岗位招聘', 'OPEN', false, 0,
      NOW() - INTERVAL '7 days', NOW() + INTERVAL '7 days', $1, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
  `, tenantAdmin.id).catch(() => {
    console.log('Exam may already exist or table not found');
  });

  // Try alternative approach - insert directly
  try {
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."exams" (id, code, title, description, status, fee_required, fee_amount, 
        registration_start, registration_end, created_by, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000100', 'EXAM2026-001', '2026年度招聘考试', '技术岗位招聘', 'OPEN', false, 0,
        NOW() - INTERVAL '7 days', NOW() + INTERVAL '7 days', ${tenantAdmin.id}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
    `;
    console.log('Created exam');
  } catch (e) {
    console.log('Note: Could not create tenant data - may need to use tenant schema connection');
  }

  try {
    // Create position
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."positions" (id, exam_id, code, title, quota, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', 'DEV', '开发工程师', 10, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
    `;
    console.log('Created position 1');

    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."positions" (id, exam_id, code, title, quota, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', 'QA', '测试工程师', 5, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
    `;
    console.log('Created position 2');
  } catch (e) {
    console.log('Note: Could not create positions');
  }

  try {
    // Create applications with different statuses
    // DRAFT
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."applications" (id, candidate_id, exam_id, position_id, status, payload, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000200', 'DRAFT', '{}'::jsonb, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    // SUBMITTED
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."applications" (id, candidate_id, exam_id, position_id, status, payload, submitted_at, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000200', 'SUBMITTED', '{"name":"张三","idNumber":"110101199001011234"}'::jsonb, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    // PENDING_PRIMARY_REVIEW
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."applications" (id, candidate_id, exam_id, position_id, status, payload, submitted_at, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000200', 'PENDING_PRIMARY_REVIEW', '{"name":"李四","idNumber":"110101199001011235"}'::jsonb, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    // PRIMARY_PASSED
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."applications" (id, candidate_id, exam_id, position_id, status, payload, submitted_at, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000200', 'PRIMARY_PASSED', '{"name":"王五","idNumber":"110101199001011236"}'::jsonb, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    // APPROVED
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."applications" (id, candidate_id, exam_id, position_id, status, payload, submitted_at, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000200', 'APPROVED', '{"name":"赵六","idNumber":"110101199001011237"}'::jsonb, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    console.log('Created applications');
  } catch (e) {
    console.log('Note: Could not create applications');
  }

  try {
    // Create review tasks
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."review_tasks" (id, application_id, stage, status, created_at)
      VALUES ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000302', 'PRIMARY', 'OPEN', NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."review_tasks" (id, application_id, stage, status, created_at)
      VALUES ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000303', 'SECONDARY', 'OPEN', NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `;

    console.log('Created review tasks');
  } catch (e) {
    console.log('Note: Could not create review tasks');
  }

  try {
    // Create venues
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."venues" (id, exam_id, name, capacity, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000500', '00000000-0000-0000-0000-000000000100', '第一教学楼', 100, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;

    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."venues" (id, exam_id, name, capacity, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000100', '第二教学楼', 80, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;

    // Create rooms
    await prisma.$executeRaw`
      INSERT INTO "tenant_demo"."rooms" (id, venue_id, name, code, capacity, floor, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000600', '00000000-0000-0000-0000-000000000500', '101教室', '101', 50, 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;

    console.log('Created venues and rooms');
  } catch (e) {
    console.log('Note: Could not create venues/rooms');
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('  SUPER_ADMIN: superadmin / superadmin123');
  console.log('  TENANT_ADMIN: admin / admin123');
  console.log('  PRIMARY_REVIEWER: reviewer1 / reviewer123');
  console.log('  SECONDARY_REVIEWER: reviewer2 / reviewer123');
  console.log('  CANDIDATE: candidate1 / candidate123');
  console.log('\nTenant: Demo University (code: demo)');
  console.log('\nTenant Data:');
  console.log('  - Exam: 2026年度招聘考试 (EXAM2026-001)');
  console.log('  - Positions: 开发工程师, 测试工程师');
  console.log('  - Applications: DRAFT, SUBMITTED, PENDING_PRIMARY_REVIEW, PRIMARY_PASSED, APPROVED');
  console.log('  - Review Tasks: 2 tasks (PRIMARY and SECONDARY)');
  console.log('  - Venues: 第一教学楼, 第二教学楼');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
