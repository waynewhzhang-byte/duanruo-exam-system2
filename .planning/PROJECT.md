# 端若数智考盟 — 前端质量修复

## What This Is

多租户在线招录考试报名系统的前端质量修复项目。系统已基本完成开发，但 Next.js 14 前端存在大量运行时报错、功能未实现、以及前后端接口对接问题。此次工作目标是通过系统性排查和修复，使全部核心功能达到可用状态。

面向三类用户：候选人（报名/缴费/准考证）、租户管理员（考试管理/审核/座位）、超级管理员（平台租户管理）。

## Core Value

候选人能够完整完成"报名 → 提交资料 → 审核 → 缴费 → 获取准考证"全流程，管理员能够正常操作后台各功能模块——任何一个环节的崩溃都是不可接受的。

## Requirements

### Validated

<!-- 已存在于代码库，结构已实现 -->

- ✓ Schema-per-tenant 多租户 PostgreSQL 隔离架构 — existing
- ✓ JWT 认证 + 角色/权限守卫体系（SUPER_ADMIN / TENANT_ADMIN / CANDIDATE 等） — existing
- ✓ NestJS 后端模块：Exam / Application / Review / Payment / Ticket / Seating / Statistics / SuperAdmin — existing
- ✓ Next.js 14 App Router 路由结构（候选人端 / 管理员端 / 审核员 / 超管） — existing
- ✓ React Query + Axios API 客户端（含 X-Tenant-ID 头注入机制） — existing
- ✓ MinIO 文件存储（租户隔离 bucket） — existing
- ✓ shadcn/ui 组件体系 + Tailwind CSS — existing

### Active

<!-- 此次修复目标 -->

**一、管理员后台（最高优先级）**
- [ ] 租户管理员后台首次加载不报错，核心页面可正常渲染
- [ ] 考试列表/创建/编辑功能可用（含 DTO 字段与后端对齐）
- [ ] 审核列表（初审/复审）可正常加载和操作
- [ ] 统计报表页面数据正确展示
- [ ] 座位/场地管理功能可用

**二、候选人端**
- [ ] 考试报名表单可提交（含文件上传）
- [ ] 我的报名列表数据正确展示
- [ ] 准考证下载功能可用
- [ ] 缴费流程无报错

**三、审核员端**
- [ ] 初审/复审操作按钮可用，状态流转正常
- [ ] 审核详情页资料展示完整

**四、前后端接口对接（横切关注点）**
- [ ] 所有需要租户上下文的 API 调用均正确携带 X-Tenant-ID 头
- [ ] 前端统一处理后端 DTO 校验失败的错误响应（400/422）
- [ ] API 响应格式（`{ data, message, statusCode }` 包装层）被前端正确解包
- [ ] JWT 过期/未授权场景下前端正确跳转登录页

**五、超级管理员**
- [ ] 租户列表和创建功能可用
- [ ] 平台用户管理可用

### Out of Scope

- 新增业务功能 — 本次只修复，不扩展
- UI 视觉重设计 — 保持现有布局和组件结构
- 性能优化（缓存、懒加载等） — 功能正确优先
- 移动端适配 — 桌面端优先

## Context

- 后端 API 前缀：`/api/v1`，前端通过 Next.js rewrites 代理
- 租户上下文通过请求头 `X-Tenant-ID` 或 `X-Tenant-Slug` 传递，由 `TenantMiddleware` 解析
- 前端 `api.ts` 已有 Axios 拦截器骨架，但部分调用点未正确传递租户头
- 后端响应格式由 `TransformInterceptor` 统一包装，前端需针对此格式解包
- 现有 BDD/E2E 测试框架已搭建（Playwright + Cucumber），可作为验收基准

## Constraints

- **Tech Stack**: NestJS 11 + Next.js 14 + Prisma 6 + PostgreSQL — 不更换框架
- **UI 结构**: 保持现有组件和页面结构，只修复逻辑
- **前后端均可修改**: DTO、接口返回格式、前端调用均可调整，以功能可用为准
- **数据库**: Schema-per-tenant，Prisma 通过 `prismaService.client`（非 `this.prisma`）访问租户数据

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 前后端均可修改 | 部分问题根源在后端 DTO/接口，只改前端无法解决 | — Pending |
| 保持现有 UI 结构 | 避免引入视觉回归，聚焦逻辑修复 | — Pending |
| 以模块为单位逐步修复 | 管理员后台 → 候选人端 → 审核员，可控范围 | — Pending |

---
*Last updated: 2026-03-04 after initialization*
