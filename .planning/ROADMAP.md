# Roadmap: 端若数智考盟前端质量修复

## Overview

这是一个修复项目，而非新建项目。后端已基本可用，前端存在运行时报错、接口对接缺陷和功能未实现的问题。修复路径从底层 API 层开始，向上推进到各角色功能模块，确保每个阶段完成后对应角色的用户可以完整操作。顺序：API 基础层 → 管理员后台 → 候选人端 → 审核员端 → 超级管理员。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: API Foundation** - 修复前后端接口对接的横切问题，使所有 API 调用可靠工作
- [x] **Phase 2: Admin Backend** - 修复租户管理员后台全部核心功能模块 (completed 2026-03-04)
- [ ] **Phase 3: Candidate Portal** - 修复候选人完整报名流程（报名→缴费→准考证）
- [ ] **Phase 4: Reviewer Workflow** - 修复审核员端审核操作和详情展示
- [ ] **Phase 5: Super Admin** - 修复超级管理员平台管理功能

## Phase Details

### Phase 1: API Foundation
**Goal**: 前端所有 API 调用能可靠地携带正确上下文，并正确处理所有响应和错误场景
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04, API-05
**Success Criteria** (what must be TRUE):
  1. 任意需要租户上下文的 API 请求，网络面板中可见 X-Tenant-ID 请求头且值正确
  2. 所有列表/详情页面数据正常渲染，不因响应格式解包失败而显示空白或报错
  3. 提交含错误数据的表单时，页面显示后端返回的具体字段校验错误信息
  4. 在令牌过期后操作任意页面，浏览器自动跳转到登录页而非停留在报错状态
  5. 权限不足时（403），页面显示明确的"无权限"提示而非崩溃
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Fix X-Tenant-ID resolution (URL slug fallback) and 400 validation error message formatting
- [ ] 01-02-PLAN.md — Add global 401 redirect + 403 toast to QueryProvider; verify response unwrapping

### Phase 2: Admin Backend
**Goal**: 租户管理员可以在后台正常完成考试管理、审核列表查看、统计查看和场地管理的全部日常操作
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07
**Success Criteria** (what must be TRUE):
  1. 管理员登录后进入后台首页，控制台无 JS 运行时错误
  2. 考试列表页正确显示考试数据；创建/编辑考试表单填写完成后可成功提交
  3. 初审和复审申请列表各自正确加载申请数据，并可对申请执行通过/拒绝操作且状态更新
  4. 统计报表页面显示正确的数字和图表数据，不为空白或加载失败
  5. 场地和座位管理页面可以查看、添加和操作场地/座位数据
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Fix ExamResponse schema (add examStart/examEnd), fix exam list pagination field names, fix exam detail/edit page field name mismatches
- [ ] 02-02-PLAN.md — Rewrite ReviewsPageClient to use correct review queue and batch-decide API endpoints with tenant context
- [ ] 02-03-PLAN.md — Fix score-statistics page to use apiGetWithTenant for all API calls
- [ ] 02-04-PLAN.md — Fix venue page exam status badge labels; confirm backend mapToResponse completeness

### Phase 3: Candidate Portal
**Goal**: 候选人可以完整完成"找到考试 → 提交报名 → 缴费 → 下载准考证"的端到端流程
**Depends on**: Phase 1
**Requirements**: CAND-01, CAND-02, CAND-03, CAND-04
**Success Criteria** (what must be TRUE):
  1. 候选人填写报名表单并上传文件后点击提交，报名成功且不报错
  2. "我的报名"列表显示正确的申请状态（草稿/已提交/审核中/已通过等）和相关信息
  3. 审核通过且缴费完成的候选人可点击按钮下载准考证 PDF/图片，下载成功
  4. 候选人进入缴费页面并完成缴费操作，全程无报错且缴费状态正确更新
**Plans**: TBD

### Phase 4: Reviewer Workflow
**Goal**: 审核员可以查看分配给自己的申请列表，完整查看申请详情，并执行审核操作
**Depends on**: Phase 2
**Requirements**: REVW-01, REVW-02, REVW-03
**Success Criteria** (what must be TRUE):
  1. 审核员登录后，审核列表正确加载分配给当前角色（初审/复审）的申请数据
  2. 点击任意申请进入详情页，候选人的全部资料（文件、表单信息）完整展示
  3. 通过/退回/要求补材料按钮可点击，操作执行后申请状态正确流转并在列表中更新
**Plans**: TBD

### Phase 5: Super Admin
**Goal**: 超级管理员可以在平台层面管理租户（查看、创建）和平台用户
**Depends on**: Phase 1
**Requirements**: SADM-01, SADM-02, SADM-03
**Success Criteria** (what must be TRUE):
  1. 超管进入租户列表页，已有租户数据正确显示
  2. 超管通过创建租户表单完整填写信息并提交，新租户成功创建并出现在列表中
  3. 超管进入平台用户管理页，用户列表正确加载并可执行基本管理操作
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

Note: Phase 3 and Phase 5 both depend only on Phase 1, so they can be executed in parallel after Phase 1 is complete. Phase 4 depends on Phase 2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. API Foundation | 1/2 | In progress | - |
| 2. Admin Backend | 4/4 | Complete   | 2026-03-04 |
| 3. Candidate Portal | 0/TBD | Not started | - |
| 4. Reviewer Workflow | 0/TBD | Not started | - |
| 5. Super Admin | 0/TBD | Not started | - |
