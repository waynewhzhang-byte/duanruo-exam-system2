import { randomBytes } from 'crypto';
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';
import pg from 'pg';
import type { CustomWorld } from '../support/world';

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

/** 与 server/prisma/tenant-schema/init-tables.sql 及 TenantService 校验列表一致 */
const TENANT_INIT_TABLES = [
  'exams',
  'positions',
  'subjects',
  'applications',
  'application_audit_logs',
  'review_tasks',
  'reviews',
  'exam_reviewers',
  'payment_orders',
  'tickets',
  'ticket_number_rules',
  'ticket_sequences',
  'venues',
  'rooms',
  'seat_assignments',
  'allocation_batches',
  'files',
] as const;

async function withPgClient<T>(
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url || url.length < 8) {
    throw new Error(
      'DATABASE_URL is missing. Set it to the same Postgres URL as the Nest server (e.g. from server/.env).',
    );
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

Given(
  'DATABASE_URL 已配置以便直连校验 schema',
  function (this: CustomWorld) {
    expect(
      process.env.DATABASE_URL,
      'Set DATABASE_URL to the same database the API uses',
    ).to.be.a('string').and.to.have.length.greaterThan(0);
  },
);

Given(
  '我已通过 API 以超级管理员身份登录',
  async function (this: CustomWorld) {
    const username = process.env.BDD_SUPERADMIN_USER || 'superadmin';
    // Override in CI with BDD_SUPERADMIN_PASSWORD; local dev matches seed superadmin.
    const password = process.env.BDD_SUPERADMIN_PASSWORD ?? 'superadmin123'; // NOSONAR
    const res = await axios.post(
      `${API_BASE}/auth/login`,
      { username, password },
      { timeout: 15000, validateStatus: () => true },
    );
    expect(
      [200, 201].includes(res.status),
      `login HTTP ${res.status}: ${JSON.stringify(res.data)}`,
    ).to.equal(true);
    expect(res.data?.success, JSON.stringify(res.data)).to.equal(true);
    const token = res.data?.data?.token;
    expect(token, 'JWT token').to.be.a('string');
    this.superAdminToken = token;
    this.token = token;
  },
);

When(
  '我通过 API 创建新租户（自动生成唯一 code）',
  async function (this: CustomWorld) {
    const code = `bdd-${Date.now()}`;
    const body = {
      name: `BDD Schema Tenant ${code}`,
      code,
      contactEmail: `bdd+${Date.now()}@example.com`,
    };
    const res = await axios.post(`${API_BASE}/super-admin/tenants`, body, {
      headers: { Authorization: `Bearer ${this.superAdminToken}` },
      timeout: 120000,
      validateStatus: () => true,
    });
    this.lastResponse = res.data;
    expect(
      [200, 201].includes(res.status),
      `create tenant HTTP ${res.status}: ${JSON.stringify(res.data)}`,
    ).to.equal(true);
    expect(res.data?.success, JSON.stringify(res.data)).to.equal(true);
    const d = res.data?.data;
    expect(d?.code, 'tenant code').to.equal(code);
    expect(d?.schemaName, 'schema_name').to.equal(`tenant_${code}`);
    expect(d?.id, 'tenant id').to.be.a('string');
    this.lastCreatedTenant = {
      id: d.id,
      code,
      schemaName: d.schemaName,
      name: d.name,
    };
  },
);

Then(
  'API 应返回成功且 data 中含 tenant 记录与预期 schema_name',
  function (this: CustomWorld) {
    const d = this.lastResponse?.data;
    expect(this.lastResponse?.success).to.equal(true);
    expect(d?.schemaName).to.equal(`tenant_${d?.code}`);
    expect(this.lastCreatedTenant?.schemaName).to.equal(d?.schemaName);
  },
);

Then(
  '使用 SQL 应能查到 public.tenants 中对应 code 的行',
  async function (this: CustomWorld) {
    const { code, id } = this.lastCreatedTenant!;
    await withPgClient(async (client) => {
      const { rows } = await client.query<{
        id: string;
        code: string;
        schema_name: string;
      }>(
        `SELECT id::text, code, schema_name FROM public.tenants WHERE code = $1 LIMIT 1`,
        [code],
      );
      expect(rows.length, `tenant row for code=${code}`).to.equal(1);
      expect(String(rows[0].id).toLowerCase()).to.equal(String(id).toLowerCase());
      expect(rows[0].schema_name).to.equal(`tenant_${code}`);
    });
  },
);

Then('使用 SQL 应存在该租户的专属 schema', async function (this: CustomWorld) {
  const schemaName = this.lastCreatedTenant!.schemaName;
  await withPgClient(async (client) => {
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
      ) AS exists`,
      [schemaName],
    );
    expect(rows[0]?.exists, `schema ${schemaName}`).to.equal(true);
  });
});

Then(
  '该 schema 下应存在 init-tables 定义的全部业务表',
  async function (this: CustomWorld) {
    const schemaName = this.lastCreatedTenant!.schemaName;
    await withPgClient(async (client) => {
      const { rows } = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = $1 AND table_type = 'BASE TABLE'
         AND table_name = ANY($2::text[])`,
        [schemaName, [...TENANT_INIT_TABLES]],
      );
      const found = new Set(rows.map((r) => r.table_name));
      for (const t of TENANT_INIT_TABLES) {
        expect(
          found.has(t),
          `missing table ${schemaName}.${t} (found ${rows.length}/${TENANT_INIT_TABLES.length})`,
        ).to.equal(true);
      }
    });
  },
);

When(
  '我通过 API 在该租户下创建租户管理员账户（自动生成用户名与邮箱）',
  async function (this: CustomWorld) {
    const tenantId = this.lastCreatedTenant?.id;
    expect(tenantId, 'create tenant first').to.be.a('string');
    const suffix = Date.now();
    const username = `tadm${suffix}`;
    const email = `tadm${suffix}@bdd.example.com`;
    const password = `Aa1!${randomBytes(10).toString('hex')}`;
    const body = {
      username,
      password,
      email,
      fullName: 'BDD Tenant Admin',
      tenantId,
      tenantRole: 'TENANT_ADMIN',
      globalRoles: [] as string[],
    };
    const res = await axios.post(`${API_BASE}/super-admin/users`, body, {
      headers: { Authorization: `Bearer ${this.superAdminToken}` },
      timeout: 60000,
      validateStatus: () => true,
    });
    this.lastResponse = res.data;
    expect(
      [200, 201].includes(res.status),
      `create user HTTP ${res.status}: ${JSON.stringify(res.data)}`,
    ).to.equal(true);
    expect(res.data?.success, JSON.stringify(res.data)).to.equal(true);
    const d = res.data?.data;
    expect(d?.id, 'user id').to.be.a('string');
    expect(d?.username).to.equal(username);
    expect('passwordHash' in (d ?? {})).to.equal(
      false,
      'response must not expose passwordHash',
    );
    this.lastCreatedTenantAdmin = {
      userId: d.id,
      username,
      email,
    };
  },
);

Then(
  '创建用户 API 应返回成功且 data 中含用户 id 且无 passwordHash',
  function (this: CustomWorld) {
    expect(this.lastResponse?.success).to.equal(true);
    const d = this.lastResponse?.data;
    expect(d?.id).to.equal(this.lastCreatedTenantAdmin?.userId);
    expect('passwordHash' in (d ?? {})).to.equal(false);
  },
);

Then(
  '使用 SQL 应在 public.users 中查到该租户管理员',
  async function (this: CustomWorld) {
    const { userId, username, email } = this.lastCreatedTenantAdmin!;
    await withPgClient(async (client) => {
      const { rows } = await client.query<{
        id: string;
        username: string;
        email: string;
        status: string;
      }>(
        `SELECT id::text, username, email, status FROM public.users WHERE id = $1::uuid LIMIT 1`,
        [userId],
      );
      expect(rows.length).to.equal(1);
      expect(rows[0].username).to.equal(username);
      expect(rows[0].email).to.equal(email);
      expect(rows[0].status).to.equal('ACTIVE');
    });
  },
);

Then(
  '使用 SQL 应在 public.user_tenant_roles 中查到该用户对该租户的 TENANT_ADMIN 绑定',
  async function (this: CustomWorld) {
    const { userId } = this.lastCreatedTenantAdmin!;
    const tenantId = this.lastCreatedTenant!.id;
    await withPgClient(async (client) => {
      const { rows } = await client.query<{ role: string; active: boolean }>(
        `SELECT role, active FROM public.user_tenant_roles
         WHERE user_id = $1::uuid AND tenant_id = $2::uuid
           AND role = 'TENANT_ADMIN' AND active = true AND revoked_at IS NULL`,
        [userId, tenantId],
      );
      expect(rows.length, 'TENANT_ADMIN tenant role row').to.equal(1);
      expect(rows[0].role).to.equal('TENANT_ADMIN');
      expect(rows[0].active).to.equal(true);
    });
  },
);
