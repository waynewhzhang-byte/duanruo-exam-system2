/**
 * 将误落在 Prisma 物理模板 schema `tenant` 的考试及依赖数据
 * 迁移到各真实租户 schema（`tenant_*`），并可从 `tenant` 中删除。
 *
 * 依据：created_by → public.user_tenant_roles（取 TENANT_ADMIN 优先）→ public.tenants.schema_name。
 * 对创建人账号已不存在的行，用 FALLBACK_TENANT_CODE_BY_EXAM_ID 或按 code 前缀回退。
 *
 * 使用：
 *   pnpm -C server exec ts-node -r dotenv/config scripts/migrate-misplaced-exams-from-template.ts
 *   pnpm -C server exec ts-node -r dotenv/config scripts/migrate-misplaced-exams-from-template.ts --execute
 *   pnpm -C server exec ts-node -r dotenv/config scripts/migrate-misplaced-exams-from-template.ts --execute --delete-source
 */

import { Pool, type PoolClient } from 'pg';

const TEMPLATE = 'tenant';

const FALLBACK_TENANT_CODE_BY_EXAM_ID: Record<string, string> = {
  '3ba53dbf-ed36-4be5-96e8-9debfc475a0b': 'hkuui',
  '5e07b3db-c15f-4411-a02c-148603d44c01': 'ui-tenant-0424a',
};

function q(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

type ExamRow = { id: string; code: string; title: string; created_by: string | null };

function heuristicTenantCode(exam: ExamRow): string | null {
  if (exam.code.startsWith('E2EHKU') || exam.code.startsWith('E2E-HKU')) {
    return 'hkuui';
  }
  if (exam.code.startsWith('UIE2E') || exam.title.includes('UI E2E')) {
    return 'ui-tenant-0424a';
  }
  if (exam.code.startsWith('E2E-AUTO') || exam.title.includes('自动化0423')) {
    return 'tenant-auto-0423';
  }
  if (exam.code === 'EXAM0423A') {
    return 'tenant-auto-0423';
  }
  if (exam.title.includes('测试') && exam.code.startsWith('SPRING')) {
    return 'test-a';
  }
  return null;
}

async function resolveTargetSchemaName(
  client: PoolClient,
  exam: ExamRow,
): Promise<string | null> {
  const fromFallback = FALLBACK_TENANT_CODE_BY_EXAM_ID[exam.id];
  if (fromFallback) {
    const { rows } = await client.query<{ schema_name: string }>(
      `select schema_name from public.tenants where code = $1 limit 1`,
      [fromFallback],
    );
    if (rows[0]?.schema_name) {
      return rows[0].schema_name;
    }
    console.error(
      `[skip] 回退 code=${fromFallback} 无对应租户 public.tenants 行，examId=${exam.id}`,
    );
    return null;
  }

  if (exam.created_by) {
    const { rows } = await client.query<{ schema_name: string }>(
      `select t.schema_name
       from public.user_tenant_roles utr
       join public.tenants t on t.id = utr.tenant_id
       where utr.user_id = $1::uuid
         and utr.active = true
       order by case when utr.role = 'TENANT_ADMIN' then 0 else 1 end,
                utr.granted_at desc nulls last
       limit 1`,
      [exam.created_by],
    );
    if (rows[0]?.schema_name) {
      return rows[0].schema_name;
    }
  }

  const h = heuristicTenantCode(exam);
  if (h) {
    const { rows } = await client.query<{ schema_name: string }>(
      `select schema_name from public.tenants where code = $1 limit 1`,
      [h],
    );
    if (rows[0]?.schema_name) {
      console.warn(
        `[heuristic] exam ${exam.id} code=${exam.code} → tenant code ${h} → ${rows[0].schema_name}`,
      );
      return rows[0].schema_name;
    }
  }
  console.error(
    `[skip] 无法解析目标 schema: examId=${exam.id} code=${exam.code} created_by=${exam.created_by}`,
  );
  return null;
}

async function copyOneExam(
  c: PoolClient,
  examId: string,
  dst: string,
): Promise<void> {
  const t = (sql: string, params?: unknown[]) => c.query(sql, params);

  const s = q(TEMPLATE);
  const d = q(dst);

  await t(
    `insert into ${d}.exams
     select e.* from ${s}.exams e
     where e.id = $1::uuid
     and not exists (select 1 from ${d}.exams x where x.id = e.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.positions
     select p.* from ${s}.positions p
     where p.exam_id = $1::uuid
     and not exists (select 1 from ${d}.positions x where x.id = p.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.subjects
     select sub.* from ${s}.subjects sub
     inner join ${s}.positions p on p.id = sub.position_id
     where p.exam_id = $1::uuid
     and not exists (select 1 from ${d}.subjects x where x.id = sub.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.venues
     select v.* from ${s}.venues v
     where v.exam_id = $1::uuid
     and not exists (select 1 from ${d}.venues x where x.id = v.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.rooms
     select r.* from ${s}.rooms r
     inner join ${s}.venues v on v.id = r.venue_id
     where v.exam_id = $1::uuid
     and not exists (select 1 from ${d}.rooms x where x.id = r.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.applications
     select a.* from ${s}.applications a
     where a.exam_id = $1::uuid
     and not exists (select 1 from ${d}.applications x where x.id = a.id)`,
    [examId],
  );

  for (const table of [
    'application_audit_logs',
    'review_tasks',
    'reviews',
  ] as const) {
    await t(
      `insert into ${d}."${table}"
       select w.* from ${s}."${table}" w
       inner join ${s}.applications a on a.id = w.application_id
       where a.exam_id = $1::uuid
       and not exists (select 1 from ${d}."${table}" x where x.id = w.id)`,
      [examId],
    );
  }

  await t(
    `insert into ${d}.files
     select f.* from ${s}.files f
     inner join ${s}.applications a on a.id = f.application_id
     where a.exam_id = $1::uuid
     and f.application_id is not null
     and not exists (select 1 from ${d}.files x where x.id = f.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.exam_scores
     select s.* from ${s}.exam_scores s
     inner join ${s}.applications a on a.id = s.application_id
     where a.exam_id = $1::uuid
     and not exists (select 1 from ${d}.exam_scores x where x.id = s.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.payment_orders
     select p.* from ${s}.payment_orders p
     inner join ${s}.applications a on a.id = p.application_id
     where a.exam_id = $1::uuid
     and not exists (select 1 from ${d}.payment_orders x where x.id = p.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.tickets
     select tix.* from ${s}.tickets tix
     where tix.exam_id = $1::uuid
     and not exists (select 1 from ${d}.tickets x where x.id = tix.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.exam_reviewers
     select r.* from ${s}.exam_reviewers r
     where r.exam_id = $1::uuid
     and not exists (select 1 from ${d}.exam_reviewers x where x.id = r.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.seat_assignments
     select sa.* from ${s}.seat_assignments sa
     where sa.exam_id = $1::uuid
     and not exists (select 1 from ${d}.seat_assignments x where x.id = sa.id)`,
    [examId],
  );

  await t(
    `insert into ${d}.ticket_number_rules
     select tnr.* from ${s}.ticket_number_rules tnr
     where tnr.exam_id = $1::uuid
     and not exists (select 1 from ${d}.ticket_number_rules x where x.exam_id = tnr.exam_id)`,
    [examId],
  );

  await t(
    `insert into ${d}.ticket_sequences
     select ts.* from ${s}.ticket_sequences ts
     where ts.exam_id = $1::uuid
     and not exists (
       select 1 from ${d}.ticket_sequences x
       where x.exam_id = ts.exam_id and x.scope = ts.scope and x.counter_date = ts.counter_date
     )`,
    [examId],
  );

  await t(
    `insert into ${d}.allocation_batches
     select b.* from ${s}.allocation_batches b
     where b.exam_id = $1::uuid
     and not exists (select 1 from ${d}.allocation_batches x where x.id = b.id)`,
    [examId],
  );
}

async function deleteFromTemplate(
  c: PoolClient,
  examId: string,
): Promise<void> {
  const t = (sql: string, params?: unknown[]) => c.query(sql, params);
  const s = q(TEMPLATE);

  await t(
    `delete from ${s}.seat_assignments where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.tickets t using ${s}.exams e where t.exam_id = e.id and e.id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.payment_orders p
     using ${s}.applications a
     where p.application_id = a.id and a.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.exam_scores s
     using ${s}.applications a
     where s.application_id = a.id and a.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.reviews r
     using ${s}.applications a
     where r.application_id = a.id and a.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.review_tasks rt
     using ${s}.applications a
     where rt.application_id = a.id and a.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.application_audit_logs l
     using ${s}.applications a
     where l.application_id = a.id and a.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.files f
     using ${s}.applications a
     where f.application_id = a.id and a.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.applications where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.exam_reviewers where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.ticket_number_rules where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.ticket_sequences where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.rooms r
     using ${s}.venues v
     where r.venue_id = v.id and v.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.venues where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.allocation_batches where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.subjects su
     using ${s}.positions p
     where su.position_id = p.id and p.exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.positions where exam_id = $1::uuid`,
    [examId],
  );
  await t(
    `delete from ${s}.exams where id = $1::uuid`,
    [examId],
  );
}

async function main(): Promise<void> {
  const execute = process.argv.includes('--execute');
  const deleteSource = process.argv.includes('--delete-source');

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL 未设置');
  }

  const pool = new Pool({ connectionString: url });

  const { rows: exams } = await pool.query<ExamRow>(
    `select id, code, title, created_by
     from ${q(TEMPLATE)}.exams
     order by created_at asc`,
  );

  if (exams.length === 0) {
    console.log('模板库 tenant 中无 exams 行，结束。');
    await pool.end();
    return;
  }

  console.log(
    `发现 ${q(TEMPLATE)}.exams 共 ${exams.length} 行。execute=${execute} deleteSource=${deleteSource}`,
  );

  for (const ex of exams) {
    const targetSchema = await (async () => {
      const c = await pool.connect();
      try {
        return await resolveTargetSchemaName(c, ex);
      } finally {
        c.release();
      }
    })();

    if (!targetSchema || targetSchema === TEMPLATE) {
      continue;
    }

    console.log(`→ 考试 ${ex.id} ${ex.code} 目标 schema: ${targetSchema}`);

    if (!execute) {
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('begin');
      await copyOneExam(client, ex.id, targetSchema);
      if (deleteSource) {
        await deleteFromTemplate(client, ex.id);
      }
      await client.query('commit');
      console.log(
        `  完成: 已复制到 ${targetSchema}${
          deleteSource ? '，并从 tenant 删除' : ''
        }`,
      );
    } catch (e) {
      await client.query('rollback');
      console.error(
        `  失败: examId=${ex.id} ${(e as Error).message}\n${
          (e as Error).stack ?? ''
        }`,
      );
    } finally {
      client.release();
    }
  }

  await pool.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
