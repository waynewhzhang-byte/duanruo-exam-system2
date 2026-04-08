# AGENTS.md - AI Agent 工作指南

> 本文件为 AI 代理提供在「端若数智考盟」考试报名平台代码库中工作的完整指南。

## 项目概述

**项目名称**: 端若数智考盟 - 多租户在线招聘考试报名管理平台

**核心定位**: 这是一个考试报名管理系统，不是在线答题平台。考生不需要在线答题。

**技术栈**:
- 后端: NestJS 11 + TypeScript (端口 8081)
- 前端: Next.js 14 (App Router) + React 18 (端口 3000)
- 数据库: PostgreSQL + Prisma 6
- 对象存储: MinIO (S3兼容)
- UI组件: shadcn/ui + Radix + Tailwind CSS
- 测试: Jest (后端) + Playwright + Cucumber BDD

---

## 运行命令

### 后端 (server/)

```bash
cd server

# 开发与构建
npm run dev              # 热重载开发服务器
npm run build            # 编译 TypeScript
npm run start:prod       # 运行编译后的代码

# 代码质量
npm run lint            # ESLint + 自动修复
npm run format          # Prettier 格式化

# 测试 - 运行单个测试文件
npm test -- src/auth/auth.service.spec.ts  # 指定文件
npm run test:watch     # 监听模式
npm run test:cov       # 覆盖率报告

# Prisma
npx prisma generate    # 重新生成 Prisma Client
npx prisma db push     # 推送 Schema 变更
```

### 前端 (web/)

```bash
cd web

# 开发与构建
npm run dev             # Next.js 开发服务器
npm run build           # 生产构建
npm run lint            # ESLint 检查
npm run type-check      # TypeScript 类型检查

# Playwright E2E 测试
npx playwright test tests/e2e/xxx.spec.ts --headed  # 单个测试文件
npm run test:e2e:ui    # Playwright UI 模式

# Cucumber BDD 测试
npm run test:bdd           # 所有 BDD 测试
npm run test:bdd:smoke     # 冒烟测试
npm run test:bdd:p0        # P0 优先级测试
npm run test:bdd:critical  # 关键路径测试

# OpenAPI
npm run openapi:refresh    # 从后端重新导出 OpenAPI 并生成客户端
```

---

## 代码规范

### TypeScript 配置

- **严格模式**: 启用，不允许 `any` 类型
- **目标**: ES2022
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
  this.prisma.exam.create({ data: dto }); // 禁止!
}
```

---

## 禁止事项

- ❌ 使用 `any` 类型 (禁止 `as any`、`@ts-ignore`)
- ❌ 未使用的变量不以 `_` 开头
- ❌ 浮动 promise（未 await 的异步调用）
- ❌ 空 catch 块
- ❌ 直接提交到 main/master
- ❌ 无故禁用 ESLint 规则
- ❌ 混合 import 风格

---

## 必做事项

- ✅ 提交前运行 `npm run lint`
- ✅ 提交前运行 `npm run type-check` (前端)
- ✅ 新功能编写测试 (`.spec.ts`)
- ✅ 使用有意义的变量/函数名
- ✅ 显式处理 null/undefined
- ✅ 复杂逻辑添加注释

---

## 项目结构

```
duanruo-exam-system2/
├── server/              # NestJS 后端 (端口 8081)
│   └── src/
│       ├── auth/        # JWT认证
│       ├── tenant/     # 多租户管理
│       ├── exam/       # 考试管理
│       ├── application/# 报名管理
│       ├── review/     # 审核工作流
│       ├── ticket/     # 准考证生成
│       └── prisma/     # 数据库ORM
│
└── web/                # Next.js 前端 (端口 3000)
    └── src/
        ├── app/        # App Router 页面
        ├── components/ # React 组件
        ├── lib/       # API 客户端、Hooks
        └── contexts/   # React Context
```

---

## 关键文件

| 功能 | 路径 |
|------|------|
| 应用入口 | `server/src/main.ts` |
| 多租户中间件 | `server/src/tenant/tenant.middleware.ts` |
| Prisma服务 | `server/src/prisma/prisma.service.ts` |
| JWT认证 | `server/src/auth/jwt.strategy.ts` |
| 数据库Schema | `server/prisma/schema.prisma` |
| 路由保护 | `web/src/middleware.ts` |
| API客户端 | `web/src/lib/api.ts` |
