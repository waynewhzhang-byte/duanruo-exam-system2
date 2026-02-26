# 端若数智考盟 - 架构设计说明书

> 版本: 2.0
> 更新日期: 2026-02-14
> 文档类型: 技术架构文档

---

## 1. 项目概述

### 1.1 项目名称
**端若数智考盟** - 多租户在线招聘考试报名管理平台

### 1.2 系统定位 ⚠️ 重要说明

这是一个**考试报名管理系统**，不是在线考试/答题平台。

| 对比项 | 报名管理系统（本项目） | 在线考试平台 |
|--------|---------------------|-------------|
| 核心功能 | 收集报名信息、审核、发放准考证 | 在线答题、自动判卷、实时监考 |
| 考生操作 | 填表、上传资料、缴费、打印准考证 | 在线作答、提交试卷 |
| 考试形式 | 线下考试 | 在线考试 |
| 数据重点 | 个人信息、证件照、报名表 | 试题、答案、成绩 |
| 审核工作流 | 复杂的多级审核 | 不需要 |

### 1.3 核心业务流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           报名平台核心流程                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【平台管理员】              【租户管理员】              【考生】             │
│       │                        │                        │                   │
│  创建租户 ─────────────────►  │                        │                   │
│       │                  创建考试 ───────────────►     │                   │
│       │                        │                  查看考试列表             │
│       │                        │                  填写报名表                 │
│       │                        │                  上传证件照片               │
│       │                        │                  提交报名 ──────► DRAFT    │
│       │                        │                        │                   │
│       │                  发布考试 ◄───────────────── SUBMITTED              │
│       │                        │                        │                   │
│       │                  配置审核员 ◄────────────── PENDING_PRIMARY_REVIEW  │
│       │                        │                        │                   │
│       │                        │                  一审 ◄─────────────►      │
│       │                        │                  PRIMARY_PASSED/REJECTED   │
│       │                        │                        │                   │
│       │                        │                  二审 ◄─────────────►      │
│       │                        │                  APPROVED/REJECTED        │
│       │                        │                        │                   │
│       │                  缴纳报名费 ◄───────────── PAID                   │
│       │                        │                        │                   │
│       │                  生成准考证 ◄──────────── APPROVED                 │
│       │                        │                        │                   │
│       │                  分配座位 ◄───────────── TICKET_ISSUED              │
│       │                        │                        │                   │
│       │                        │                  查看准考证 ◄─────────►    │
│       │                        │                  打印准考证                │
│       │                        │                  前往线下考场              │
│       │                        │                        │                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 技术栈总览

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 后端框架 | NestJS | 11 |
| 前端框架 | Next.js | 14 (App Router) |
| 编程语言 | TypeScript | 5.x |
| 数据库 | PostgreSQL | 15+ |
| ORM | Prisma | 6 |
| 对象存储 | MinIO | 最新 (S3兼容) |
| UI组件库 | shadcn/ui | 最新 |
| CSS框架 | Tailwind CSS | 3.x |
| 认证 | JWT (Passport) | - |
| 后端测试 | Jest | 30 |
| 前端测试 | Playwright + Cucumber | - |

### 2.2 系统架构图

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
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (HTTP + JWT)
┌─────────────────────────────────────────────────────────────────────────────┐
│                           后端层 (NestJS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Global Prefix: /api/v1                            │   │
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
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                  │
│  │  Prisma  │ │  Tenant  │ │ Scheduler│                                  │
│  │  Service │ │Middleware │ │  Module  │                                  │
│  └──────────┘ └──────────┘ └──────────┘                                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
          ┌──────────────────────────────┼──────────────────────────────┐
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
│ │ (租户A数据)  │  │                                                   │
│ └───────────────┘  │                                                   │
│ ┌───────────────┐  │                                                   │
│ │tenant_yyy    │  │                                                   │
│ │ (租户B数据)  │  │                                                   │
│ └───────────────┘  │                                                   │
└─────────────────────┘                                                   │
```

---

## 3. 多租户架构

### 3.1 架构模式: Schema-per-Tenant

每个租户拥有独立的 PostgreSQL schema，实现数据隔离。

```
PostgreSQL 数据库实例
│
├── public (平台级 Schema)
│   ├── users              # 全局用户账户
│   ├── tenants            # 租户注册信息
│   └── user_tenant_roles # 用户-租户-角色关联
│
├── tenant_company001 (租户A)
│   ├── exams              # 考试
│   ├── positions          # 岗位
│   ├── applications       # 报名
│   ├── reviews            # 审核记录
│   ├── tickets            # 准考证
│   ├── venues             # 考场
│   ├── rooms              # 教室
│   ├── seat_assignments   # 座位分配
│   └── files              # 文件元数据
│
└── tenant_company002 (租户B)
    └── ... (同上)
```

### 3.2 租户隔离实现

#### 请求流程

```
1. 请求进入 → TenantMiddleware 拦截
2. 提取请求头 X-Tenant-ID 或 X-Tenant-Slug
3. 查询 tenants 表获取 schemaName
4. 将 tenantId 存入 AsyncLocalStorage
5. PrismaService 执行查询时自动设置 search_path
6. 查询在正确的租户 schema 中执行
```

#### 核心代码

**TenantMiddleware** (`server/src/tenant/tenant.middleware.ts`):
```typescript
// 伪代码
const tenantId = request.headers['x-tenant-id'];
const tenant = await prisma.tenants.findUnique({ where: { id: tenantId } });
AsyncLocalStorage.run({ tenantId: tenant.id, schemaName: tenant.schemaName }, () => {
  next();
});
```

**PrismaService** (`server/src/prisma/prisma.service.ts`):
```typescript
// 伪代码
get client() {
  const { schemaName } = AsyncLocalStorage.getStore();
  return this.prisma.$extends({
    query: {
      $allOperations({ args, query }) {
        return query({
          ...args,
          prisma: { ...args.prisma, search_path: `"${schemaName}", public` }
        });
      }
    }
  });
}
```

### 3.3 文件存储隔离

每个租户拥有独立的 MinIO bucket：
- `tenant-{tenant-code}-files` - 考生上传的证件资料
- 文件按租户隔离，无法跨租户访问

---

## 4. 模块架构

### 4.1 后端模块

| 模块 | 职责 | 核心API |
|------|------|----------|
| AuthModule | JWT认证、登录注册 | POST /auth/login, /auth/register |
| UserModule | 用户信息管理 | GET/PUT /users/me |
| TenantModule | 租户CRUD、Schema创建 | POST /tenants, GET /tenants/:id |
| ExamModule | 考试管理、岗位配置 | CRUD /exams |
| ApplicationModule | 报名提交、草稿管理 | POST /applications, PUT /applications/:id |
| ReviewModule | 审核任务队列、审核决策 | POST /reviews/pull, POST /reviews/decide |
| PaymentModule | 支付订单、回调处理 | POST /payments, POST /payments/callback |
| TicketModule | 准考证生成、PDF下载 | POST /tickets, GET /tickets/:id/pdf |
| SeatingModule | 考场管理、座位分配 | CRUD /venues, POST /seating/allocate |
| FileModule | 文件上传、下载 | POST /files/upload, GET /files/:id |
| StatisticsModule | 数据统计报表 | GET /statistics/* |
| SuperAdminModule | 平台管理 | GET /super-admin/* |

### 4.2 前端路由

| 路径 | 角色 | 功能 |
|------|------|------|
| `/login` | 公开 | 用户登录 |
| `/register` | 公开 | 用户注册 |
| `/tenants` | 公开 | 租户/考试列表 |
| `/[tenantSlug]/admin/*` | TENANT_ADMIN | 租户管理后台 |
| `/[tenantSlug]/reviewer/*` | REVIEWER | 审核员工作台 |
| `/[tenantSlug]/candidate/*` | CANDIDATE | 考生门户 |
| `/super-admin/*` | SUPER_ADMIN | 平台管理后台 |

---

## 5. 数据模型

### 5.1 核心实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Tenant    │       │    Exam     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ username    │◄──┐   │ code        │   ┌──►│ code        │
│ email       │   │   │ schema_name │   │   │ title       │
│ full_name   │   │   │ status      │   │   │ status      │
└─────────────┘   │   └─────────────┘   │   │ fee_amount  │
      │           │         │             │   └─────────────┘
      │           │         │             │         │
      ▼           │         ▼             │         ▼
┌─────────────────────────────┐         ┌─────────────┐
│    UserTenantRole           │         │  Position   │
├─────────────────────────────┤         ├─────────────┤
│ user_id                     │         │ exam_id     │
│ tenant_id     ◄────────────┤         │ title       │
│ role                        │         │ quota       │
└─────────────────────────────┘         └─────────────┘
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
                        ┌──────────────────────┼───────────┤
                        │                      │           │
                        ▼                      ▼           ▼
                 ┌─────────────┐      ┌─────────────┐ ┌─────────────┐
                 │   Review    │      │   Ticket    │ │FileRecord   │
                 ├─────────────┤      ├─────────────┤ ├─────────────┤
                 │ applicationId│      │ applicationId│ │applicationId│
                 │ stage       │      │ ticket_no   │ │ object_key  │
                 │ decision    │      │ venue_name  │ │ status      │
                 └─────────────┘      │ seat_number │ └─────────────┘
                                       └─────────────┘
```

### 5.2 报名状态机

```
                        ┌─────────────────────┐
                        │      DRAFT           │
                        │     (草稿)           │
                        └──────────┬──────────┘
                                   │ 提交
                                   ▼
                        ┌─────────────────────┐
                        │    SUBMITTED        │
                        │    (已提交)          │
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
     └────────┬────────┘         │ (二审拒绝)     │
              │                  └─────────────────┘
              ▼
     ┌─────────────────┐
     │  TICKET_ISSUED  │
     │ (准考证已发放)   │
     └─────────────────┘
```

---

## 6. 安全架构

### 6.1 认证

- **JWT认证**: 使用 Passport.js + JWT Strategy
- **Token包含信息**: userId, username, email, roles, tenantId, permissions
- **Token有效期**: 7天 (可配置)

### 6.2 授权

| 角色 | 权限 |
|------|------|
| SUPER_ADMIN | 平台管理、租户管理、所有租户数据访问 |
| TENANT_ADMIN | 本租户所有管理权限 |
| OPERATOR | 考场管理、座位安排 |
| PRIMARY_REVIEWER | 一审任务 |
| SECONDARY_REVIEWER | 二审任务 |
| CANDIDATE | 报名、查看准考证、查看成绩 |

### 6.3 数据隔离

- **租户隔离**: 通过 PostgreSQL schema 实现
- **文件隔离**: 通过 MinIO bucket 实现
- **API隔离**: TenantGuard 验证请求的租户与Token中的租户一致

---

## 7. 部署架构

### 7.1 开发环境

```
本机
├── localhost:3000 (Next.js 前端)
└── localhost:8081 (NestJS 后端)
```

### 7.2 生产环境 (建议)

```
                          ┌─────────────────┐
                          │   CDN / Nginx   │
                          │   (静态资源)    │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Load Balancer   │
                          └────────┬────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Next.js Pod 1  │      │  Next.js Pod N  │      │  NestJS Pod 1   │
│    (3000)       │      │    (3000)       │      │    (8081)       │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                         ┌────────────────────────────────┼────────────────┐
                         │                                │                │
                         ▼                                ▼                ▼
                  ┌─────────────┐                 ┌─────────────┐   ┌─────────────┐
                  │ PostgreSQL  │                 │    MinIO    │   │  支付网关   │
                  │  (主从)    │                 │   (集群)    │   │ (支付宝/微信)│
                  └─────────────┘                 └─────────────┘   └─────────────┘
```

---

## 8. 附录

### 8.1 环境变量

**后端 (.env)**:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=8081
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
JWT_SECRET=xxx
```

**前端 (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
BACKEND_ORIGIN=http://localhost:8081
```

### 8.2 关键文件位置

| 功能 | 路径 |
|------|------|
| 数据库Schema | `server/prisma/schema.prisma` |
| 应用入口 | `server/src/main.ts` |
| 模块注册 | `server/src/app.module.ts` |
| 多租户中间件 | `server/src/tenant/tenant.middleware.ts` |
| 前端路由保护 | `web/src/middleware.ts` |
| API客户端 | `web/src/lib/api.ts` |

---

*文档结束*
