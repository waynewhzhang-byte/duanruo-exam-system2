import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';
import type { CustomWorld } from '../support/world';

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

function unwrapEnvelope(body: unknown): unknown {
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    (body as { success?: boolean }).success === true &&
    'data' in body
  ) {
    return (body as { data: unknown }).data;
  }
  return body;
}

function tenantPayloadFromSlugResponse(body: unknown): { id?: string } {
  const inner = unwrapEnvelope(body) as { id?: string } | null | undefined;
  if (inner && typeof inner === 'object' && 'id' in inner) {
    return inner;
  }
  return (body as { id?: string }) || {};
}

/** UTC 日期时间 ISO 字符串，便于与后端 Date 往返一致 */
function isoUtcDaysFromNow(
  daysFromToday: number,
  hourUtc: number,
  minuteUtc = 0,
): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  d.setUTCHours(hourUtc, minuteUtc, 0, 0);
  return d.toISOString();
}

Given(
  '我已以租户管理员身份登录并选定测试租户',
  async function (this: CustomWorld) {
    const username = (
      process.env.BDD_TENANT_ADMIN_USER ||
      process.env.BDD_TENANT_ADMIN_USERNAME ||
      'hkuadmin'
    ).trim();
    const password =
      process.env.BDD_TENANT_ADMIN_PASSWORD?.trim() ??
      'zww0625wh'; /* NOSONAR — 本地 BDD 默认；生产/CI 请用 BDD_TENANT_ADMIN_PASSWORD 覆盖 */
    const tenantCode = process.env.BDD_TENANT_CODE || 'hku';
    const tenantIdOverride = process.env.BDD_TENANT_ID?.trim();

    const loginRes = await axios.post(
      `${API_BASE}/auth/login`,
      { username, password },
      { timeout: 20000, validateStatus: () => true },
    );
    if (![200, 201].includes(loginRes.status) || !loginRes.data?.success) {
      throw new Error(
        `租户管理员登录失败 HTTP ${loginRes.status}: ${JSON.stringify(loginRes.data)}。请在数据库中创建 TENANT_ADMIN 账号或设置 BDD_TENANT_ADMIN_USER / BDD_TENANT_ADMIN_PASSWORD（可用 node --env-file=../server/.env 注入）。`,
      );
    }
    const loginData = unwrapEnvelope(loginRes.data) as {
      token?: string;
      user?: { id?: string };
    };
    const initialToken = loginData?.token;
    expect(initialToken, 'login token').to.be.a('string');

    let tenantId = tenantIdOverride;
    if (!tenantId) {
      const slugRes = await axios.get(`${API_BASE}/tenants/slug/${tenantCode}`, {
        timeout: 15000,
        validateStatus: () => true,
      });
      expect(
        [200, 201].includes(slugRes.status),
        `resolve tenant by code "${tenantCode}" HTTP ${slugRes.status}: ${JSON.stringify(slugRes.data)}`,
      ).to.equal(true);
      const tenantPayload = tenantPayloadFromSlugResponse(slugRes.data);
      tenantId = tenantPayload?.id;
    }

    expect(tenantId, `tenant id (BDD_TENANT_ID or slug ${tenantCode})`).to.be.a(
      'string',
    );

    const selectRes = await axios.post(
      `${API_BASE}/auth/select-tenant`,
      { tenantId },
      {
        headers: {
          Authorization: `Bearer ${initialToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
        validateStatus: () => true,
      },
    );
    expect(
      [200, 201].includes(selectRes.status),
      `select-tenant HTTP ${selectRes.status}: ${JSON.stringify(selectRes.data)}`,
    ).to.equal(true);
    expect(selectRes.data?.success, JSON.stringify(selectRes.data)).to.equal(true);
    const selectData = unwrapEnvelope(selectRes.data) as { token?: string };
    const sessionToken = selectData?.token ?? initialToken;
    expect(sessionToken, 'session token after select-tenant').to.be.a('string');

    this.token = sessionToken;
    this.bddTenantId = tenantId;
    this.lastResponse = selectRes.data;
    this.lastError = undefined;
  },
);

When(
  '我使用 API 以代码前缀 {string} 和标题 {string} 创建一场新考试',
  async function (this: CustomWorld, codePrefix: string, title: string) {
    expect(this.token, '请先完成租户管理员登录步骤').to.be.a('string');
    const tenantId = this.bddTenantId;
    expect(tenantId, 'bddTenantId').to.be.a('string');

    const code = `${codePrefix}-${Date.now()}`;
    const body = {
      code,
      title,
      description: '由 BDD tenant-admin-exam-api 创建',
      feeRequired: false,
    };

    const res = await axios.post(`${API_BASE}/exams`, body, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    this.lastResponse = res.data;
    this.lastError = res.status >= 400 ? res : undefined;

    if ([200, 201].includes(res.status) && res.data?.success) {
      const exam = unwrapEnvelope(res.data) as Record<string, unknown>;
      this.currentExam = exam;
    }
    this.lastExamCreatePayload = undefined;
  },
);

When(
  '我使用 API 创建一场字段齐全的 BDD 详细考试',
  async function (this: CustomWorld) {
    expect(this.token, '请先完成租户管理员登录步骤').to.be.a('string');
    const tenantId = this.bddTenantId;
    expect(tenantId, 'bddTenantId').to.be.a('string');

    const registrationStart = isoUtcDaysFromNow(7, 0, 0);
    const registrationEnd = isoUtcDaysFromNow(21, 23, 59);
    const examStart = isoUtcDaysFromNow(30, 8, 0);
    const examEnd = isoUtcDaysFromNow(30, 12, 0);

    const code = `bdd-detailed-${Date.now()}`;
    const body = {
      code,
      title: 'BDD 详细字段考试',
      description: '含报名窗口、考试日程与费用的 BDD 数据。',
      announcement: '请关注官方通知；本考试由 BDD 自动创建。',
      registrationStart,
      registrationEnd,
      examStart,
      examEnd,
      feeRequired: true,
      feeAmount: 120,
    };

    this.lastExamCreatePayload = { ...body };

    const res = await axios.post(`${API_BASE}/exams`, body, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    this.lastResponse = res.data;
    this.lastError = res.status >= 400 ? res : undefined;

    if ([200, 201].includes(res.status) && res.data?.success) {
      const exam = unwrapEnvelope(res.data) as Record<string, unknown>;
      this.currentExam = exam;
    }
  },
);

Then('API 应返回成功且响应中含考试 id 与代码', function (this: CustomWorld) {
  const raw = this.lastResponse;
  expect(raw?.success, JSON.stringify(raw)).to.equal(true);
  const exam = unwrapEnvelope(raw) as {
    id?: string;
    code?: string;
    title?: string;
  };
  expect(exam?.id, 'exam.id').to.be.a('string').and.to.have.length.greaterThan(0);
  expect(exam?.code, 'exam.code').to.be.a('string').and.to.have.length.greaterThan(0);
  this.currentExam = exam;
});

Then('我应能通过考试 id 查询到该考试且标题一致', async function (this: CustomWorld) {
  const examId = this.currentExam?.id as string | undefined;
  const expectedTitle = this.currentExam?.title as string | undefined;
  expect(examId, 'currentExam.id').to.be.a('string');
  expect(expectedTitle, 'currentExam.title').to.be.a('string');
  const tenantId = this.bddTenantId;
  expect(tenantId, 'bddTenantId').to.be.a('string');

  const res = await axios.get(`${API_BASE}/exams/${examId}`, {
    headers: {
      Authorization: `Bearer ${this.token}`,
      'X-Tenant-ID': tenantId,
    },
    timeout: 20000,
    validateStatus: () => true,
  });

  expect(
    [200, 201].includes(res.status),
    `GET exam HTTP ${res.status}: ${JSON.stringify(res.data)}`,
  ).to.equal(true);
  expect(res.data?.success, JSON.stringify(res.data)).to.equal(true);
  const detail = unwrapEnvelope(res.data) as { title?: string; id?: string };
  expect(detail?.id).to.equal(examId);
  expect(detail?.title).to.equal(expectedTitle);
});

Then(
  '我应能通过考试 id 查询到该考试且详细字段与创建请求一致',
  async function (this: CustomWorld) {
    const payload = this.lastExamCreatePayload;
    expect(payload, 'lastExamCreatePayload').to.be.an('object');
    if (!payload || typeof payload !== 'object') {
      throw new Error('lastExamCreatePayload missing after Given/When');
    }
    const examPayload = payload as Record<string, unknown>;
    const examId = this.currentExam?.id as string | undefined;
    expect(examId, 'currentExam.id').to.be.a('string');
    const tenantId = this.bddTenantId;
    expect(tenantId, 'bddTenantId').to.be.a('string');

    const res = await axios.get(`${API_BASE}/exams/${examId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': tenantId,
      },
      timeout: 20000,
      validateStatus: () => true,
    });

    expect(
      [200, 201].includes(res.status),
      `GET exam HTTP ${res.status}: ${JSON.stringify(res.data)}`,
    ).to.equal(true);
    expect(res.data?.success, JSON.stringify(res.data)).to.equal(true);
    const detail = unwrapEnvelope(res.data) as Record<string, unknown>;

    expect(detail.title).to.equal(examPayload.title);
    expect(detail.description).to.equal(examPayload.description);
    expect(detail.announcement).to.equal(examPayload.announcement);
    expect(detail.feeRequired).to.equal(examPayload.feeRequired);
    expect(Number(detail.feeAmount)).to.equal(Number(examPayload.feeAmount));

    const instantMs = (v: unknown): number => {
      if (v == null) return Number.NaN;
      if (v instanceof Date) return v.getTime();
      if (typeof v === 'string' || typeof v === 'number') {
        return new Date(v).getTime();
      }
      return Number.NaN;
    };
    const sameInstant = (actual: unknown, expected: unknown) => {
      expect(instantMs(actual)).to.equal(instantMs(expected));
    };
    sameInstant(detail.registrationStart, examPayload.registrationStart);
    sameInstant(detail.registrationEnd, examPayload.registrationEnd);
    sameInstant(detail.examStart, examPayload.examStart);
    sameInstant(detail.examEnd, examPayload.examEnd);
  },
);
