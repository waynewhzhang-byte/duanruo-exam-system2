# 端若数智考盟 — 需求与核心架构分析

> 版本: 1.0
> 生成日期: 2026-04-13
> 文档类型: 项目架构分析文档（后续开发基础参考）

---

## 一、产品定位

**考试报名管理平台**（非在线答题系统）。核心价值链：

```
考试发布 → 考生报名 → 资料审核 → 准考证发放 → 座位分配 → 成绩管理
```

考生线下赴考，系统只管报名和审核流程，不涉及在线答题。

| 对比项 | 本项目（报名管理系统） | 在线考试平台 |
|--------|----------------------|-------------|
| 核心功能 | 收集报名信息、审核、发放准考证 | 在线答题、自动判卷、实时监考 |
| 考生操作 | 填表、上传资料、缴费、打印准考证 | 在线作答、提交试卷 |
| 考试形式 | 线下考试 | 在线考试 |
| 数据重点 | 个人信息、证件照、报名表 | 试题、答案、成绩 |
| 审核工作流 | 复杂的多级审核 | 不需要 |

---

## 二、核心业务需求（6大领域）

| 领域 | 核心能力 | 优先级 |
|------|---------|--------|
| **多租户管理** | 租户CRUD、自动创建PG schema + MinIO bucket、数据完全隔离 | P0 |
| **考试与报名** | 考试CRUD、岗位管理、动态表单、草稿保存、文件上传、一人一岗限制 | P0 |
| **审核工作流** | 双级人工审核（一审→二审）、自动审核规则、任务拉取+锁定(10min)、审核记录 | P0 |
| **支付与准考证** | 支付宝/微信支付集成、Mock支付、准考证号生成规则、PDF生成、二维码 | P1 |
| **考场座位** | 考场/教室管理、自动座位分配（3种策略）、手动调整 | P1 |
| **成绩管理** | CSV导入、面试成绩录入、及格判定、最终录用状态 | P3 |

---

## 三、报名状态机（核心业务流程）

```
                         ┌─────────────────────┐
                         │      DRAFT           │
                         │     (草稿)            │
                         └──────────┬──────────┘
                                    │ 提交
                                    ▼
                         ┌─────────────────────┐
                         │    SUBMITTED        │
                         │    (已提交)           │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   PAID          │   │ PENDING_PRIMARY │   │   AUTO_REJECTED │
    │  (已支付)       │   │   _REVIEW       │   │   (自动拒绝)     │
    └────────┬────────┘   └────────┬────────┘   └─────────────────┘
             │                      │
             │              ┌───────┴───────┐
             │              │               │
             ▼              ▼               ▼
    ┌─────────────────┐ ┌─────────┐ ┌──────────────┐
    │ PENDING_PRIMARY │ │PRIMARY_ │ │ PRIMARY_     │
    │    _REVIEW      │ │ PASSED  │ │ REJECTED     │
    └─────────────────┘ └────┬────┘ └──────────────┘
                             │
                             │ (自动进入二审)
                             ▼
                    ┌─────────────────┐
                    │ PENDING_SECONDARY│
                    │    _REVIEW      │
                    └────────┬────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
               ▼                           ▼
      ┌─────────────────┐         ┌─────────────────┐
      │    APPROVED    │         │ SECONDARY_      │
      │  (审核通过)    │         │ REJECTED        │
      └────────┬────────┘         │ (二审拒绝)      │
               │                  └─────────────────┘
               ▼
      ┌─────────────────┐
      │  TICKET_ISSUED  │
      │ (准考证已发放)   │
      └─────────────────┘
```

### 关键状态约束

- **一人一岗**：同一考试同一考生只能报一个岗位
- **审核必须按顺序**：一审通过才能进入二审
- **任务锁定**：审核员拉取任务后锁定10分钟，防止重复审核
- **支付前提**：收费考试需先支付才能进入下一环节

---

## 四、用户角色体系

### 4.1 角色定义

| 角色 | 作用域 | 核心权限 |
|------|--------|---------|
| `SUPER_ADMIN` | 平台级 | 创建/管理租户、监控平台、访问所有租户数据 |
| `TENANT_ADMIN` | 租户级 | 本租户全部管理权限（考试、岗位、审核配置等） |
| `OPERATOR` | 租户级 | 考场管理、座位安排 |
| `PRIMARY_REVIEWER` | 租户级 | 一审任务 |
| `SECONDARY_REVIEWER` | 租户级 | 二审任务 |
| `CANDIDATE` | 跨租户 | 报名、查看准考证、查看成绩 |

### 4.2 单一账户多租户

一个 `User` 可在多个 `Tenant` 下拥有不同角色，通过 `UserTenantRole` 关联表实现：

```
User (id: user-001)
  ├── Tenant A → TENANT_ADMIN
  ├── Tenant B → PRIMARY_REVIEWER
  └── Tenant C → CANDIDATE
```

---

## 五、核心架构

### 5.1 技术栈

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 后端框架 | NestJS | 11 |
| 前端框架 | Next.js (App Router) | 14 |
| 编程语言 | TypeScript | 5.x |
| 数据库 | PostgreSQL | 15+ |
| ORM | Prisma | 6 |
| 对象存储 | MinIO (S3兼容) | 最新 |
| UI组件库 | shadcn/ui + Radix + Tailwind CSS | 最新 |
| 认证 | JWT (Passport) | - |
| 缓存 | Redis (cache-manager-redis-yet) | - |
| 后端测试 | Jest | 30 |
| 前端测试 | Playwright + Cucumber BDD | - |

### 5.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户层                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  超级管理员  │  │  租户管理员  │  │   审核员    │  │    考生     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼───────────────┼───────────────┼───────────────┼─────────────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           前端层 (Next.js)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js App Router                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │   │
│  │  │ /super-admin │ │ /admin      │ │ /reviewer   │ │ /candidate  │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Middleware │  │  API Client │  │ React Query │  │ Auth Context│     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                              │
                                              ▼ (HTTP + JWT)
┌─────────────────────────────────────────────────────────────────────────────┐
│                           后端层 (NestJS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Global Prefix: /api/v1                            │   │
│  │              ThrottlerGuard (3/s, 20/10s, 100/min)                  │   │
│  │              TenantMiddleware (X-Tenant-ID)                         │   │
│  │              RequestIdMiddleware                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Auth     │ │  Tenant  │ │   Exam   │ │Application│ │  Review  │       │
│  │  Module   │ │  Module  │ │  Module  │ │  Module  │ │  Module  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Payment  │ │  Ticket  │ │  Seating │ │   File   │ │Statistics│       │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  Prisma  │ │  Tenant  │ │ Scheduler│ │ SuperAdmin│                    │
│  │  Service │ │Middleware │ │  Module  │ │  Module  │                    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                              │
          ┌──────────────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   PostgreSQL       │    │      MinIO         │    │    External        │
│   (主数据库)       │    │   (文件存储)        │    │    (支付网关)       │
│                    │    │                    │    │                    │
│ ┌───────────────┐  │    │ ┌───────────────┐  │    │ ┌───────────────┐  │
│ │ public schema │  │    │ │ tenant-bucket │  │    │ │   支付宝/微信   │  │
│ │ (平台数据)    │  │    │ │     -files    │  │    │ └───────────────┘  │
│ └───────────────┘  │    │ └───────────────┘  │    └─────────────────────┘
│ ┌───────────────┐  │    └─────────────────────┘                         │
│ │tenant_xxx    │  │                                                   │
│ │ (租户数据)   │  │                                                   │
│ └───────────────┘  │                                                   │
└─────────────────────┘                                                   │
```

### 5.3 多租户架构：Schema-per-Tenant

```
PostgreSQL 数据库实例
│
├── public (平台级 Schema)
│   ├── users              # 全局用户账户
│   ├── user_profiles      # 用户扩展资料
│   ├── tenants            # 租户注册信息
│   ├── user_tenant_roles  # 用户-租户-角色关联
│   ├── security_audit_logs # 安全审计日志
│   └── notifications      # 通知记录
│
├── tenant_company001 (租户A)
│   ├── exams              # 考试
│   ├── positions          # 岗位
│   ├── subjects           # 科目
│   ├── applications       # 报名
│   ├── application_audit_logs # 报名状态审计
│   ├── review_tasks       # 审核任务
│   ├── reviews            # 审核记录
│   ├── exam_reviewers     # 考试审核员配置
│   ├── tickets            # 准考证
│   ├── ticket_number_rules # 准考证号规则
│   ├── ticket_sequences   # 准考证序列号
│   ├── venues             # 考场
│   ├── rooms              # 教室
│   ├── seat_assignments   # 座位分配
│   ├── allocation_batches # 座位分配批次
│   ├── payment_orders     # 支付订单
│   ├── files              # 文件元数据
│   └── exam_scores        # 成绩
│
└── tenant_company002 (租户B)
    └── ... (同上)
```

### 5.4 租户隔离请求流程

```
1. 请求进入 → RequestIdMiddleware 注入请求ID
2.           → TenantMiddleware 拦截
3. 提取请求头 X-Tenant-ID 或 X-Tenant-Slug
4. 查询 tenants 表获取 schemaName
5. 将 tenantId 存入 AsyncLocalStorage
6. PrismaService 执行查询时自动设置 search_path: "tenant_{code}", public
7. 查询在正确的租户 schema 中执行
8. 响应返回
```

**文件存储隔离**：
- 每租户独立 MinIO bucket：`tenant-{code}-files`
- 文件按租户隔离，无法跨租户访问
- 文件带病毒扫描状态追踪（PENDING → SCANNING → CLEAN/INFECTED）

---

## 六、后端模块架构（NestJS）

### 6.1 模块总览

| 模块 | 职责 | 关键文件 |
|------|------|---------|
| `AuthModule` | JWT认证、角色权限守卫、租户守卫 | `auth.service.ts`, `jwt.strategy.ts`, `permissions.guard.ts`, `tenant.guard.ts` |
| `TenantModule` | 租户CRUD、Schema自动创建、Bucket创建、租户中间件 | `tenant.service.ts`, `tenant.middleware.ts`, `tenant-schema-migration.service.ts`, `tenant-bucket.service.ts` |
| `ExamModule` | 考试/岗位/科目CRUD、表单模板管理、成绩管理 | `exam.service.ts`, `position.service.ts`, `score.service.ts`, `form-template.controller.ts`, `published-exam.controller.ts` |
| `ApplicationModule` | 报名提交、状态流转、草稿管理 | `application.service.ts`, `application.controller.ts` |
| `ReviewModule` | 审核队列、任务拉取/锁定、自动审核规则 | `review.service.ts`, `auto-review.service.ts` |
| `PaymentModule` | 支付订单、Mock支付网关、回调处理 | `payment.service.ts`, `mock-gateway.service.ts`, `mock-gateway.controller.ts` |
| `TicketModule` | 准考证生成、号码规则、PDF | `ticket.service.ts`, `ticket.controller.ts` |
| `SeatingModule` | 考场教室管理、座位分配策略 | `seating.service.ts`, `seating.controller.ts` |
| `FileModule` | MinIO文件上传/下载、病毒扫描追踪 | `file/` |
| `StatisticsModule` | 数据统计报表 | `statistics/` |
| `SchedulerModule` | 定时任务（订单超时等） | `scheduler/` |
| `SuperAdminModule` | 平台级管理 | `super-admin/` |
| `NotificationModule` | 通知（邮件/短信/站内信） | `common/notification/` |

### 6.2 中间件与守卫链

```
请求 → RequestIdMiddleware → TenantMiddleware → ThrottlerGuard
     → JwtAuthGuard → PermissionsGuard → TenantGuard → Controller
```

- **TenantMiddleware**：排除 `/auth/login` 和 `/auth/register`，其余路由均需租户上下文
- **ThrottlerGuard**：三级限流（short: 3/s, medium: 20/10s, long: 100/min）
- **PermissionsGuard**：基于 `@Permissions()` 装饰器，细粒度权限控制
- **TenantGuard**：验证请求的租户与 Token 中的租户一致

---

## 七、数据模型详解

### 7.1 Public Schema（全局数据）

| 模型 | 说明 | 关键字段 |
|------|------|---------|
| `User` | 全局用户 | username, email, passwordHash, fullName, phoneNumber, roles(JSON) |
| `UserProfile` | 用户扩展资料 | gender, birthDate, idNumber(加密), education, major, university, photo |
| `Tenant` | 租户 | name, code(unique), schemaName(unique), status(PENDING/ACTIVE/...) |
| `UserTenantRole` | 用户-租户-角色 | userId, tenantId, role, active, grantedAt, revokedAt |
| `SecurityAuditLog` | 安全审计 | action, resource, resourceId, ipAddress, userAgent, success |
| `Notification` | 通知记录 | type, title, content, channel(EMAIL/SMS/SYSTEM), status, relatedId |

### 7.2 Tenant Schema（租户业务数据）

| 模型 | 说明 | 关键字段 |
|------|------|---------|
| `Exam` | 考试 | code(unique), title, registrationStart/End, examStart/End, feeRequired, feeAmount, formTemplate(JSONB), status |
| `Position` | 岗位 | examId, code, title, quota, rulesConfig(JSONB) |
| `Subject` | 考试科目 | positionId, name, type(WRITTEN/INTERVIEW/PRACTICAL), maxScore, passingScore, weight |
| `Application` | 报名 | candidateId, examId, positionId, payload(JSONB), status, formVersion, totalWrittenScore, writtenPassStatus, interviewEligibility, finalResult |
| `ApplicationAuditLog` | 报名审计 | applicationId, fromStatus, toStatus, actor, reason |
| `ReviewTask` | 审核任务 | applicationId, stage(PRIMARY/SECONDARY), status(OPEN/ASSIGNED/COMPLETED/CANCELLED), assignedTo, lockedAt, lastHeartbeatAt |
| `Review` | 审核记录 | applicationId, stage, reviewerId, decision(APPROVED/REJECTED/PENDING/RETURNED), comment |
| `ExamReviewer` | 考试审核员 | examId, reviewerId, stage |
| `PaymentOrder` | 支付订单 | applicationId, outTradeNo, amount, channel(ALIPAY/WECHAT/MOCK), status, transactionId |
| `Ticket` | 准考证 | applicationId, ticketNo(unique), ticketNumber, candidateName, examTitle, venueName, roomNumber, seatNumber, qrCode, barcode |
| `TicketNumberRule` | 准考证号规则 | examId(PK), customPrefix, includeExamCode, dateFormat, sequenceLength, sequenceStart, dailyReset, checksumType |
| `TicketSequence` | 准考证序列 | examId+scope+counterDate(PK), currentValue |
| `Venue` | 考场 | examId, name, capacity, seatMapJson |
| `Room` | 教室 | venueId, name, code, capacity, floor |
| `SeatAssignment` | 座位分配 | examId, positionId, applicationId(unique), venueId, roomId, seatNo, batchId |
| `AllocationBatch` | 分配批次 | examId, strategy, totalCandidates, totalAssigned, totalVenues |
| `FileRecord` | 文件记录 | originalName, storedName(unique), objectKey(unique), fieldKey, applicationId, status(UPLOADING/UPLOADED/AVAILABLE/DELETED/EXPIRED/QUARANTINED), virusScanStatus |
| `ExamScore` | 成绩 | applicationId, subjectId, candidateId, score, isAbsent, interviewEligibility, interviewScore, finalResult |

### 7.3 核心实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Tenant    │       │    Exam     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◄──┐   │ id          │   ┌──►│ code        │
│ username    │   │   │ code        │   │   │ title       │
│ email       │   │   │ schema_name │   │   │ status      │
│ full_name   │   │   │ status      │   │   │ fee_amount  │
└─────────────┘   │   └─────────────┘   │   └──────┬──────┘
      │           │         │             │          │
      ▼           │         ▼             │          ▼
┌─────────────────────────────┐         ┌─────────────┐
│    UserTenantRole           │         │  Position   │
├─────────────────────────────┤         ├─────────────┤
│ user_id                     │         │ exam_id     │
│ tenant_id     ◄────────────┤         │ title       │
│ role                        │         │ quota       │
└─────────────────────────────┘         │ rules_config│
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │Application  │
                                       ├─────────────┤
                                       │ candidate_id│
                                       │ exam_id     │
                                       │ position_id │
                                       │ status      │◄──┐
                                       │ payload     │   │
                                       └─────────────┘   │
                                             │           │
                        ┌────────────────────┼───────────┤
                        │                    │           │
                        ▼                    ▼           ▼
                 ┌─────────────┐      ┌─────────────┐ ┌─────────────┐
                 │   Review    │      │   Ticket    │ │FileRecord   │
                 ├─────────────┤      ├─────────────┤ ├─────────────┤
                 │ applicationId│      │ ticket_no   │ │ object_key  │
                 │ stage       │      │ venue_name  │ │ status      │
                 │ decision    │      │ seat_number │ │ virus_scan  │
                 └─────────────┘      └─────────────┘ └─────────────┘
```

---

## 八、前端路由与页面结构

| 路径 | 角色 | 功能 |
|------|------|------|
| `/login` | 公开 | 用户登录 |
| `/register` | 公开 | 用户注册 |
| `/tenants` | 公开 | 租户/考试列表 |
| `/[tenantSlug]/admin/*` | TENANT_ADMIN | 租户管理后台 |
| `/[tenantSlug]/reviewer/*` | REVIEWER | 审核员工作台 |
| `/[tenantSlug]/candidate/*` | CANDIDATE | 考生门户 |
| `/super-admin/*` | SUPER_ADMIN | 平台管理后台 |
| `/my-applications` | CANDIDATE | 我的报名 |
| `/my-scores` | CANDIDATE | 我的成绩 |
| `/profile` | ALL | 个人资料 |
| `/exams` | 公开 | 考试列表 |

---

## 九、API契约概览

| 模块 | 核心API路径 | 说明 |
|------|-------------|------|
| Auth | `/api/v1/auth/login`, `/auth/register` | JWT认证登录注册 |
| User | `/api/v1/users/me` | 用户信息管理 |
| Tenant | `/api/v1/tenants` | 租户CRUD |
| Exam | `/api/v1/exams` | 考试管理（含岗位、科目、表单模板） |
| Position | `/api/v1/exams/:examId/positions` | 岗位管理 |
| Application | `/api/v1/applications` | 报名提交与状态流转 |
| Review | `/api/v1/reviews/pull`, `/reviews/decide` | 审核任务队列与决策 |
| Payment | `/api/v1/payments` | 支付订单 |
| Ticket | `/api/v1/tickets` | 准考证生成 |
| Seating | `/api/v1/venues`, `/seating/allocate` | 考场与座位分配 |
| File | `/api/v1/files/upload` | 文件上传 |
| Statistics | `/api/v1/statistics/*` | 数据统计 |
| SuperAdmin | `/api/v1/super-admin/*` | 平台管理 |

---

## 十、架构关键特性清单

### 10.1 安全与隔离

| 特性 | 实现方式 |
|------|---------|
| 租户数据隔离 | PostgreSQL Schema-per-Tenant + search_path 切换 |
| 文件存储隔离 | MinIO 每租户独立 bucket |
| API 隔离 | TenantGuard 验证请求租户与 Token 一致性 |
| 认证 | JWT + Passport Strategy |
| 授权 | RBAC 权限守卫 + 细粒度 `@Permissions()` 装饰器 |
| 限流 | 三级限流（3/s, 20/10s, 100/min） |
| 审计 | SecurityAuditLog 记录关键操作 |
| 密码 | bcrypt 加密 |
| 敏感数据 | idNumber 字段加密存储(idNumberEncrypted标记) |

### 10.2 运行时架构

| 特性 | 实现方式 |
|------|---------|
| 请求级租户上下文 | TenantMiddleware → AsyncLocalStorage → PrismaService |
| 缓存 | Redis (cache-manager-redis-yet), TTL 3600s |
| 动态表单 | Exam.formTemplate (JSONB) 定义报名表单字段 |
| 文件病毒扫描 | FileRecord.virusScanStatus 状态追踪 |
| 准考证号生成 | TicketNumberRule + TicketSequence 支持自定义规则(前缀/日期/序列/校验) |
| 审核任务心跳 | ReviewTask.lastHeartbeatAt 防止任务永久锁定 |
| 报名变更审计 | ApplicationAuditLog 记录每次状态流转 |

### 10.3 前端关键特性

| 特性 | 说明 |
|------|------|
| App Router | Next.js 14 App Router 路由模式 |
| 租户上下文 | URL 中包含 `[tenantSlug]` 动态段 |
| 认证上下文 | AuthContext 管理 JWT Token |
| API客户端 | `web/src/lib/api.ts` 封装请求 |
| 路由保护 | `web/src/middleware.ts` 前端路由守卫 |
| 动态表单渲染 | 基于 Exam.formTemplate JSONB 渲染 |

---

## 十一、代码规范要点

### 11.1 TypeScript 严格模式

- `strictNullChecks: true`
- 禁止 `any` 类型（`@typescript-eslint/no-explicit-any: error`）
- 禁止浮动 Promise（`@typescript-eslint/no-floating-promises: error`）
- 未使用变量必须以 `_` 开头

### 11.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | kebab-case | `user.service.ts` |
| 类 | PascalCase | `AuthService` |
| 枚举值 | UPPER_SNAKE_CASE | `SUPER_ADMIN` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 变量/函数 | camelCase | `getUserById` |
| 数据库表 | snake_case | `user_tenant_roles` |
| API路径 | kebab-case | `/api/v1/exam-reviewers` |

### 11.3 Import 顺序

```typescript
// 1. Node 内置模块
// 2. 外部库
// 3. 内部模块（绝对导入 @/...）
// 4. 相对导入
```

---

## 十二、关键文件索引

| 功能 | 路径 |
|------|------|
| 应用入口 | `server/src/main.ts` |
| 模块注册 | `server/src/app.module.ts` |
| 租户中间件 | `server/src/tenant/tenant.middleware.ts` |
| 租户Schema迁移 | `server/src/tenant/tenant-schema-migration.service.ts` |
| 租户模板SQL | `server/src/tenant/tenant-schema-template.sql` |
| Prisma服务 | `server/src/prisma/prisma.service.ts` |
| JWT认证 | `server/src/auth/jwt.strategy.ts` |
| 权限守卫 | `server/src/auth/permissions.guard.ts` |
| 租户守卫 | `server/src/auth/tenant.guard.ts` |
| 权限配置 | `server/src/auth/permissions.config.ts` |
| 数据库Schema | `server/prisma/schema.prisma` |
| 自动审核 | `server/src/review/auto-review.service.ts` |
| 路由保护 | `web/src/middleware.ts` |
| API客户端 | `web/src/lib/api.ts` |

---

## 十三、非功能性需求

### 13.1 性能

| 指标 | 要求 |
|------|------|
| 页面响应时间 | < 500ms (P95) |
| API响应时间 | < 300ms (P95) |
| 并发用户 | 支持 100,000 并发 |
| 准考证生成 | 单张 < 5秒, 10000张 < 10分钟 |
| 座位分配 | 50000人 < 5分钟 |

### 13.2 可用性与安全

| 指标 | 要求 |
|------|------|
| 系统可用性 | 99.9% |
| 部署方式 | 支持容器化部署 |
| 数据隔离 | 租户间100%隔离 |
| 密码加密 | bcrypt加密 |
| 敏感数据 | PII数据加密存储 |
| 审计日志 | 关键操作记录日志 |

---

## 十四、开发与运维

### 14.1 开发环境

```
本机
├── localhost:3000 (Next.js 前端)
├── localhost:8081 (NestJS 后端)
├── PostgreSQL (5432)
├── Redis (6379)
└── MinIO (9000)
```

### 14.2 关键命令

```bash
# 后端
cd server && npm run dev          # 热重载开发服务器
cd server && npm run lint          # ESLint 检查
cd server && npm test              # Jest 测试
cd server && npx prisma generate   # 重新生成 Prisma Client

# 前端
cd web && npm run dev              # Next.js 开发服务器
cd web && npm run lint             # ESLint 检查
cd web && npm run type-check       # TypeScript 类型检查
cd web && npm run test:bdd         # Cucumber BDD 测试
```

---

*文档结束*