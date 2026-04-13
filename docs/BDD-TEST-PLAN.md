# 端若数智考盟 — 前端 BDD 测试计划（全量覆盖）

> 版本: 1.0
> 生成日期: 2026-04-13
> 测试策略: Chrome DevTools Protocol + API 混合验证
> 前置文档: `docs/ARCHITECTURE-ANALYSIS.md`

---

## 一、测试策略总览

### 1.1 测试分层

| 层级 | 工具 | 侧重点 | 占比 |
|------|------|--------|------|
| L1 Chrome DevTools UI 验证 | CDP (Chrome DevTools Protocol) | 页面渲染、元素可见、交互行为、路由跳转 | 40% |
| L2 API 数据断言 | axios (现有 CustomWorld) | 接口数据正确性、状态流转、权限隔离 | 40% |
| L3 跨角色端到端流程 | CDP + API 组合 | 多角色协作、状态联动、数据一致性 | 20% |

### 1.2 Chrome DevTools Protocol 测试方式

通过 CDP 连接真实 Chrome 浏览器，使用 `Page.navigate`、`Runtime.evaluate`、`DOM.querySelector` 等协议命令进行 UI 交互验证，不依赖 Playwright，直接操控浏览器 DOM 和网络请求。

```typescript
// CDP World 基类扩展思路
interface CDPWorld {
  connect(url: string): Promise<void>;
  navigateTo(path: string): Promise<void>;
  fillInput(selector: string, value: string): Promise<void>;
  clickButton(selector: string): Promise<void>;
  selectOption(selector: string, value: string): Promise<void>;
  uploadFile(selector: string, filePath: string): Promise<void>;
  seeText(text: string): Promise<void>;
  seeElement(selector: string): Promise<void>;
  notSeeElement(selector: string): Promise<void>;
  getCurrentUrl(): Promise<string>;
  getPageTitle(): Promise<string>;
  waitForSelector(selector: string, timeout?: number): Promise<void>;
  waitForNavigation(timeout?: number): Promise<void>;
  interceptRequest(pattern: string): Promise<void>;
  getInterceptedResponse(): Promise<any>;
  takeScreenshot(name: string): Promise<Buffer>;
  getPageSource(): Promise<string>;
}
```

### 1.3 角色与测试账号

| 角色 | 用户名 | 密码 | 用途 |
|------|--------|------|------|
| SUPER_ADMIN | superadmin | superadmin123 | 平台管理、租户管理 |
| TENANT_ADMIN | admin | admin123 | 考试管理、审核配置、考场管理 |
| PRIMARY_REVIEWER | reviewer1 | reviewer123 | 一审操作 |
| SECONDARY_REVIEWER | reviewer2 | reviewer123 | 二审操作 |
| CANDIDATE | candidate1 | candidate123 | 报名、查看准考证、成绩 |
| CANDIDATE_ALT | candidate2 | candidate123 | 单人单岗限制验证 |

### 1.4 测试环境要求

- 前端 `localhost:3000` (Next.js)
- 后端 `localhost:8081` (NestJS)
- PostgreSQL 运行中，含种子数据
- MinIO 运行中
- Chrome 浏览器启用远程调试: `chrome --remote-debugging-port=9222`

---

## 二、Feature 文件组织结构

```
web/tests/bdd/features/
├── 00-cross-cutting/                    # 跨角色横切关注点
│   ├── 01-authentication.feature         # 认证与授权
│   ├── 02-tenant-isolation.feature       # 多租户隔离
│   ├── 03-role-permissions.feature       # 角色权限矩阵
│   └── 04-error-handling.feature         # 错误处理与边界
│
├── superadmin/                          # 超级管理员
│   ├── 01-tenant-management.feature      # 租户 CRUD (已有)
│   ├── 02-user-management.feature        # 用户管理 (已有)
│   ├── 03-tenant-schema.feature          # Schema 隔离 (已有)
│   ├── 04-platform-monitoring.feature    # 平台监控与统计 [新增]
│   └── 05-tenant-lifecycle.feature       # 租户全生命周期 [新增]
│
├── admin/                               # 租户管理员
│   ├── 01-exam-management.feature        # 考试 CRUD (已有)
│   ├── 02-application-management.feature # 报名管理 (已有)
│   ├── 03-reviewer-assignment.feature    # 审核员分配 (已有)
│   ├── 04-venue-room-management.feature  # 考场教室管理 [新增]
│   ├── 05-seat-assignment.feature        # 座位分配 [新增]
│   ├── 06-ticket-management.feature       # 准证管理 [新增]
│   ├── 07-score-management.feature        # 成绩管理 [新增]
│   ├── 08-statistics-analytics.feature    # 统计分析 [新增]
│   └── 09-notification-management.feature # 通知管理 [新增]
│
├── reviewer/                            # 审核员
│   ├── 01-review-queue.feature           # 审核队列 (已有)
│   ├── 02-review-operation.feature      # 审核操作 (已有)
│   ├── 03-secondary-review.feature      # 二审流程 (已有)
│   ├── 04-review-edge-cases.feature      # 审核边界情况 [新增]
│   └── 05-review-statistics.feature      # 审核统计 [新增]
│
├── candidate/                           # 考生
│   ├── 01-exam-registration.feature      # 报名流程 (已有)
│   ├── 02-document-upload.feature         # 文件上传 (已有)
│   ├── 03-application-status.feature    # 报名状态 (已有)
│   ├── 04-exam-ticket.feature            # 准考证 (已有)
│   ├── 05-payment.feature                # 支付 (已有)
│   ├── 06-score-query.feature             # 成绩查询 [新增]
│   └── 07-notification.feature           # 通知接收 [新增]
│
├── cross-role/                          # 跨角色端到端
│   ├── 01-recruitment-full-lifecycle.feature  # 全流程 (已有)
│   ├── 02-multi-tenant-registration.feature  # 多租户报名 [新增]
│   ├── 03-review-decision-cascade.feature     # 审核决策级联 [新增]
│   ├── 04-payment-to-ticket-flow.feature      # 支付到准考证 [新增]
│   └── 05-score-to-result-flow.feature        # 成绩到录用 [新增]
│
└── regression/                          # 回归测试
    ├── 01-concurrent-operations.feature  # 并发操作 [新增]
    ├── 02-data-consistency.feature        # 数据一致性 [新增]
    └── 03-recovery-scenarios.feature      # 恢复场景 [新增]
```

---

## 三、场景统计

| 分类 | Feature文件 | 场景数 | 优先级分布 |
|------|-------------|--------|-----------|
| **跨角色横切** | 4 | ~27 | P0:12, P1:12, P2:3 |
| **超级管理员** | 5 | ~17 | P0:4, P1:8, P2:5 |
| **租户管理员** | 9 | ~40 | P0:5, P1:20, P2:10, P3:5 |
| **审核员** | 5 | ~18 | P0:6, P1:8, P2:4 |
| **考生** | 7 | ~25 | P0:5, P1:8, P2:7, P3:5 |
| **跨角色E2E** | 5 | ~18 | P0:6, P1:8, P2:2, P3:2 |
| **回归** | 3 | ~8 | P2:6, P2:2 |
| **合计** | **38** | **~153** | **P0:38, P1:64, P2:38, P3:13** |

---

## 四、测试优先级与执行计划

### 4.1 优先级矩阵

| 优先级 | 标签 | 场景数 | 说明 |
|--------|------|--------|------|
| P0 (冒烟) | @p0 @smoke | 28 | 登录、核心流程、数据隔离、权限 |
| P1 (核心) | @p1 | 35 | 边界条件、支付、准考证、座位分配 |
| P2 (增强) | @p2 | 22 | 统计、通知、并发、数据一致性 |
| P3 (可选) | @p3 | 10 | 成绩管理、高级功能 |

### 4.2 执行顺序

| 阶段 | 内容 | 场景数 | 预估时间 |
|------|------|--------|---------|
| Phase 1 | @p0 + @smoke: 认证+核心流程+权限+隔离 | 28 | 30分钟 |
| Phase 2 | @p1: 边界条件+支付+准证+座位+生命周期 | 35 | 40分钟 |
| Phase 3 | @p2: 统计+通知+并发+一致性 | 22 | 25分钟 |
| Phase 4 | @p3: 成绩管理+高级功能 | 10 | 15分钟 |

### 4.3 Cucumber 执行命令

```bash
# 冒烟测试（P0）
cd web && npm run test:bdd:smoke

# P0 优先级
cd web && npm run test:bdd:p0

# P1 优先级
cd web && npm run test:bdd -- --tags "@p1"

# 跨角色端到端
cd web && npm run test:bdd -- --tags "@cross-role"

# 回归测试
cd web && npm run test:bdd -- --tags "@regression"

# 全量执行
cd web && npm run test:bdd
```

---

## 五、与现有测试的对照

### 5.1 已有覆盖（保留并增强）

| 已有 Feature | 状态 | 增强方向 |
|-------------|------|---------|
| `01-auth.feature` | ✅ 保留 | 合并到 `00-cross-cutting/01-authentication.feature`，增加CDP UI验证 |
| `02-candidate.feature` | ✅ 保留 | 已被 `candidate/01-07/` 更细化替代 |
| `03-admin.feature` | ✅ 保留 | 已被 `admin/01-09/` 更细化替代 |
| `04-reviewer.feature` | ✅ 保留 | 已被 `reviewer/01-05/` 更细化替代 |
| `05a-05e` 系列文件 | ✅ 保留 | 与新版 `admin/04-09` 对应，新版增加CDP验证 |
| `06-recruitment-full-lifecycle.feature` | ✅ 保留 | 被 `cross-role/01-05` 增强 |
| `superadmin/01-03` | ✅ 保留 | 增加 `04-05` 生命周期和监控 |
| `candidate/01-05` | ✅ 保留 | 增加 `06-07` 成绩和通知 |
| `admin/01-04` | ✅ 保留 | 增加 `05-09` 座位准证成绩等 |

### 5.2 新增 Feature（共22个）

| 新增 Feature | 分类 |
|-------------|------|
| `00-cross-cutting/01-authentication.feature` | 跨角色 |
| `00-cross-cutting/02-tenant-isolation.feature` | 跨角色 |
| `00-cross-cutting/03-role-permissions.feature` | 跨角色 |
| `00-cross-cutting/04-error-handling.feature` | 跨角色 |
| `superadmin/04-platform-monitoring.feature` | 超管 |
| `superadmin/05-tenant-lifecycle.feature` | 超管 |
| `admin/04-venue-room-management.feature` | 管理员 |
| `admin/05-seat-assignment.feature` | 管理员 |
| `admin/06-ticket-management.feature` | 管理员 |
| `admin/07-score-management.feature` | 管理员 |
| `admin/08-statistics-analytics.feature` | 管理员 |
| `admin/09-notification-management.feature` | 管理员 |
| `reviewer/04-review-edge-cases.feature` | 审核员 |
| `reviewer/05-review-statistics.feature` | 审核员 |
| `candidate/06-score-query.feature` | 考生 |
| `candidate/07-notification.feature` | 考生 |
| `cross-role/02-multi-tenant-registration.feature` | 跨角色 |
| `cross-role/03-review-decision-cascade.feature` | 跨角色 |
| `cross-role/04-payment-to-ticket-flow.feature` | 跨角色 |
| `cross-role/05-score-to-result-flow.feature` | 跨角色 |
| `regression/01-concurrent-operations.feature` | 回归 |
| `regression/02-data-consistency.feature` | 回归 |
| `regression/03-recovery-scenarios.feature` | 回归 |

---

## 六、Step Definitions 组织

```
web/tests/bdd/step-definitions/
├── world.ts                          # 已有 - CustomWorld 基类
├── cdp-world.ts                       # 新增 - CDP Chrome DevTools World 扩展
├── auth.steps.ts                      # 已有 - 增强
├── candidate.steps.ts                 # 已有 - 增强CDP
├── admin.steps.ts                     # 已有 - 增强CDP
├── reviewer.steps.ts                  # 已有 - 增强CDP
├── superadmin-tenant.steps.ts         # 已有
├── superadmin-tenant-schema.steps.ts  # 已有
├── tenant-admin-exam-api.steps.ts     # 已有
├── ticket-seating-platform.steps.ts   # 已有 - 增强CDP
├── score-management.steps.ts           # 新增 - 成绩管理
├── notification.steps.ts              # 新增 - 通知
├── cross-role.steps.ts                # 新增 - 跨角色端到端
├── error-handling.steps.ts            # 新增 - 错误处理
├── role-permissions.steps.ts          # 新增 - 权限矩阵
├── regression-steps.ts                # 新增 - 回归测试
└── common-ui.steps.ts                 # 新增 - CDP 通用UI步骤
```

---

*文档结束*