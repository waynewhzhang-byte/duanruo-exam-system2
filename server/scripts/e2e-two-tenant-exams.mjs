/**
 * One-shot: two tenant admins each get an exam with form (published), position+subject, venue+rooms, OPEN status.
 * Requires API at BASE (default http://127.0.0.1:8081/api/v1) and passwords admin123@Abc for listed users.
 */
const BASE = process.env.API_BASE || 'http://127.0.0.1:8081/api/v1';

const tenants = [
  {
    username: 'hkuadmin1',
    password: 'admin123@Abc',
    tenantId: '2b00fab2-5b1d-448d-bdfd-aec1a7e80714',
    examCodePrefix: 'E2E-HKU',
    title: 'E2E 双租户考试 — HKU',
  },
  {
    username: 'tenantadmin0423',
    password: 'admin123@Abc',
    tenantId: '7bf29800-9d69-4b69-8523-9eda41ab15fe',
    examCodePrefix: 'E2E-AUTO',
    title: 'E2E 双租户考试 — 自动化0423',
  },
];

async function jfetch(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${method} ${path} -> ${res.status} non-json: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(
      `${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 800)}`,
    );
  }
  return json.data !== undefined ? json.data : json;
}

async function setupOne(cfg) {
  const suf = Date.now().toString(36);
  const examCode = `${cfg.examCodePrefix}-${suf}`.toUpperCase().slice(0, 32);

  const login = await jfetch('/auth/login', {
    method: 'POST',
    body: { username: cfg.username, password: cfg.password },
  });
  let token = login.token;

  const sel = await jfetch('/auth/select-tenant', {
    method: 'POST',
    token,
    body: { tenantId: cfg.tenantId },
  });
  token = sel.token;

  const exam = await jfetch('/exams', {
    method: 'POST',
    token,
    body: {
      code: examCode,
      title: cfg.title,
      description: '自动化：岗位、科目、报名表单、考场',
      registrationStart: '2026-05-01T00:00:00.000Z',
      registrationEnd: '2026-12-31T23:59:59.000Z',
      examStart: '2026-11-01T09:00:00.000Z',
      examEnd: '2026-11-02T18:00:00.000Z',
      feeRequired: false,
    },
  });
  const examId = exam.id;

  const tmpl = await jfetch(
    `/form-templates?examId=${encodeURIComponent(examId)}`,
    {
      method: 'POST',
      token,
      body: { templateName: '报名登记表', description: 'E2E 模板' },
    },
  );
  const templateId = tmpl.id;

  const fields = [
    {
      key: 'fullName',
      label: '姓名',
      type: 'TEXT',
      validation: { required: true },
      order: 1,
    },
    {
      key: 'phone',
      label: '手机号',
      type: 'PHONE',
      validation: { required: true },
      order: 2,
    },
  ];

  await jfetch(
    `/form-templates/${encodeURIComponent(templateId)}/batch?examId=${encodeURIComponent(examId)}`,
    {
      method: 'PUT',
      token,
      body: {
        templateName: '报名登记表',
        description: 'E2E 已填字段',
        fields,
      },
    },
  );

  await jfetch(
    `/form-templates/${encodeURIComponent(templateId)}/publish?examId=${encodeURIComponent(examId)}`,
    { method: 'POST', token },
  );

  const pos = await jfetch('/exams/positions', {
    method: 'POST',
    token,
    body: {
      examId,
      code: `POS-${suf}`,
      title: '综合管理岗',
      description: 'E2E 岗位',
      quota: 50,
      subjects: [
        {
          name: '综合能力笔试',
          durationMinutes: 120,
          type: 'WRITTEN',
          maxScore: 100,
          passingScore: 60,
          ordering: 0,
        },
        {
          name: '结构化面试',
          durationMinutes: 30,
          type: 'INTERVIEW',
          maxScore: 100,
          passingScore: 60,
          ordering: 1,
        },
      ],
    },
  });

  await jfetch(`/exams/${encodeURIComponent(examId)}/open`, {
    method: 'POST',
    token,
  });

  const venue = await jfetch('/seating/venues', {
    method: 'POST',
    token,
    body: {
      name: `主考点-${suf}`,
      capacity: 200,
      examId,
      rooms: [
        { name: '101 教室', code: `R101-${suf}`, capacity: 40, floor: 1 },
        { name: '102 教室', code: `R102-${suf}`, capacity: 40, floor: 1 },
      ],
    },
  });

  return {
    tenantId: cfg.tenantId,
    username: cfg.username,
    examId,
    examCode,
    templateId,
    positionId: pos.id,
    venueId: venue.id,
  };
}

async function main() {
  const out = [];
  for (const t of tenants) {
    out.push(await setupOne(t));
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
