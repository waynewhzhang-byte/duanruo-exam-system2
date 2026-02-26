# 前后端接口契约分析

> 端若数智考盟 - API 契约分析文档

---

## 一、现有 API 概览

### 1.1 后端 Controllers

| 模块 | Controller | 端点数 |
|------|------------|--------|
| Auth | `auth.controller.ts` | 登录、注册、Token刷新 |
| User | `user.controller.ts` | 用户CRUD、角色管理 |
| Tenant | `tenant.controller.ts` | 租户管理 |
| Exam | `exam.controller.ts` | 考试CRUD、开启/关闭报名 |
| Application | `application.controller.ts` | 报名提交、草稿管理 |
| Review | `review.controller.ts` | 审核任务拉取、审核决策 |
| Payment | `payment.controller.ts` | 支付订单、回调处理 |
| Ticket | `ticket.controller.ts` | 准考证生成、查看 |
| Seating | `seating.controller.ts` | 座位分配 |
| File | `file.controller.ts` | 文件上传、下载 |
| Statistics | `statistics.controller.ts` | 数据统计 |

### 1.2 API 响应格式

```typescript
// 成功响应
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}

// 分页响应
{
  "content": [ ... ],
  "total": 100,
  "page": 0,
  "size": 10,
  "totalPages": 10
}

// 错误响应
{
  "success": false,
  "message": "错误信息",
  "error": { ... }
}
```

---

## 二、核心业务 API 详细

### 2.1 考试模块 (Exam)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/exams` | `exam:view` | 获取考试列表 |
| GET | `/api/v1/exams/:id` | `exam:view` | 获取考试详情 |
| POST | `/api/v1/exams` | `exam:create` | 创建考试 |
| PUT | `/api/v1/exams/:id` | `exam:edit` | 更新考试 |
| DELETE | `/api/v1/exams/:id` | `exam:delete` | 删除考试 |
| POST | `/api/v1/exams/:id/open` | `exam:open` | 开启报名 |
| POST | `/api/v1/exams/:id/close` | `exam:close` | 关闭报名 |
| GET | `/api/v1/exams/:id/positions` | `position:view` | 获取岗位列表 |
| POST | `/api/v1/exams/positions` | `position:create` | 创建岗位 |
| DELETE | `/api/v1/exams/positions/:id` | `position:delete` | 删除岗位 |

### 2.2 报名模块 (Application)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/applications/my` | `application:view:own` | 我的报名列表 |
| GET | `/api/v1/applications/drafts/my` | `application:view:own` | 我的草稿 |
| GET | `/api/v1/applications/:id` | `application:view:own` | 报名详情 |
| POST | `/api/v1/applications` | `application:create` | 提交报名 |
| POST | `/api/v1/applications/drafts` | `application:create` | 保存草稿 |
| GET | `/api/v1/applications/:id/reviews` | `review:view` | 报名审核记录 |

### 2.3 审核模块 (Review)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/v1/reviews/pull` | `review:perform` | 拉取审核任务 |
| POST | `/api/v1/reviews/decide` | `review:perform` | 提交审核决定 |
| POST | `/api/v1/reviews/tasks/:id/heartbeat` | `review:perform` | 任务心跳 |
| POST | `/api/v1/reviews/tasks/:id/release` | `review:perform` | 释放任务 |
| GET | `/api/v1/reviews/queue` | `review:view` | 审核队列 |

### 2.4 支付模块 (Payment)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/v1/payments/create` | `payment:create` | 创建支付订单 |
| GET | `/api/v1/payments/:id` | `payment:view` | 支付状态查询 |
| POST | `/api/v1/payments/callback` | - | 支付回调(无需认证) |

### 2.5 准考证模块 (Ticket)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/tickets/my` | `ticket:view:own` | 我的准考证 |
| GET | `/api/v1/tickets/:id` | `ticket:view` | 准考证详情 |
| GET | `/api/v1/tickets/:id/qrcode` | `ticket:view` | 准考证二维码 |
| POST | `/api/v1/tickets/:id/print` | `ticket:print` | 标记已打印 |

### 2.6 座位模块 (Seating)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/seating/exams/:id` | `seating:view` | 座位安排视图 |
| POST | `/api/v1/seating/exams/:id/auto-assign` | `seating:assign` | 自动分配座位 |
| POST | `/api/v1/seating/manual` | `seating:assign` | 手动分配座位 |

### 2.7 文件模块 (File)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/v1/files/upload` | `file:upload` | 文件上传 |
| GET | `/api/v1/files/:id` | `file:view` | 文件信息 |
| GET | `/api/v1/files/:id/download` | `file:download` | 文件下载 |
| DELETE | `/api/v1/files/:id` | `file:delete` | 文件删除 |

---

## 三、认证与授权

### 3.1 认证方式

- **JWT Bearer Token**: 放在 `Authorization` 头部
- **Tenant ID**: 放在 `X-Tenant-ID` 头部

### 3.2 权限模型

```typescript
// 权限格式: resource:action:scope
// 示例:
'exam:view'           // 查看考试
'exam:create'        // 创建考试
'application:view:own' // 查看自己的报名
'review:perform'     // 执行审核
```

### 3.3 角色体系

| 角色 | 权限 |
|------|------|
| SUPER_ADMIN | 平台管理所有权限 |
| TENANT_ADMIN | 租户管理所有权限 |
| OPERATOR | 操作员 |
| PRIMARY_REVIEWER | 一审审核员 |
| SECONDARY_REVIEWER | 二审审核员 |
| CANDIDATE | 考生 |

---

## 四、前端调用分析

### 4.1 API 客户端结构

```
web/src/lib/
├── api.ts                 # 基础 API 客户端
├── api-hooks.ts          # React Query Hooks
├── api-client-enhanced.tsx # 增强客户端
├── schemas.ts             # Zod 验证模式
├── auth-api.ts           # 认证 API
└── tenant-api.ts         # 租户 API
```

### 4.2 主要 Hooks

```typescript
// 考试相关
useExams()                // 考试列表
useExam(id)              // 考试详情
useCreateExam()          // 创建考试
useUpdateExam()          // 更新考试

// 报名相关
useMyApplications()     // 我的报名
useSubmitApplication()  // 提交报名
useSaveDraft()          // 保存草稿

// 审核相关
useReviewQueue()        // 审核队列
usePullReviewTask()     // 拉取任务
useSubmitDecision()     // 提交决定

// 准考证相关
useMyTickets()          // 我的准考证
useTicketQRCode()      // 二维码
```

---

## 五、接口契约改进建议

### 5.1 统一响应格式

当前存在问题：
- 部分使用 `ApiResult.ok()`
- 部分直接返回数据
- 分页格式不一致

建议统一为：
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}
```

### 5.2 RESTful 改进

| 当前 | 建议 |
|------|------|
| POST `/exams/:id/open` | PATCH `/exams/:id/status` with `{ status: "OPEN" }` |
| POST `/applications/drafts` | POST `/applications` with `{ draft: true }` |
| POST `/reviews/pull` | GET `/reviews/queue` |

### 5.3 版本控制

建议 URL 中增加版本号：
- `/api/v1/exams`
- `/api/v2/exams` (未来)

### 5.4 字段命名规范

建议统一使用 camelCase：
```typescript
// 当前 (混用)
createdAt, created_at, created_at

// 建议
createdAt, updatedAt
```

---

## 六、DDD 重构后的接口变化

### 6.1 响应类型变化

旧: 直接返回 Prisma 对象
```typescript
return ApiResult.ok(exam); // Prisma Exam model
```

新: 返回 Domain Entity
```typescript
const exam = await examService.getExam(id);
return ApiResult.ok(exam.toPlainObject());
```

### 6.2 错误处理变化

旧: 抛出 NestJS HttpException
新: 使用 Result 类型
```typescript
const result = await examService.createExam(command);
if (isErr(result)) {
  return ApiResult.fail(result.error.message);
}
return ApiResult.ok(result.value);
```

---

## 七、待完善接口

### 7.1 缺失接口

| 功能 | 状态 |
|------|------|
| 批量操作 (批量审核) | 缺失 |
| 导出功能 (导出报名表) | 缺失 |
| 消息通知 | 缺失 |
| 登录日志 | 缺失 |

### 7.2 待优化接口

| 接口 | 问题 |
|------|------|
| 文件上传 | 建议支持分片上传 |
| 座位分配 | 建议支持批量分配 |
| 统计接口 | 建议增加缓存 |

---

## 八、总结

### 8.1 当前状态

- ✅ RESTful API 基础架构完整
- ✅ JWT + 租户认证
- ✅ 基于权限的访问控制
- ⚠️ 响应格式不完全统一
- ⚠️ 缺少版本控制

### 8.2 改进优先级

| 优先级 | 改进项 |
|--------|--------|
| P0 | 统一响应格式 |
| P0 | 完善错误处理 |
| P1 | RESTful 优化 |
| P1 | API 版本控制 |
| P2 | 批量操作接口 |
| P2 | 导出功能 |

---

*文档版本: 1.0*
*最后更新: 2026-02-15*
