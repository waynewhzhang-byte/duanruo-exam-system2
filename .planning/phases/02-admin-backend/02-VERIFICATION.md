---
phase: 02-admin-backend
verified: 2026-03-05T10:30:00Z
re-verified: 2026-03-05T02:45:00Z
status: passed
score: 5/5 must-haves verified
gaps: []
  - truth: "考试列表页正确显示后端返回的考试数据，包括考试时间字段不为空"
    status: resolved
    reason: "Fixed in plan 02-05: Exam interface now uses examStart/examEnd, JSX renders these fields correctly. TypeScript passes."
    resolution: 02-05
      - path: "web/src/app/[tenantSlug]/admin/exams/page.tsx"
        issue: "Exam interface line 36: examDate?: string (should be examStart?/examEnd?). JSX line 394: renders exam.examDate which is never populated by backend."
    missing:
      - "Rename examDate to examStart in Exam interface and update JSX display at line 394 to use exam.examStart / exam.examEnd"
---

# Phase 2: Admin Backend Verification Report

**Phase Goal:** 租户管理员可以在后台正常完成考试管理、审核列表查看、统计查看和场地管理的全部日常操作
**Verified:** 2026-03-05T10:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 考试列表页正确显示后端返回的考试数据（ExamsResponse 使用 pageSize/currentPage，总数显示 totalElements） | VERIFIED | Pagination type fixed: pageSize/currentPage present at lines 44-47 of exams/page.tsx. totalElements used at lines 330, 519. Exam interface now has examStart/examEnd (lines 36-37), JSX renders correctly (line 395). |
| 2 | 考试详情页和编辑页时间字段使用正确字段名（registrationStart/registrationEnd/examStart/examEnd） | VERIFIED | detail/page.tsx Exam interface lines 34-37 uses registrationStart/registrationEnd/examStart/examEnd. edit/page.tsx Exam and ExamFormData interfaces use identical correct names, and useEffect populates from exam.examStart/examEnd correctly |
| 3 | ExamResponse 和 ExamUpdateRequest Zod schema 包含 examStart/examEnd 字段 | VERIFIED | schemas.ts lines 354-355 (ExamResponse) and 413-414 (ExamUpdateRequest) both contain examStart/examEnd |
| 4 | 审核管理页面使用正确 API 端点（/reviews/queue、/reviews/batch-decide、/statistics/reviews） | VERIFIED | ReviewsPageClient.tsx line 83: /reviews/queue, line 95: /statistics/reviews, line 109: /reviews/batch-decide. All use apiGetWithTenant/apiPostWithTenant. Old broken endpoints (/reviews/pending, /reviews/statistics, /reviews/batch-review) absent |
| 5 | 统计报表页面所有 API 调用携带 X-Tenant-ID（使用 apiGetWithTenant + useTenant） | VERIFIED | score-statistics/page.tsx: 5 occurrences of apiGetWithTenant, useTenant at line 86, enabled: !!tenant?.id guards on all 4 queries, tenant loading guard before examsLoading check |
| 6 | 场地管理页面状态徽章使用正确后端状态值（OPEN/IN_PROGRESS/CLOSED/COMPLETED） | VERIFIED | venues/page.tsx lines 69-75: Badge variant based on OPEN/IN_PROGRESS, all 5 backend status values labeled. No PUBLISHED or CANCELLED references |
| 7 | 后端 exam.service.ts mapToResponse 包含 examStart/examEnd 字段 | VERIFIED | server/src/exam/exam.service.ts lines 182-183 confirm examStart/examEnd in mapToResponse with inline comment |

**Score:** 7/7 truths verified (all gaps resolved)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ADMIN-01 | 02-01 | 租户管理员后台首次加载无 JS 运行时错误 | SATISFIED | admin/page.tsx uses useTenant with proper loading guard. Type-check passes with 0 errors. Backend build passes. |
| ADMIN-02 | 02-01, 02-05 | 考试列表正确获取并展示数据 | SATISFIED | Pagination fixed in 02-01; exam time column now displays examStart/examEnd correctly after gap closure in 02-05 |
| ADMIN-03 | 02-01 | 考试创建/编辑表单提交成功（DTO 字段与后端对齐） | SATISFIED | edit/page.tsx uses registrationStart/registrationEnd/examStart/examEnd in form and submits via apiPutWithTenant |
| ADMIN-04 | 02-02 | 初审/复审申请列表正确加载 | SATISFIED | ReviewsPageClient uses /reviews/queue with examId+stage params and tenant context |
| ADMIN-05 | 02-02 | 审核操作（通过/拒绝）可正常执行并更新状态 | SATISFIED | batchDecisionMutation uses /reviews/batch-decide with taskIds, invalidates query cache on success |
| ADMIN-06 | 02-03 | 统计报表页面数据正确展示 | SATISFIED | All 4 API calls use apiGetWithTenant with tenant.id; enabled guards prevent premature calls |
| ADMIN-07 | 02-04 | 场地/座位管理页面功能可用 | SATISFIED | venues/page.tsx correct status badges; ExamVenues uses useExamVenues hook calling /seating/venues with tenant context |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| web/src/app/[tenantSlug]/admin/exams/page.tsx | 36, 394 | Was: `examDate?: string` and `{exam.examDate}` — now fixed | Resolved | Gap closed in plan 02-05 |
| web/src/app/[tenantSlug]/admin/score-statistics/page.tsx | 143-148 | statusMap includes PUBLISHED/CANCELLED/REGISTRATION_OPEN which backend never returns | Info | Stale status labels present but no functional impact since getStatusBadge falls back to literal status value |

### Human Verification Required

#### 1. Review Queue Loads After Exam Selection

**Test:** Log in as tenant admin, navigate to reviews page, select an exam from the dropdown.
**Expected:** Primary review queue loads applications with candidate name, exam title, position, and status.
**Why human:** Cannot verify backend join of candidate/exam data to queue items without live data.

#### 2. Batch Approve/Reject Updates Application Status

**Test:** Select review tasks in the queue, click "批量通过", confirm the dialog.
**Expected:** Tasks disappear from queue or status updates; success toast appears.
**Why human:** Requires live backend with review tasks to verify state transition.

#### 3. Score Statistics Charts Render Data

**Test:** Navigate to score-statistics page, select a completed exam.
**Expected:** Funnel chart, pass/fail pie chart, and position bar chart all render with data (not empty).
**Why human:** Requires live exam data with scored applications.

#### 4. Exam Create/Edit Submits Without 400 Error

**Test:** Edit an existing exam, change all date fields, submit.
**Expected:** No 400 validation error; redirects to exam detail page.
**Why human:** Requires live backend to verify DTO field alignment end-to-end.

### Gaps Summary

**All gaps resolved.** The exam list page (`exams/page.tsx`) field name mismatch was fixed in plan 02-05:
- Exam interface now uses `examStart?: string` and `examEnd?: string` (lines 36-37)
- JSX now renders `{exam.examStart || '未设置'} ~ {exam.examEnd || '未设置'}` (line 395)

All ADMIN-01 through ADMIN-07 requirements are now verified:
- ADMIN-01: Admin homepage has clean loading guards; TypeScript passes 0 errors; backend compiles cleanly.
- ADMIN-02: Exam list page now displays exam times correctly (gap closed in 02-05).
- ADMIN-03: Edit form uses correct field names and submits via apiPutWithTenant.
- ADMIN-04/05: Reviews page rewritten with correct endpoints and tenant-aware API calls.
- ADMIN-06: Statistics page uses apiGetWithTenant for all 4 queries with proper enabled guards.
- ADMIN-07: Venues page has correct status badges; venue hook wired to /seating/venues with tenant context.

---

_Verified: 2026-03-05T10:30:00Z_
_Re-verified: 2026-03-05T02:45:00Z_
_Verifier: Claude (gsd-verifier) + gap closure 02-05_
