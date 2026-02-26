# RESTful API 优化方案

## 一、现有问题分析

### 1.1 非 RESTful 路径

| 当前路径 | 问题 | 建议改进 |
|----------|------|----------|
| POST `/exams/:id/open` | 使用 POST 修改状态 | PATCH `/exams/:id/status` with `{ status: "OPEN" }` |
| POST `/exams/:id/close` | 使用 POST 修改状态 | PATCH `/exams/:id/status` with `{ status: "CLOSED" }` |
| POST `/applications/drafts` | 特殊资源路径 | POST `/applications` with `{ draft: true }` |
| POST `/reviews/pull` | 非资源操作 | GET `/reviews/queue` |
| POST `/reviews/decide` | 非标准操作 | PATCH `/reviews/:taskId/decision` |
| POST `/seating/:examId/allocate` | 动词路径 | POST `/seating/assignments` |

### 1.2 不一致的命名

| 问题 | 示例 |
|------|------|
| 混用单复数 | `exams` vs `applications` |
| 嵌套过深 | `exams/:id/positions` |
| 无版本号 | `/api/exams` 应为 `/api/v1/exams` |

---

## 二、优化方案

### 2.1 状态转换统一使用 PATCH

```typescript
// 考试状态变更
PATCH /api/v1/exams/:id/status
Body: { "status": "OPEN" | "CLOSED" | "REGISTRATION_OPEN" }

// 报名状态变更
PATCH /api/v1/applications/:id/status
Body: { "status": "CANCELLED" }

// 审核任务状态
PATCH /api/v1/reviews/tasks/:id/decision
Body: { "decision": "APPROVED" | "REJECTED", "reason": "..." }
```

### 2.2 批量操作使用 /batch 前缀

```typescript
// 批量审核
POST /api/v1/reviews/batch-decide
Body: { "decisions": [{ "id": "task-1", "decision": true }, ...] }

// 批量生成准考证
POST /api/v1/tickets/batch-generate
Body: { "applicationIds": ["app-1", "app-2", ...] }

// 批量座位分配
POST /api/v1/seating/batch-assign
Body: { "examId": "...", "assignments": [...] }
```

### 2.3 资源嵌套优化

```typescript
// 当前: GET /exams/:id/positions
// 优化: GET /positions?examId=:id

// 当前: GET /applications/:id/reviews
// 优化: GET /reviews?applicationId=:id
```

---

## 三、推荐路径规范

### 3.1 资源命名

```typescript
// 集合资源 (复数)
GET    /api/v1/exams           // 考试列表
GET    /api/v1/applications    // 报名列表
GET    /api/v1/reviews         // 审核列表
GET    /api/v1/tickets         // 准考证列表

// 单个资源 (/:id)
GET    /api/v1/exams/:id
POST   /api/v1/exams
PUT    /api/v1/exams/:id       // 完整更新
PATCH  /api/v1/exams/:id      // 部分更新
DELETE /api/v1/exams/:id
```

### 3.2 动作资源

```typescript
// 状态变更 (PATCH)
PATCH  /api/v1/exams/:id/status

// 自定义动作 (POST /actions/:actionName)
POST   /api/v1/exams/:id/actions/publish
POST   /api/v1/exams/:id/actions/close

// 批量操作 (POST /batch)
POST   /api/v1/reviews/batch-decide
POST   /api/v1/tickets/batch-generate
```

### 3.3 查询参数

```typescript
// 分页
GET /api/v1/exams?page=0&size=10

// 过滤
GET /api/v1/exams?status=OPEN
GET /api/v1/applications?examId=:id&status=PENDING

// 排序
GET /api/v1/exams?sortBy=createdAt&sortOrder=desc

// 搜索
GET /api/v1/exams?search=考试名称
```

---

## 四、实施计划

### 4.1 Phase 1: 批量操作 (已完成)

- [x] 创建批量 DTO
- [x] Review 批量审核接口
- [ ] Ticket 批量生成接口
- [ ] Seating 批量分配接口

### 4.2 Phase 2: RESTful 路径优化

- [ ] 统一状态变更使用 PATCH
- [ ] 移除动词路径
- [ ] 添加 API 版本前缀

### 4.3 Phase 3: 查询优化

- [ ] 统一分页参数
- [ ] 统一过滤参数
- [ ] 添加排序支持

---

## 五、示例响应

### 5.1 成功响应

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 0,
      "size": 10,
      "totalItems": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "metadata": {
    "version": "v1",
    "timestamp": "2026-02-15T12:00:00.000Z"
  }
}
```

### 5.2 批量操作响应

```json
{
  "success": true,
  "data": {
    "success": ["task-1", "task-2", "task-3"],
    "failed": [
      { "id": "task-4", "reason": "Task not found or not assigned to you" }
    ]
  },
  "metadata": {
    "version": "v1",
    "timestamp": "2026-02-15T12:00:00.000Z"
  }
}
```

---

*文档版本: 1.0*
*最后更新: 2026-02-15*
