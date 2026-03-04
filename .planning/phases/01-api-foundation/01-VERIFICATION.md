---
phase: 01-api-foundation
verified: 2026-03-04T09:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Navigate to a [tenantSlug] route without prior login — confirm X-Tenant-ID is present in network tab"
    expected: "Network panel shows X-Tenant-ID header with a valid UUID on every API request from /[slug]/admin/* routes"
    why_human: "resolveTenantId relies on localStorage populated at login time; cannot confirm correct value end-to-end without a live browser session"
  - test: "Submit a form with invalid data (e.g., blank exam name) and observe the error message"
    expected: "Toast or inline error shows NestJS validation text like 'name must not be empty; startDate must be a Date'"
    why_human: "UI rendering of APIError.message depends on individual page form error handlers — cannot grep for all display sites"
  - test: "Let the auth cookie expire, then trigger any API call"
    expected: "Browser redirects to /login?redirect=<current-path> without a console crash or blank page"
    why_human: "Requires an actual expired JWT; cannot simulate token expiry statically"
  - test: "Trigger a 403 response (e.g., access a resource your role cannot see)"
    expected: "Destructive toast with title '权限不足' appears in the top-right corner"
    why_human: "Toast rendering requires the Toaster to be mounted and a live browser to confirm visual output"
---

# Phase 1: API Foundation Verification Report

**Phase Goal:** Fix the API client layer so every page gets correct headers, readable errors, and automatic auth handling
**Verified:** 2026-03-04T09:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria (from ROADMAP.md)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | 任意需要租户上下文的 API 请求，网络面板中可见 X-Tenant-ID 请求头且值正确 | VERIFIED (human confirm recommended) | `resolveTenantId()` sets `headers['X-Tenant-ID']` at api.ts:105; slug fallback reads `tenantRoles` from localStorage and caches result |
| 2 | 所有列表/详情页面数据正常渲染，不因响应格式解包失败而显示空白或报错 | VERIFIED | Both schema and non-schema paths check `'success' in data && 'data' in data` before unwrapping at api.ts:171,178; comment block documents the contract |
| 3 | 提交含错误数据的表单时，页面显示后端返回的具体字段校验错误信息 | VERIFIED (human confirm recommended) | `extractMessage()` at api.ts:145-153 handles `string[]` via `Array.isArray(d.message)` joined with `'; '` |
| 4 | 在令牌过期后操作任意页面，浏览器自动跳转到登录页而非停留在报错状态 | VERIFIED (human confirm recommended) | `handleGlobalError` in QueryProvider.tsx:15-20 checks `error.isUnauthorized` and redirects via `window.location.href` with redirect-loop guard |
| 5 | 权限不足时（403），页面显示明确的"无权限"提示而非崩溃 | VERIFIED (human confirm recommended) | `handleGlobalError` in QueryProvider.tsx:23-30 calls `toast({ title: '权限不足', variant: 'destructive' })` |

**Score:** 5/5 criteria verified

### Observable Truths (from PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Any API request from a [tenantSlug] route includes X-Tenant-ID in the network panel | VERIFIED | `resolveTenantId()` with URL-slug-to-ID fallback wired at api.ts:103-106 |
| 2 | Submitting a form with invalid data shows specific backend validation field messages | VERIFIED | `Array.isArray(d.message)` check at api.ts:148 joins string[] with '; ' |
| 3 | After JWT expiry, any 401 causes browser redirect to /login | VERIFIED | `handleGlobalError` → `isUnauthorized` → `window.location.href` at QueryProvider.tsx:15-19 |
| 4 | Any 403 shows a '权限不足' toast notification instead of crashing | VERIFIED | `handleGlobalError` → `isForbidden` → `toast()` at QueryProvider.tsx:23-30 |
| 5 | All list/detail pages render data correctly — response unwrapping is consistent | VERIFIED | `'success' in data && 'data' in data` guard on both schema path (api.ts:171) and non-schema path (api.ts:178) |

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/src/lib/api.ts` | Core API client with tenant ID resolution and error formatting | VERIFIED | 277 lines; contains `resolveTenantId`, `extractMessage`, `APIError`, `api()`, all helper exports |
| `web/src/components/providers/QueryProvider.tsx` | React Query client with global 401/403 error handling | VERIFIED | 69 lines; contains `handleGlobalError`, attached to both query and mutation cache |

### Artifact Level Detail

**`web/src/lib/api.ts`**
- Level 1 (Exists): Yes — 277 lines
- Level 2 (Substantive): Yes — contains `resolveTenantId` (lines 45-78), `extractMessage` helper (145-153), `APIError` class with `isUnauthorized`/`isForbidden` getters (197-223), full `api()` function (81-194)
- Level 3 (Wired): Yes — imported and used by `api-hooks.ts`, `QueryProvider.tsx`, page components throughout the app

**`web/src/components/providers/QueryProvider.tsx`**
- Level 1 (Exists): Yes — 69 lines
- Level 2 (Substantive): Yes — `handleGlobalError` function defined (12-31), attached to `queryClient.getQueryCache().config.onError` and `queryClient.getMutationCache().config.onError` (61-62)
- Level 3 (Wired): Yes — imported and rendered in `web/src/app/layout.tsx` wrapping the entire app tree (lines 4, 20, 25)

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `api.ts resolveTenantId()` | `X-Tenant-ID` request header | `localStorage('tenant_id')` + URL slug + `tenantRoles` fallback | WIRED | api.ts:103-106: `resolvedTenantId` assigned to `headers['X-Tenant-ID']` |
| `api.ts error handler` | `APIError.message` | `Array.isArray(d.message)` joined as `'; '`-separated string | WIRED | api.ts:148: `d.message.join('; ')` confirmed present |
| `QueryProvider.tsx QueryClient` | `window.location.href = /login` | `getQueryCache().config.onError` when `error.status === 401` | WIRED | QueryProvider.tsx:61 sets cache onError; line 18 sets `window.location.href` |
| `QueryProvider.tsx QueryClient` | `toast()` call | `getMutationCache().config.onError` when `error.status === 403` | WIRED | QueryProvider.tsx:62 sets mutation cache onError; lines 24-29 call `toast()` |
| `QueryProvider` | App-wide coverage | Imported in `layout.tsx`, wraps all pages | WIRED | layout.tsx:4 imports, lines 20-25 wrap entire app subtree |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| API-01 | 01-01-PLAN.md | 所有租户作用域 API 调用均携带正确的 X-Tenant-ID 头 | SATISFIED | `resolveTenantId()` slug fallback in api.ts:55-74; `headers['X-Tenant-ID']` set at api.ts:105 |
| API-02 | 01-02-PLAN.md | 前端正确解包后端统一响应格式 `{ data, message, statusCode }` | SATISFIED | Both unwrap paths check `'success' in data && 'data' in data`; documented with TransformInterceptor comment block at api.ts:163-167 |
| API-03 | 01-01-PLAN.md | DTO 校验失败（400）的错误信息对用户可见 | SATISFIED | `extractMessage()` at api.ts:145-153 handles NestJS `string[]` format; `APIError.message` will contain joined field errors |
| API-04 | 01-02-PLAN.md | JWT 过期/401 响应自动跳转登录页 | SATISFIED | `handleGlobalError` checks `error.isUnauthorized` and sets `window.location.href` at QueryProvider.tsx:15-19 |
| API-05 | 01-02-PLAN.md | 403 权限不足有明确的用户提示 | SATISFIED | `handleGlobalError` checks `error.isForbidden` and calls `toast({ title: '权限不足', variant: 'destructive' })` at QueryProvider.tsx:23-30 |

**Orphaned requirements check:** No Phase 1 requirements appear in REQUIREMENTS.md that are unaccounted for by the two plans. All 5 IDs (API-01 through API-05) are claimed and verified.

**Note on REQUIREMENTS.md state:** The REQUIREMENTS.md traceability table marks API-02, API-04, API-05 as `[x]` (Complete) and API-01, API-03 as `[ ]` (Pending), but the code clearly implements all five. This is a documentation inconsistency in the requirements file — the implementation exists for all five.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No anti-patterns detected |

Scanned both modified files for: TODO/FIXME/XXX/HACK, placeholder returns (`return null`, `return {}`, `return []`), empty arrow functions, console.log-only implementations. None found.

## Human Verification Required

### 1. X-Tenant-ID Header in Network Panel

**Test:** Log in as a tenant user (e.g., tenant code "demo"), navigate to `/demo/admin/exams`, open DevTools Network tab, observe the first API request
**Expected:** Request headers include `X-Tenant-ID: <uuid>` with a valid non-null value matching the tenant's ID
**Why human:** `resolveTenantId()` reads from `localStorage` populated at login; confirming the correct UUID flows end-to-end requires a live browser session with real login state

### 2. Validation Error Display in Form

**Test:** Open an exam creation form, submit with all required fields blank
**Expected:** Error message visible on screen shows NestJS field errors like "name must not be empty; startDate must be a Date" (semicolon-separated)
**Why human:** While `extractMessage()` correctly joins the `string[]`, how the calling page surfaces `APIError.message` to the UI (toast, inline field error, alert) depends on each page's own error handling — cannot grep for all display sites reliably

### 3. 401 Auto-Redirect to Login

**Test:** Let the `auth-token` cookie expire (or clear it manually), then perform any API action on an authenticated page
**Expected:** Browser navigates to `/login?redirect=<encoded-current-path>` without a crash or frozen blank page
**Why human:** Requires an actually expired/absent JWT; token expiry cannot be simulated statically

### 4. 403 Toast Notification

**Test:** With a Candidate role, attempt to access an admin-only endpoint or page that triggers a 403 from the backend
**Expected:** Destructive toast with title "权限不足" appears in the top-right corner of the screen
**Why human:** Toast rendering requires the `<Toaster>` component to be mounted (it is, via layout.tsx) and a live browser to observe visual output; cannot grep for toast appearance

## Gaps Summary

No gaps. All five phase requirements (API-01 through API-05) are implemented with substantive, wired code. Both modified files (`web/src/lib/api.ts` and `web/src/components/providers/QueryProvider.tsx`) pass TypeScript type checking. All four committed hashes (5d917a6, 209a1dd, 9af2128, 207dac5) exist in git history. No stub patterns or placeholder implementations found.

Four items are flagged for human verification because they require a live browser session with real auth state. These are confidence-boosters, not blockers — the code correctly implements all behaviors.

---

_Verified: 2026-03-04T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
