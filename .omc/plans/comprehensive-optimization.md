# 端若数智考盟 - 全面深度优化计划

> 优先级：安全 → 仓库整洁 → 依赖修复 → 测试补全 → 性能优化

## 需求摘要

对项目进行全面深度优化，覆盖安全加固、仓库清理、依赖修复、测试补全和性能优化五个方向，按安全优先顺序执行。

---

## 阶段一：安全加固 (P0)

### 1.1 修复 SQL 注入风险面

**问题：** `tenant.service.ts` 和 `tenant-schema-migration.service.ts` 中共 18 处 `$queryRawUnsafe`/`$executeRawUnsafe` 使用字符串拼接 SQL，应改为参数化查询。

**文件与行号：**
- `server/src/tenant/tenant.service.ts:64-65, 106-107, 148-152, 162-164, 169-172, 177-179, 201-206`
- `server/src/tenant/tenant-schema-migration.service.ts:61,67,81,102,109,129,144,166,182,189,204`

**验收标准：**
- [ ] 所有 `$queryRawUnsafe`/`$executeRawUnsafe` 改用 Prisma `$queryRaw`/`$executeRaw` 标签模板或参数化查询（`$1`, `$2`）
- [ ] 对于 schema/table 名称（不能用参数化的标识符），使用 `pg.escapeIdentifier()` 或白名单校验
- [ ] 无字符串拼接 SQL 残留（grep 验证）

### 1.2 移除 JWT 在 localStorage 中的存储

**问题：** `web/src/lib/api.ts:21-47` 将 JWT 存储在 localStorage（XSS 攻击面），应仅使用 HttpOnly Cookie。

**文件与行号：**
- `web/src/lib/api.ts:30-46`（resolveAuthToken 函数）
- `web/src/lib/api.ts:81`（localStorage.setItem）

**验收标准：**
- [ ] Token 仅从 HttpOnly Cookie 读取，移除 localStorage/sessionStorage 回退
- [ ] API 请求携带 Cookie（`withCredentials: true`）而非手动 Authorization header
- [ ] 后端设置 HttpOnly + Secure + SameSite=Strict 的 Cookie

### 1.3 保护 .env 文件

**问题：** `server/.env` 包含明文密码和密钥（数据库密码 line 2, JWT secret line 5, MinIO keys lines 11-12）。

**验收标准：**
- [ ] 创建 `server/.env.example` 仅包含占位符值
- [ ] 确认 `server/.env` 在 `.gitignore` 中且不被 git 追踪（已确认）
- [ ] 审计 git 历史，确认密钥未曾被提交（如已被提交，轮换所有密钥）
- [ ] 文档中说明使用环境变量或密钥管理服务

### 1.4 修复 PrismaService publicClient 语义

**问题：** `server/src/prisma/prisma.service.ts:74-80` — `client` 和 `publicClient` getter 返回相同的 `this`，无法区分租户和公共 schema 查询。

**验收标准：**
- [ ] `publicClient` 使用独立的 PrismaClient 实例（连接 public schema）
- [ ] 或明确移除 `publicClient`，改用显式的 schema 参数模式
- [ ] 所有使用 `this.prisma.publicClient` 的调用方更新

---

## 阶段二：仓库整洁 (P0)

### 2.1 清理根目录调试文件

**问题：** 15+ 调试/工件文件被 git 追踪。

**需删除的文件：**
- 根目录：`debug-login.js`, `debug-login.ps1`, `debug-tenant-admin.js`, `diagnose-auth-issue.js`, `bdd-test-execution.js`, `assign-role.js`
- 根目录：`chrome-console.jpg`, `ticket_aa33f18c-*.pdf`, `build-output.txt`, `compile-warnings.txt`, `login.json`, `mappings.json`, `tenant_code.txt`, `tenant_id.txt`, `openapi.json`, `api-docs.json`
- `web/`: `token.txt`, `ts_errors.txt`, `ts_errors_final.txt`, `type_errors_new.txt`, `debug-logic.js`, `force-fix-exam-form.js`, `run-chrome-devtools-test.js`, `tenant-admin-users-audit.js`, `ui-diagnostic.js`, `ui-diagnostic-fixed.js`, `verify-pages.js`, `test-backend-api.js`, `scene-1-loaded.jpg`, `audit-1-page-load.jpg`
- `web-bundles/` 目录（40+ agent/team .txt 文件）

**验收标准：**
- [ ] 所有调试文件从 git 删除并加入 `.gitignore`
- [ ] 有用的脚本移至 `scripts/` 目录（如 `assign-role.js`）
- [ ] `git status` 不显示不应追踪的文件

### 2.2 替换过期 Dockerfile

**问题：** `Dockerfile` 是 Java/Spring Boot 的（eclipse-temurin:21-jdk-alpine, Maven），与 NestJS 项目完全无关。

**验收标准：**
- [ ] 创建 NestJS 多阶段 Dockerfile（builder → runner）
- [ ] 创建 Next.js Dockerfile 或在 docker-compose 中包含
- [ ] 创建 `docker-compose.yml`（PostgreSQL + MinIO + Redis + server + web）
- [ ] 删除旧 Java Dockerfile

### 2.3 增强前端 ESLint 配置

**问题：** `web/.eslintrc.json` 仅有 `next/core-web-vitals`，无 TypeScript 规则。

**验收标准：**
- [ ] 添加 `@typescript-eslint` 插件及严格规则（与后端对齐）
- [ ] 添加 `eslint-plugin-import` 排序规则
- [ ] 将 eslint/eslint-config-next 移至 `devDependencies`
- [ ] `npm run lint` 通过

---

## 阶段三：依赖修复 (P0)

### 3.1 修复 Jest / ts-jest 版本不匹配

**问题：** `server/package.json:73` jest@^30.0.0 与 `server/package.json:78` ts-jest@^29.2.5 不兼容。

**验收标准：**
- [ ] 将 ts-jest 升级至 ^30.0.0（匹配 Jest 30）
- [ ] 或将 Jest 降级至 ^29.0.0（匹配 ts-jest 29）
- [ ] `npm test` 在 server/ 中可以正常运行

### 3.2 升级 date-fns

**问题：** `web/package.json:105` date-fns@^2.30.0 过时。

**验收标准：**
- [ ] 升级 date-fns 至 v4
- [ ] 修复所有 API 破坏性变更（v2→v4 有多处签名变化）
- [ ] 前端构建通过，日期功能正常

---

## 阶段四：测试补全 (P1)

### 4.1 补全后端核心服务单元测试（第一批）

**缺失测试的高优先级服务：**

| 文件 | 行数 | 优先级理由 |
|------|------|------------|
| `tenant/tenant.service.ts` | 224 | 多租户核心，SQL安全关键 |
| `tenant/tenant-schema-migration.service.ts` | 214 | Schema迁移，SQL安全关键 |
| `review/review.service.ts` | 544 | 审核核心业务逻辑 |
| `ticket/ticket.service.ts` | 725 | 准考证核心，复杂逻辑 |
| `seating/seating.service.ts` | 708 | 座位分配核心 |

**验收标准：**
- [ ] 每个服务有对应 `.spec.ts` 文件
- [ ] 核心方法测试覆盖率 > 70%
- [ ] Mock PrismaService 依赖
- [ ] `npm test` 全部通过

### 4.2 补全后端核心服务单元测试（第二批）

| 文件 | 行数 | 优先级理由 |
|------|------|------------|
| `payment/payment.service.ts` | 278 | 支付流程 |
| `statistics/statistics.service.ts` | — | 数据统计 |
| `super-admin/super-admin.service.ts` | — | 超级管理 |
| `common/pii/pii.service.ts` | — | PII处理 |
| `common/security/security.service.ts` | — | 安全服务 |
| `scheduler/exam-scheduler.service.ts` | — | 定时任务 |

**验收标准：**
- [ ] 上述每个服务有 `.spec.ts` 文件
- [ ] 核心路径测试覆盖率 > 60%
- [ ] `npm test` 全部通过

### 4.3 创建 E2E 测试骨架

**问题：** `web/tests/e2e/` 目录不存在，零 Playwright 测试。

**验收标准：**
- [ ] 创建 `web/tests/e2e/` 目录
- [ ] 编写关键路径 E2E 测试：登录流程、考试列表、报名提交
- [ ] `npx playwright test` 可以运行

---

## 阶段五：性能优化 (P1)

### 5.1 系统化 Redis 缓存

**问题：** Redis 缓存仅用于 TenantMiddleware schema 解析，考试/报名/统计等高频查询无缓存。

**验收标准：**
- [ ] 考试列表查询添加缓存（TTL 5min，写入时失效）
- [ ] 统计查询添加缓存（TTL 60s，写入时失效）
- [ ] 公共 schema 查询（租户列表）添加缓存
- [ ] 缓存失效策略：写入操作时主动清除相关缓存 key

### 5.2 标准化分页

**问题：** 分页实现不一致 — 部分用 `PaginationHelper`，部分用手动 skip/take，部分无分页。

**问题文件：**
- `ticket.service.ts:595-611` — `listTicketsForExam` 无分页
- `seating.service.ts:212-263` — `listAssignments`/`listVenues` 无分页
- `review.service.ts:337-473` — 使用原始 SQL LIMIT/OFFSET

**验收标准：**
- [ ] 所有列表 API 使用 `PaginationHelper.createResponse` 统一分页
- [ ] `review.service` 原始 SQL 分页改为 Prisma 分页
- [ ] `listTicketsForExam`、`listAssignments`、`listVenues` 添加分页参数

### 5.3 Next.js 构建优化

**问题：** `web/next.config.js` 无性能配置。

**验收标准：**
- [ ] 添加 `output: 'standalone'` 用于 Docker 部署
- [ ] 添加 `images.remotePatterns` 配置
- [ ] 添加 `compiler.removeConsole` 生产构建优化
- [ ] 配置关键页面的 `generateStaticParams`

### 5.4 大型服务文件拆分

**问题：** `ticket.service.ts`(725行) 和 `seating.service.ts`(708行) 过大。

**验收标准：**
- [ ] `ticket.service.ts` 拆分为：`ticket-generation.service.ts`(生成逻辑)、`ticket-query.service.ts`(查询逻辑)、`ticket-number.service.ts`(编号逻辑)
- [ ] `seating.service.ts` 拆分为：`venue.service.ts`(场地管理)、`seat-allocation.service.ts`(座位分配)
- [ ] 原有模块仍通过 NestJS provider 导出拆分后的子服务
- [ ] 所有现有测试继续通过

---

## 风险与缓解

| 风险 | 缓解策略 |
|------|----------|
| SQL 参数化改造可能破坏租户 schema 初始化 | 逐个方法改造，每个方法改造后运行集成测试验证 schema 创建/迁移 |
| date-fns v2→v4 升级可能有大量 API 变更 | 使用 `npx date-fns-upgrade` 工具自动迁移，然后手动 review |
| JWT 从 localStorage 迁移到 Cookie 可能影响前端登录流程 | 后端先添加 Cookie 支持（不删除 header 方式），前端切换后再移除 header 回退 |
| 服务文件拆分可能影响依赖注入 | 保持原 Service 类作为 facade，逐步迁移方法到子服务 |
| Jest/ts-jest 升级可能需要更新 jest.config | 先在 CI 隔离环境验证，确认本地和 CI 均通过后再合并 |

## 验证步骤

1. **阶段一完成后：** 运行 `npm test`，grep 验证无 `$queryRawUnsafe` 字符串拼接残留
2. **阶段二完成后：** `git status` 干净，`npm run lint` 通过（前后端），Docker 构建成功
3. **阶段三完成后：** `npm test`（server）和 `npm run build`（web）通过
4. **阶段四完成后：** 后端测试覆盖率 > 50%，E2E 骨架测试可运行
5. **阶段五完成后：** Redis 缓存命中率可观测，分页 API 统一，Next.js 生产构建体积缩小

---

## ADR: 架构决策记录

**决策：** 按安全优先顺序执行，先修安全风险再优化性能  
**驱动因素：** 安全漏洞（SQL注入面、XSS攻击面）比性能问题更紧迫  
**备选方案：** 1) 性能优先（用户感知快但安全风险持续）、2) 并行执行（上下文切换成本高）  
**选择理由：** 安全问题可能被攻击利用，且部分安全修复（如SQL参数化）是后续测试和缓存优化的前置条件  
**后果：** 前两周主要做安全加固，不会立即改善用户体验  
**后续：** 阶段五完成后可考虑数据库连接池优化、CDN 配置、SSR 缓存等进一步优化