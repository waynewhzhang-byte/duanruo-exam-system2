# AGENTS.md - AI Agent 工作指南

> 本文件为 AI 代理提供在「端若数智考盟」考试报名平台代码库中工作的完整指南。

## 项目概述

### 项目名称
**端若数智考盟** - 多租户在线招聘考试报名管理平台

### 核心定位 ⚠️ 重要
这是一个**考试报名管理系统**，不是在线考试/答题平台。考生**不需要在线答题**。

**实际业务流程**:
1. 查找并浏览考试信息
2. 提交报名申请（填写表单、上传证件资料）
3. 缴纳报名费（如需付费）
4. 等待资料审核（初审+复审）
5. 获取准考证（包含考场座位信息）
6. **前往线下考场参加考试**

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS 11 + TypeScript |
| 前端 | Next.js 14 (App Router) + React 18 |
| 数据库 | PostgreSQL + Prisma 6 |
| 对象存储 | MinIO (S3兼容) |
| UI组件 | shadcn/ui + Radix + Tailwind CSS |
| 测试 | Jest (后端) + Playwright + Cucumber BDD |

---

## 项目结构

```
duanruo-exam-system2/
├── server/                    # NestJS 后端 (端口 8081)
│   ├── src/
│   │   ├── auth/              # JWT认证、登录注册
│   │   ├── user/              # 用户管理
│   │   ├── tenant/            # 多租户管理
│   │   ├── exam/              # 考试管理
│   │   ├── application/       # 报名管理
│   │   ├── review/            # 审核工作流
│   │   ├── payment/           # 支付集成
│   │   ├── ticket/            # 准考证生成
│   │   ├── seating/           # 考场座位管理
│   │   ├── file/              # 文件上传下载
│   │   ├── statistics/        # 统计分析
│   │   ├── super-admin/       # 平台管理
│   │   ├── scheduler/         # 定时任务
│   │   ├── prisma/            # 数据库ORM
│   │   └── common/            # 公共模块
│   └── prisma/
│       └── schema.prisma      # 数据库模型
│
├── web/                       # Next.js 前端 (端口 3000)
│   └── src/
│       ├── app/               # App Router 页面
│       │   ├── [tenantSlug]/ # 租户空间
│       │   │   ├── admin/    # 租户管理后台
│       │   │   ├── candidate/# 考生门户
│       │   │   └── reviewer/ # 审核员工作台
│       │   ├── super-admin/   # 平台管理后台
│       │   ├── login/        # 登录页
│       │   └── register/     # 注册页
│       ├── components/       # React 组件
│       ├── lib/              # API 客户端、Hooks
│       ├── contexts/          # React Context
│       └── middleware.ts      # 路由保护
│
├── scripts/                   # 数据库脚本
├── api-contracts/             # OpenAPI 规范
└── specs/                    # 需求规格文档
```

---

## 核心业务模块

### 1. 多租户架构 (Multi-Tenancy)

**核心模式**: Schema-per-Tenant（每个租户独立数据库Schema）

```
PostgreSQL 数据库
├── public schema (平台级)
│   ├── users              # 所有用户
│   ├── tenants            # 租户信息
│   └── user_tenant_roles  # 用户-租户-角色关联
│
├── tenant_xxx (租户A业务数据)
│   ├── exams
│   ├── applications
│   ├── reviews
│   ├── tickets
│   └── venues/rooms
│
└── tenant_yyy (租户B业务数据)
    └── ...
```

**关键实现**:
- `TenantMiddleware`: 从请求头提取 `X-Tenant-ID`，设置租户上下文
- `PrismaService`: 使用 AsyncLocalStorage 切换 search_path
- 跨Schema外键通过应用逻辑管理（不是Prisma关系）

### 2. 用户角色体系

| 角色 | 说明 | 典型用户 |
|------|------|----------|
| SUPER_ADMIN | 超级管理员 | 平台运营方 |
| TENANT_ADMIN | 租户管理员 | 招聘企业HR |
| OPERATOR | 操作员 | 考场工作人员 |
| PRIMARY_REVIEWER | 一审审核员 | 资料初审 |
| SECONDARY_REVIEWER | 二审审核员 | 资料复审 |
| CANDIDATE | 考生 | 应聘者 |

### 3. 报名状态流转

```
【收费考试流程】
DRAFT (草稿)
    ↓ 提交
SUBMITTED (已提交)
    ↓ 支付
PAID (已支付)
    ↓ 触发审核
PENDING_PRIMARY_REVIEW (待一审)
    ↓ 一审通过
PRIMARY_PASSED (一审通过)
    ↓ 自动进入二审
PENDING_SECONDARY_REVIEW (待二审)
    ↓ 二审通过
APPROVED (审核通过)
    ↓ 生成准考证
TICKET_ISSUED (准考证已发放)
    ↓ 座位分配
SEAT_ASSIGNED (已分配座位)

【免费考试流程】
SUBMITTED → PENDING_PRIMARY_REVIEW → ... → APPROVED
```

---

## 运行命令

### 后端 (server/)

```bash
cd server

# 开发
npm run dev              # 热重载开发服务器 (端口 8081)
npm run build            # 编译 TypeScript
npm run start:prod     # 运行编译后的代码

# 代码质量
npm run lint            # ESLint + 自动修复
npm run format          # Prettier 格式化

# 测试
npm run test            # Jest 单元测试
npm run test:watch     # 监听模式
npm run test:cov        # 覆盖率报告
npm run test:e2e        # E2E测试

# 运行单个测试文件
npm test -- src/auth/auth.service.spec.ts

# Prisma
npx prisma generate     # 重新生成 Prisma Client
npx prisma db push      # 推送 Schema 变更
npx prisma studio       # 图形化数据库编辑器
```

### 前端 (web/)

```bash
cd web

# 开发
npm run dev              # Next.js 开发服务器 (端口 3000)
npm run build            # 生产构建
npm run lint            # ESLint 检查
npm run type-check      # TypeScript 类型检查

# 测试 - Playwright
npm run test:e2e                    # 所有 E2E 测试
npm run test:e2e:ui               # Playwright UI 模式
npm run test:e2e:headed           # 有头模式运行
npx playwright test tests/e2e/xxx.spec.ts --headed  # 单个测试文件

# 测试 - Cucumber BDD
npm run test:bdd           # 所有 BDD 测试
npm run test:bdd:smoke     # 冒烟测试
npm run test:bdd:p0        # P0 优先级测试
npm run test:bdd:layer-N   # 运行指定层级测试 (0-7)
npm run test:bdd:critical  # 关键路径测试
npm run test:bdd:security  # 安全测试
npm run test:bdd:wip      # 开发中测试 (@wip 标签)

# OpenAPI
npm run openapi:refresh   # 从后端重新导出 OpenAPI 并生成客户端
```

### 前后端联合运行

```bash
# 后端: http://localhost:8081/api/v1
# 前端: http://localhost:3000
# 前端通过 Next.js rewrites 代理 /api/v1/* 到后端
```

---

## 代码规范

### TypeScript 配置

- **严格模式**: 启用，不允许 `any` 类型
- **目标**: ES2022
- **模块**: nodenext (server), ESNext (web)
- **strictNullChecks**: true

### ESLint 规则 (后端)

```javascript
// 强制规则 - 禁止禁用
'@typescript-eslint/no-explicit-any': 'error'
'@typescript-eslint/no-unsafe-assignment': 'error'
'@typescript-eslint/no-unsafe-member-access': 'error'
'@typescript-eslint/no-unsafe-return': 'error'
'@typescript-eslint/no-unsafe-argument': 'error'
'@typescript-eslint/no-unsafe-call': 'error'
'@typescript-eslint/no-floating-promises': 'error'

// 未使用变量必须以下划线开头
'@typescript-eslint/no-unused-vars': ['error', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_'
}]
```

### Prettier 配置

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | kebab-case | `user.service.ts` |
| 类 | PascalCase | `AuthService` |
| 接口 | PascalCase | `UserDto` |
| 枚举 | PascalCase | `UserRole` |
| 枚举值 | UPPER_SNAKE_CASE | `SUPER_ADMIN` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 变量/函数 | camelCase | `getUserById` |
| 数据库表 | snake_case | `user_tenant_roles` |

### Import 顺序

```typescript
// 1. Node 内置模块
import { Injectable } from '@nestjs/common';

// 2. 外部库
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

// 3. 内部模块 (绝对导入)
import { TenantService } from '@/tenant/tenant.service';

// 4. 相对导入
import { Exam } from '../entities/exam.entity';
```

### 错误处理

```typescript
// ✅ 正确
async createExam(dto: CreateExamDto) {
  const existing = await this.prisma.exam.findUnique({ where: { id: dto.id } });
  if (existing) {
    throw new BadRequestException('考试已存在');
  }
  return this.prisma.exam.create({ data: dto });
}

// ❌ 错误 - 浮动 promise
async createExam(dto: CreateExamDto) {
  this.prisma.exam.create({ data: dto }); // 不要这样做!
}
```

---

## 关键文件位置

### 后端核心

| 功能 | 文件路径 |
|------|----------|
| 应用入口 | `server/src/main.ts` |
| 模块注册 | `server/src/app.module.ts` |
| 多租户中间件 | `server/src/tenant/tenant.middleware.ts` |
| Prisma服务 | `server/src/prisma/prisma.service.ts` |
| JWT认证 | `server/src/auth/jwt.strategy.ts` |
| 权限守卫 | `server/src/auth/permissions.guard.ts` |
| 租户服务 | `server/src/tenant/tenant.service.ts` |
| 报名服务 | `server/src/application/application.service.ts` |
| 审核服务 | `server/src/review/review.service.ts` |
| 支付服务 | `server/src/payment/payment.service.ts` |
| 准考证服务 | `server/src/ticket/ticket.service.ts` |
| 座位分配 | `server/src/seating/seating.service.ts` |
| 数据库Schema | `server/prisma/schema.prisma` |

### 前端核心

| 功能 | 文件路径 |
|------|----------|
| 路由保护中间件 | `web/src/middleware.ts` |
| API客户端 | `web/src/lib/api.ts` |
| React Query Hooks | `web/src/lib/api-hooks.ts` |
| 认证Context | `web/src/contexts/AuthContext.tsx` |
| 租户Context | `web/src/contexts/TenantContext.tsx` |

---

## 数据库模型 (核心表)

### 公共 Schema (平台级)

```prisma
// 用户
model User {
  id          String @id @default(uuid())
  username    String @unique
  email       String @unique
  passwordHash String
  fullName    String
  roles       String // JSON: ["ADMIN", "CANDIDATE"]
  status      String // ACTIVE, INACTIVE
  createdAt   DateTime
  updatedAt   DateTime
  
  tenantRoles UserTenantRole[]
}

// 租户
model Tenant {
  id          String @id @default(uuid())
  name        String
  code        String @unique       // 用于URL: /tenant-code/...
  schemaName  String @unique      // PostgreSQL schema: tenant_xxx
  status      String              // PENDING, ACTIVE, INACTIVE
  createdAt   DateTime
  activatedAt DateTime?
  
  userRoles   UserTenantRole[]
}

// 用户-租户-角色关联
model UserTenantRole {
  id        String @id @default(uuid())
  userId    String
  tenantId  String
  role      String // TENANT_ADMIN, PRIMARY_REVIEWER, etc.
  grantedAt DateTime
  active    Boolean @default(true)
  
  user      User   @relation(...)
  tenant    Tenant @relation(...)
  
  @@unique([userId, tenantId, role])
}
```

### 租户 Schema (业务数据)

```prisma
// 考试
model Exam {
  id                 String @id @default(uuid())
  code               String @unique
  title              String
  description        String?
  registrationStart  DateTime?
  registrationEnd    DateTime?
  examStart          DateTime?
  examEnd            DateTime?
  feeRequired        Boolean
  feeAmount          Decimal?
  status             String // DRAFT, REGISTRATION_OPEN, OPEN, CLOSED
  formTemplate       Json?  // 表单模板配置
  createdAt          DateTime
  
  positions          Position[]
  applications       Application[]
}

// 岗位
model Position {
  id           String @id @default(uuid())
  examId       String
  code         String
  title        String
  description  String?
  quota        Int?   // 招聘人数
  requirements Json?  // 招聘要求: {ageMin, ageMax, gender, education}
  
  exam         Exam   @relation(...)
  subjects     Subject[]
  applications Application[]
}

// 报名
model Application {
  id           String @id @default(uuid())
  candidateId  String   // 关联 public.users
  examId       String
  positionId   String
  payload      Json     // 表单数据
  status       String   // DRAFT, SUBMITTED, APPROVED, PAID, etc.
  submittedAt  DateTime?
  createdAt    DateTime
  updatedAt    DateTime
  
  exam         Exam     @relation(...)
  position     Position @relation(...)
  attachments  FileRecord[]
  reviews      Review[]
  ticket       Ticket?
  
  @@unique([examId, candidateId])
}

// 审核任务
model ReviewTask {
  id            String @id @default(uuid())
  applicationId String
  stage         String   // PRIMARY, SECONDARY
  status        String   // OPEN, ASSIGNED, COMPLETED
  assignedTo    String?  // 审核员ID
  lockedAt      DateTime? // 任务锁定时间
  createdAt    DateTime
  
  @@index([applicationId, stage])
  @@index([assignedTo, status])
}

// 审核记录
model Review {
  id            String @id @default(uuid())
  applicationId String
  stage         String   // PRIMARY, SECONDARY
  reviewerId    String
  decision      String?  // APPROVED, REJECTED, PENDING
  comment       String?
  reviewedAt    DateTime?
  createdAt    DateTime
}

// 准考证
model Ticket {
  id              String @id @default(uuid())
  applicationId   String
  examId          String
  positionId      String
  candidateId     String
  
  ticketNo        String @unique  // 准考证号
  ticketNumber    String          // 顺序号
  status          String          // ACTIVE, CANCELLED
  
  candidateName   String?         // 考生姓名
  candidateIdNumber String?      // 证件号
  candidatePhoto  String?         // 证件照
  
  examTitle       String?        // 考试名称
  positionTitle   String?        // 岗位名称
  examStartTime   DateTime?      // 考试时间
  examEndTime     DateTime?      // 考试结束时间
  
  venueName       String?        // 考场名称
  roomNumber      String?         // 教室号
  seatNumber      String?         // 座位号
  
  qrCode          String?         // 二维码
  issuedAt        DateTime        // 发放时间
}

// 考场
model Venue {
  id          String @id @default(uuid())
  examId      String
  name        String
  capacity    Int
  seatMapJson Json?
  
  rooms       Room[]
  
  @@index([examId])
}

// 教室
model Room {
  id          String @id @default(uuid())
  venueId     String
  name        String
  code        String
  capacity    Int
  floor       Int?
  
  venue       Venue  @relation(...)
  
  @@index([venueId])
}

// 座位分配
model SeatAssignment {
  id            String @id @default(uuid())
  examId        String
  positionId    String
  applicationId String @unique
  venueId       String
  roomId        String?
  seatNo        Int
  seatLabel     String?
  
  @@index([examId])
  @@index([batchId])
}

// 文件记录
model FileRecord {
  id              String @id @default(uuid())
  originalName    String
  storedName      String @unique
  objectKey       String @unique
  contentType     String?
  fileSize        BigInt?
  fieldKey        String?   // 表单字段标识
  applicationId   String?
  uploadedBy      String
  status          String    // UPLOADING, AVAILABLE, DELETED
  virusScanStatus String    // PENDING, CLEAN, INFECTED
  createdAt       DateTime
  
  @@map("files")
}
```

---

## 前端路由结构

```
/                              # 首页
├── /login                     # 登录
├── /register                  # 注册
├── /tenants                   # 租户列表（选择报考单位）
│
├── /[tenantSlug]/              # 租户空间
│   ├── /admin/               # 租户管理后台
│   │   ├── /exams/          # 考试管理
│   │   ├── /applications/   # 报名管理
│   │   ├── /reviews/        # 审核管理
│   │   ├── /tickets/        # 准考证管理
│   │   ├── /seating/        # 座位安排
│   │   └── /statistics/     # 数据统计
│   │
│   ├── /reviewer/           # 审核员工作台
│   │   └── /tasks/          # 审核任务队列
│   │
│   └── /candidate/          # 考生门户
│       ├── /exams/          # 浏览考试
│       ├── /applications/   # 我的报名
│       ├── /tickets/        # 准考证
│       └── /scores/         # 成绩查询
│
└── /super-admin/             # 平台管理后台
    └── /tenants/             # 租户管理
```

---

## 环境变量

### 后端 (server/.env)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?schema=public
PORT=8081
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### 前端 (web/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
BACKEND_ORIGIN=http://localhost:8081
```

---

## 禁止事项

- ❌ 使用 `any` 类型
- ❌ 未使用的变量不以 `_` 开头
- ❌ 浮动 promise（未 await 的异步调用）
- ❌ 空 catch 块
- ❌ 直接提交到 main/master
- ❌ 无故禁用 ESLint 规则
- ❌ 混合 import 风格

---

## 必做事项

- ✅ 提交前运行 `npm run lint`
- ✅ 提交前运行 `npm run type-check`
- ✅ 新功能编写测试 (`.spec.ts`)
- ✅ 使用有意义的变量/函数名
- ✅ 显式处理 null/undefined
- ✅ 复杂逻辑添加注释
