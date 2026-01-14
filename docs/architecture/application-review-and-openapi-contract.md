# 考生报名 + 审核流程 & OpenAPI 契约对齐基线

> 本文基于 `auth-multitenancy-openapi-baseline.md`，专门聚焦：
> 1）考生报名提交 + 自动审核 + 两级人工审核 的端到端链路；
> 2）与该链路相关的 OpenAPI–前端契约对齐规则，以及本次已修复的关键差异。

---

## 1. 典型业务流：考生报名提交 + 自动审核 + 初审 + 复审

### 1.1 端到端步骤总览

**参与角色（基于 User + UserTenantRole）：**

- `CANDIDATE`：考生，提交报名、查看/撤回自己的报名、支付、查看准考证。
- `PRIMARY_REVIEWER`：一级审核员，对报名进行初审。
- `SECONDARY_REVIEWER`：二级审核员，对报名进行终审。
- `TENANT_ADMIN` / `EXAM_ADMIN_MANAGE`：租户管理员/考试管理员，可查看全部报名和审核统计，可代管审核流程。

**关键权限字符串（与 @PreAuthorize 对齐）：**

- 报名相关：`APPLICATION_CREATE`, `APPLICATION_VIEW_OWN`, `APPLICATION_VIEW_ALL`, `APPLICATION_WITHDRAW`, `APPLICATION_PAY`。
- 审核相关：`REVIEW_PRIMARY`, `REVIEW_SECONDARY`, `REVIEW_STATISTICS`。

**租户上下文：**

- 前端：所有业务请求必须携带 `X-Tenant-ID` header。
- 后端：`TenantContextFilter` 读取 `X-Tenant-ID` → `TenantContext`（ThreadLocal）→ Hibernate `TenantIdentifierResolver` + `TenantSchemaConnectionProvider` 设置 PostgreSQL `search_path=tenant_<code>`。

### 1.2 步骤流转（缩略版）

1. **考生登录 & 选择租户**  
   - 前端调用 `/auth/login` 获取 JWT，调用租户相关接口选择当前租户。  
   - 之后所有请求都带 `Authorization: Bearer <token>` + `X-Tenant-ID`。

2. **考生提交报名**  
   - API：`POST /applications`，Body 为 `ApplicationSubmitRequest`（含 `examId/positionId/formVersion/payload/attachments`）。  
   - 权限：`APPLICATION_CREATE` + 当前 `X-Tenant-ID` 下必须具有 `CANDIDATE` 角色。  
   - 领域效果：在 `tenant_xxx.applications` 中创建记录，状态 `SUBMITTED`，并写入 `tenant_xxx.application_audit_logs` 一条“SUBMITTED”审计日志。

3. **自动审核（系统内部）**  
   - 由应用服务在提交后自动调用规则引擎，对年龄、学历、性别等进行规则校验。  
   - 结果：
     - 不通过 → 状态 `AUTO_REJECTED`，写审计日志；
     - 直接通过 → 状态 `AUTO_PASSED` 或 `APPROVED`（视配置而定）；
     - 需要人工审核 → 状态 `PENDING_PRIMARY_REVIEW`，在 `tenant_xxx.review_tasks` 中创建 `stage=PRIMARY` 的待办任务。

4. **初审员查看待审列表**  
   - API：`GET /reviews/pending?stage=PRIMARY`。  
   - 权限：`REVIEW_PRIMARY` 或 `EXAM_ADMIN_MANAGE`。  
   - 依据当前 `TenantContext` 与 `UserTenantRoleRepository`，过滤出当前租户内与该审核员相关的 `review_tasks` 列表。

5. **查看报名详情与历史**  
   - 报名详情：`GET /applications/{id}` → `ApplicationDetailResponse`（含 `payload/status/attachments/...`）。  
   - 审核历史：`GET /applications/{id}/reviews` → 源自 `application_audit_logs` 的只读投影。  
   - 权限：候选人通过 `APPLICATION_VIEW_OWN` 仅能看自己的申请；审核员/管理员通过 `APPLICATION_VIEW_ALL` + 审核权限查看所有申请。

6. **初审通过 / 拒绝**  
   - 当前实现：`POST /reviews/{applicationId}/approve` 或 `POST /reviews/{applicationId}/reject`，Body 为包含评论/证据的对象。  
   - 权限：`REVIEW_PRIMARY`。  
   - 领域效果：根据决策将 `applications.status` 迁移到 `PRIMARY_PASSED` / `PRIMARY_REJECTED` / `PENDING_SECONDARY_REVIEW`，并更新 `review_tasks` 与 `application_audit_logs`。

7. **复审员执行终审**  
   - 查看待审：`GET /reviews/pending?stage=SECONDARY`。  
   - 通过/拒绝：仍使用 `/approve` / `/reject` 端点，内部根据当前审核员角色判定为 SECONDARY 阶段。  
   - 状态迁移：`PENDING_SECONDARY_REVIEW` → `APPROVED` 或 `SECONDARY_REJECTED`，并记录审计日志。

8. **免费考试自动支付 & 自动发证**  
   - 当决策为 `APPROVED` 且考试为免收费：应用服务会自动执行：
     - 将申请标记为 `PAID`；
     - 在 `tenant_xxx.tickets` 创建准考证记录 `TICKET_ISSUED`；
     - 写入对应的审计日志，并发送通知。


## 2. 关键数据模型与表关系（概要）

### 2.1 公共 schema：全局用户与多租户角色

- `public.users(id, username, email, ...)`：全局用户，不包含业务意义上的 tenantId。  
- `public.tenants(id, code, name, ...)`：租户主数据。  
- `public.user_tenant_roles(id, user_id, tenant_id, role)`：多租户角色关联，角色包括 `TENANT_ADMIN/PRIMARY_REVIEWER/SECONDARY_REVIEWER/CANDIDATE` 等。

### 2.2 租户 schema：报名与审核

- `tenant_xxx.applications`：报名申请主表（`exam_id/position_id/candidate_id/status/payload/...`）。  
- `tenant_xxx.review_tasks`：审核任务表（`application_id/stage/status/assigned_to/...`）。  
- `tenant_xxx.application_audit_logs`：审计日志表，记录每一次状态迁移与决策。  
- 其他：`tenant_xxx.exams`、`positions`、`tickets` 等与报名和审核结果有关的表。


## 3. 本次已修复的关键契约差异

### 3.1 ErrorResponse：OpenAPI Schema 与实际 DTO 对齐

**问题：**  
- 后端实际返回 DTO：`ErrorResponse{ errorCode, message, details, timestamp, path }`；  
- OpenAPIConfig 中注册的 `ErrorResponse` schema 却是 `{ code, message, status, timestamp, traceId }`；  
- 前端 Zod `ErrorResponse` 是基于真实 JSON 结构解析，再 transform 成内部错误对象。

**修复：**  
- 更新 `exam-bootstrap/src/main/java/com/duanruo/exam/config/OpenApiConfig.java`：
  - `components.schemas.ErrorResponse` 的字段改为：`errorCode, message, details, timestamp, path`；
  - 描述与示例与 `ErrorResponse` DTO 保持一致；
  - 必填字段为 `errorCode, message`（`details/timestamp/path` 可选）。

**效果：**  
- OpenAPI 文档现在可以准确反映运行时的错误 JSON；  
- 以后基于 OpenAPI 自动生成的 TS client 不再在错误模型上产生误差；  
- 现有前端错误处理逻辑无需修改（仍按 `errorCode/message/...` 解析）。

### 3.2 ApplicationDetailResponse：补齐 attachments 字段

**问题：**  
- 后端 `ApplicationDetailResponse` DTO 已包含 `attachments: List<ApplicationAttachmentResponse>`；  
- 前端 `ApplicationDetailResponse` Zod schema 中未声明 `attachments`，导致类型上看不到附件字段。

**修复：**  
- 在 `web/src/lib/schemas.ts` 中新增：
  - `ApplicationAttachmentResponse` Zod schema，与后端 DTO 对齐（`fileId/fieldKey/fileName/fileSize/contentType/virusScanStatus/uploadedAt`）；
  - 在 `ApplicationDetailResponse` 中增加 `attachments: z.array(ApplicationAttachmentResponse).optional()`。

**效果：**  
- 前端在候选人详情页或审核详情页中，可以类型安全地访问附件列表；  
- 该改动是“向前兼容增强”，不会破坏已有逻辑（字段为可选）。


## 4. 后续新增/调整 API 时的契约对齐规范

1. **后端为准：先更新 DTO & Controller 注解**  
   - 新增或修改接口时，先在 application/adapter 层定义/修改 DTO；  
   - 使用 `@Schema` / `@Operation` / `@ApiResponse` 等注解在 Controller 中补齐 OpenAPI 元数据；  
   - 确保错误响应仍然统一返回标准 `ErrorResponse`。

2. **更新 OpenAPI 文档（单一真相源）**  
   - 启动后端，在 `/api/v1/v3/api-docs` 导出最新的 OpenAPI JSON；  
   - 更新 `web/openapi/exam-system-api.json`（如项目中已有该文件），并提交到版本库。

3. **前端根据 OpenAPI 更新类型与客户端**  
   - 使用既有脚本（如 `web/scripts/generate-api-client.*`）从最新 `exam-system-api.json` 生成 TS 类型与 client；  
   - 或手动更新 Zod schemas，保证字段名、类型、枚举值与 OpenAPI 完全一致；  
   - 对错误响应统一使用标准 `ErrorResponse` Zod schema。

4. **验证：编译 + 类型检查 + 合约测试**  
   - 后端至少执行一次 `mvn compile` 或模块级构建，确保 OpenApiConfig/DTO 修改可编译；  
   - 前端执行 `npm run type-check` 或同等命令，确保新的 Zod schema 与使用处类型一致；  
   - 若存在契约测试（基于 `exam-system-api.json`），需要在更新 OpenAPI 后一并修复并确保通过。

5. **文档同步更新**  
   - 每次在报名/审核流程或权限模型上做变更时：
     - 同步更新本文件与 `auth-multitenancy-openapi-baseline.md` 中的状态机描述和权限矩阵；
     - 若引入新的状态（如面试、成绩相关），需同时扩展：
       - Domain 层 `ApplicationStatus` 枚举；
       - OpenAPI 中对应字段的枚举；
       - 前端 `ApplicationStatus` Zod 枚举与 UI 显示逻辑。

> 通过以上约束，我们确保：**多租户 + 审核状态机 + OpenAPI 契约** 三者长期保持一致，
> 为后续功能扩展（如成绩管理、复试流程等）提供稳定的基础。

