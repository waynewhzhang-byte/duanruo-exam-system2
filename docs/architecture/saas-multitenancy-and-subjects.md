# SAAS 多租户与科目管理架构蓝图（基于现有代码）

本文档基于当前代码仓库（后端 Spring Boot + DDD、前端 Next.js + Playwright）做事实分析，确认：
- 多租户数据隔离与 ShardingSphere 的落地现状与数据结构设计
- 科目管理 REST 的归属与接口路径
- 由此派生的 API 契约、前端耦合点与后续 BDD 测试范围

---

## 1. 架构概览

- 后端：Spring Boot 3.2，DDD 分层（domain/application/adapter-rest/infrastructure），PostgreSQL，Flyway，JWT
- 前端：Next.js 14（App Router），Tailwind v3，Shadcn UI，/api/v1 代理到 8081
- 约定：
  - 服务器 context-path=/api/v1
  - 控制器使用资源相对路径（不在注解中写 /api 或 /v1）
  - 日期时间字符串格式：yyyy-MM-dd HH:mm:ss（Asia/Shanghai）

---

## 2. 多租户数据隔离与 ShardingSphere 落地现状

### 2.1 实际启用方案（当前生效）

当前生效的是 Hibernate 的“Schema 级多租户”方案，结合自定义连接提供者与租户解析器：
- 配置入口：exam-bootstrap/src/main/resources/application.yml
  - spring.jpa.properties.hibernate.multitenancy: SCHEMA
- Java 配置：
  - exam-bootstrap/src/main/java/com/duanruo/exam/config/HibernateMultiTenancyConfig.java
    - 将 `TenantSchemaConnectionProvider` 与 `TenantIdentifierResolver` 注入 Hibernate 属性（MULTI_TENANT_CONNECTION_PROVIDER / MULTI_TENANT_IDENTIFIER_RESOLVER）
  - exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantIdentifierResolver.java
    - 从 `TenantContext` 解析当前租户标识（默认 public）
  - exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantSchemaConnectionProvider.java
    - 基于当前租户将 `search_path` 设置为 `{schema}, public`，从 `tenants` 表解析 schema_name
  - exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantInterceptor.java
    - Web 拦截器，按优先级提取租户：`X-Tenant-ID` → URL `/tenants/{tenantId}/...` → 默认
  - exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/SchemaManagementService.java
    - 新租户初始化：创建 Schema，设置 search_path，在新 Schema 中创建业务表

结论：
- 运行时以“每请求设置 PostgreSQL search_path”的方式实现租户级 schema 路由，达到 **同库、分 Schema 隔离**。
- 与 DDD 层解耦：租户选择在适配/基础设施层完成，领域/应用层无感知。

### 2.2 ShardingSphere 的集成状态（已引入依赖，算法类就绪，尚未启用规则）

- 依赖：root pom.xml 已引入 `shardingsphere-jdbc-core`、`shardingsphere-cluster-mode-core`
- 算法类：exam-infrastructure/.../TenantSchemaShardingAlgorithm.java（实现 `StandardShardingAlgorithm<String>`，类型标识 `TENANT_SCHEMA`）
- 规则配置：
  - 在 application*.yml 中未发现 `spring.shardingsphere.*` 的启用与规则定义
  - 因此 ShardingSphere 当前未作为 DataSource 代理参与路由；仍由 Hibernate 多租户连接提供者负责 search_path 切换

建议与注意：
- 方案选择需一致：
  - 若启用 ShardingSphere 作为统一数据源代理（spring.shardingsphere.*），需评估与 Hibernate 多租户（SCHEMA）的配合与冗余；避免“双重路由”冲突
  - 当前方案稳定：Hibernate SCHEMA 多租户 + `search_path`，已能满足 SAAS 隔离
- 如需平滑引入 ShardingSphere（用于更复杂的“同库分表/分库+租户 schema”）：
  - 在 application-prod.yml 定义 `spring.shardingsphere.*`，将 ds0 代理到 PostgreSQL，注册 `TENANT_SCHEMA` 算法名，并明确各业务表（或逻辑表）映射到 `ds0.tenant_*.*`
  - 先在灰度或只读查询路径启用，逐步替代 Hibernate 层面的 search_path 逻辑

示例（参考，未在仓库中启用）：
```yaml
spring:
  shardingsphere:
    datasource:
      names: ds0
      ds0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: org.postgresql.Driver
        jdbc-url: jdbc:postgresql://localhost:5432/duanruo-exam-system
        username: postgres
        password: ******
    rules:
      sharding:
        sharding-algorithms:
          tenant-schema-algorithm:
            type: TENANT_SCHEMA
        tables:
          exams:
            actual-data-nodes: ds0.tenant_${0..999}.exams
            table-strategy:
              standard:
                sharding-column: tenant_id
                sharding-algorithm-name: tenant-schema-algorithm
```

> 说明：ShardingSphere 与 Hibernate 多租户同时使用需谨慎设计（通常择其一作为主路由层）。

### 2.3 数据结构设计（SaaS 隔离）

- public schema（全局/共享）
  - tenants（租户主表，含 id、name、code、schema_name、status、activated_at…）
  - users（全局用户，含 roles 全局角色）
  - user_tenant_roles（用户-租户-角色关联：TENANT_ADMIN、PRIMARY_REVIEWER、…）
- 各租户业务 schema（如 tenant_default、tenant_company_a…）
  - exams、positions、subjects、applications、tickets、scores、venues、seating_*、review_tasks…（与 public 下无直接业务数据耦合）
- 访问流程（运行态）
  - 请求进入 → TenantInterceptor 抽取租户 → 设置 TenantContext → Hibernate 通过 `TenantSchemaConnectionProvider` 将 search_path 指向目标 schema → ORM 查询/写入落到租户业务表


### 2.4 租户生效性验证（快速自检）

以下步骤可在本地或测试环境快速确认“租户路由是否生效”（无需引入 ShardingSphere）：

1) 以管理员登录，获取 Bearer Token（略）。
2) 创建两个租户（需要管理员权限）：
   - POST /api/v1/tenants  → 返回 tenantA.id、tenantB.id，并分别激活：POST /api/v1/tenants/{id}/activate
3) 使用租户A创建一条数据（如考试）：
   - 请求头携带：`X-Tenant-ID: {tenantA.id}`
   - POST /api/v1/exams  → 成功返回 ExamResponse
4) 分别在租户A、租户B下查询：
   - GET /api/v1/exams，`X-Tenant-ID: {tenantA.id}`  → 能看到第3步创建的考试
   - GET /api/v1/exams，`X-Tenant-ID: {tenantB.id}`  → 不应看到该考试（应为空或不包含该记录）

cURL 示例（伪）：
```bash
# 1) 登录（省略），得到 $TOKEN

# 2) 创建/激活租户
curl -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"name":"Tenant A","code":"tenant-a"}' \
     -X POST http://localhost:8081/api/v1/tenants
# 假设返回 { id: "TENANT_A_UUID", ... }

curl -H "Authorization: Bearer $TOKEN" -X POST \
     http://localhost:8081/api/v1/tenants/TENANT_A_UUID/activate

# 3) 在租户A创建考试
curl -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: TENANT_A_UUID" -H "Content-Type: application/json" \
     -d '{"title":"租户A-春季考试","code":"EXAM-A-2025"}' \
     -X POST http://localhost:8081/api/v1/exams

# 4) 分别查询
curl -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: TENANT_A_UUID" \
     http://localhost:8081/api/v1/exams

curl -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: TENANT_B_UUID" \
     http://localhost:8081/api/v1/exams
```

若未携带 `X-Tenant-ID`（且URL路径未指示租户），系统将回落至默认 schema（通常为 public），这与“租户生效失败”不同——属于“未选择具体租户”的预期行为。

---

## 3. 科目管理 REST 归属与接口

根据现有代码，科目（Subject）是“岗位（Position）的下属设置”，REST 由 PositionController 提供：exam-adapter-rest/.../PositionController.java

- 列表：GET `/positions/{id}/subjects`
- 创建：POST `/positions/{id}/subjects`
- 更新：PUT `/positions/subjects/{subjectId}`
- 删除：DELETE `/positions/subjects/{subjectId}`

说明：
- 设计与您的要求一致：科目挂在具体岗位下，不同岗位可定义不同科目集
- 与 E2E/BDD 一致：测试在创建岗位后，为该岗位创建 WRITTEN/INTERVIEW/PRACTICAL 等多种科目

---

## 4. API 契约与前端耦合

- API 栈：
  - 上下文路径：/api/v1（全局）
  - 认证：POST /auth/login → LoginResponse(token/tokenType/expiresIn/user)
  - 头部：前端可按需注入 `X-Tenant-ID` 参与路由（也可走租户选择页后由后端判定）
- 前端：
  - web/src/lib/api.ts：API_BASE=/api/v1，自动注入 Authorization 与 X-Tenant-ID（可选）
  - next.config.js：将 /api/v1/* 代理到 8081 后端
  - 登录：/login?role=admin → 成功后 push('/tenants')
  - 管理模块：/admin/{exams|positions|subjects|...}

---

## 5. 基于本蓝图的 BDD 测试范围（增量）

优先级建议：
1) 管理员登录与租户选择（已落地）

## 7. 报名表单附件上传与审核流程（现状与接口）

### 7.1 候选人端：文件上传与申请关联
- 获取上传URL（预签名）：POST `/files/upload-url`（鉴权）
  - 请求：`{ originalName, contentType, sizeHint, bizTag }`
  - 响应：`{ fileId, uploadUrl, headers, expireAt }`
- 完成上传后确认：POST `/files/{fileId}/confirm`
  - 更新文件状态、大小、扫描状态等；可随后通过 GET `/files/{fileId}` 查询详情
- 将文件关联到报名申请：POST `/applications/{id}/attachments`
  - 请求DTO：`ApplicationAttachmentUploadRequest { filename, type, (可选)fieldKey, (可选)fileId }`
  - 响应（示例）：返回 `id、applicationId、filename、type、uploadUrl` 等
- 附：下载URL：GET `/files/{fileId}/download-url`（用于回显、审核查看）

说明：当前上传路径采用“前端直传对象存储 + 预签名URL”模式，避免后端中转大文件；上传完成后再调用 `confirm` 与 `applications/{id}/attachments` 建立关联与持久化记录。

### 7.2 审核端：查看资料与做出决策
- 审核队列/任务：
  - 拉取下一条：POST `/reviews/queue/pull`（Body：`{ examId, stage: PRIMARY|SECONDARY, positionId? }`）
  - 任务心跳：POST `/reviews/tasks/{taskId}/heartbeat`
  - 释放任务：POST `/reviews/tasks/{taskId}/release`
  - 提交审结：POST `/reviews/tasks/{taskId}/decision`（Body：`{ approve: boolean, reason?: string, evidenceFileIds?: UUID[] }`）
- 任务/申请详情（含附件清单与下载链接示例）：
  - GET `/reviews/{applicationId}`（返回 `attachments: [{id, filename, type, downloadUrl}]` 等摘要）
  - GET `/applications/{id}` 与 `/applications/{id}/reviews`（查看申请详情与审核历史/审计日志）

### 7.3 审核结果类型（通过/驳回重提/拒绝）
- 已实现：
  - “通过”：
    - 初审通过 → 应用状态从 `PENDING_PRIMARY_REVIEW` → `PRIMARY_PASSED`（或进入 `PENDING_SECONDARY_REVIEW`）
    - 复审通过 → 应用状态 → `APPROVED`
    - 接口：POST `/reviews/tasks/{taskId}/decision`（`approve=true`）；或 POST `/reviews/{applicationId}/approve`
  - “拒绝”：
    - 初审拒绝 → `PRIMARY_REJECTED`；复审拒绝 → `SECONDARY_REJECTED`
    - 接口：POST `/reviews/tasks/{taskId}/decision`（`approve=false`）；或 POST `/reviews/{applicationId}/reject`
- “驳回重提”（Return for Resubmission）：
  - 已实现：在 `ApplicationStatus` 中新增 `RETURNED_FOR_RESUBMISSION`（非终态）与 `RESUBMITTED`，并放宽表单更新条件（支持在退回状态下更新）；新增重提交口。
    - 状态流转：
      - 初/复审阶段可 `RETURN` → `RETURNED_FOR_RESUBMISSION`
      - 候选人 `PUT /applications/{id}/resubmit` → `SUBMITTED` → （自动审核）→ `AUTO_PASSED|AUTO_REJECTED|PENDING_PRIMARY_REVIEW`
    - 审核接口扩展：`POST /reviews/tasks/{taskId}/decision` 支持 `action: APPROVE | RETURN | REJECT`（向下兼容 `approve` 布尔）
    - 审计：在 metadata 中记录 `stage/action/approve/evidenceFileIds`
    - 前端：候选人在“我的报名”看到“被驳回需重提”的申请，进入表单继续修改并重新提交

> 备注：若短期内不引入新状态，可用“拒绝+建议重新提交新申请”的策略权衡，但无法在同一申请编号上保留“前后差异与重提历史”的严格闭环。

### 7.4 面向 BDD 的关键场景
- 候选人：
  - 上传身份证/学历等文件（类型校验通过），确认并关联到报名 → 在“我的报名”与申请详情中可见附件缩略/下载
- 审核员（初审）：
  - 拉取队列 → 查看申请详情与附件 → 提交“通过/拒绝/（可选）驳回重提”并上传证据文件ID（evidenceFileIds）
- 审核员（复审）：
  - 队列 → 查看初审历史与附件 → 终审“通过/拒绝”

### 7.5 端点清单（汇总）
- 文件：`POST /files/upload-url`、`POST /files/{id}/confirm`、`GET /files/{id}/download-url`
- 报名附件关联：`POST /applications/{id}/attachments`
- 审核：
  - 队列与任务：`POST /reviews/queue/pull`、`POST /reviews/tasks/{id}/heartbeat`、`POST /reviews/tasks/{id}/release`、`POST /reviews/tasks/{id}/decision`
  - 详情与历史：`GET /reviews/{applicationId}`、`GET /applications/{id}`、`GET /applications/{id}/reviews`
- 审核（传统端点，已保留）：`POST /reviews/{applicationId}/approve`、`POST /reviews/{applicationId}/reject`

### 7.6 cURL 快速验收清单（本地 http://localhost:8082）
> 约定：所有请求均带上 Authorization 与 X-Tenant-ID
> - Authorization: Bearer $TOKEN
> - X-Tenant-ID: $TENANT_ID

1) 登录获取 Token（示例）
````bash
curl -s -X POST \
  'http://localhost:8082/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123@Abc"}'
````

2) 申请人：获取上传URL → 直传 → 确认
````bash
# 获取预签名上传URL
curl -s -X POST 'http://localhost:8082/api/v1/files/upload-url' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"filename":"idcard.pdf","contentType":"application/pdf"}'
# 响应: { fileId, uploadUrl }

# 直传到对象存储（示例，视存储签名实现而定）
curl -s -X PUT "$UPLOAD_URL" \
  -H 'Content-Type: application/pdf' \
  --data-binary '@idcard.pdf'

# 确认上传
curl -s -X POST "http://localhost:8082/api/v1/files/$FILE_ID/confirm" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID"
````

3) 提交报名并关联附件（以提交接口为例）
````bash
curl -s -X POST "http://localhost:8082/api/v1/applications" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "examId": "'$EXAM_ID'",
    "positionId": "'$POSITION_ID'",
    "payload": {"name":"张三","idNo":"1101..."},
    "attachments": [{"fileId":"'$FILE_ID'","fieldKey":"idcard"}]
  }'
# 或：若已有申请草稿，调用 PUT /applications/{id} 以相同结构更新
````

4) 审核员：拉取任务、查看、做出决策（支持三态）
````bash
# 拉取初审队列任务
curl -s -X POST 'http://localhost:8082/api/v1/reviews/queue/pull' \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H 'Content-Type: application/json' \
  -d '{"stage":"PRIMARY","batch":1}'
# 响应包含 taskId、applicationId

# 查看申请（含附件列表与下载URL）
curl -s "http://localhost:8082/api/v1/reviews/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID"

# 审核决策：通过/拒绝/退回
curl -s -X POST "http://localhost:8082/api/v1/reviews/tasks/$TASK_ID/decision" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H 'Content-Type: application/json' \
  -d '{"action":"APPROVE","reason":"符合要求","evidenceFileIds":[]}'
# 将 action 改为 REJECT 或 RETURN 即可（兼容 approve 布尔）
````

5) 候选人：被退回后重提
````bash
curl -s -X PUT "http://localhost:8082/api/v1/applications/$APP_ID/resubmit" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "payload": {"name":"张三","idNo":"1101...","补充":"..."},
    "attachments": [{"fileId":"'$NEW_FILE_ID'","fieldKey":"supplement"}]
  }'
# 重提后会进入 SUBMITTED 并触发自动审核 → AUTO_PASSED|AUTO_REJECTED|PENDING_PRIMARY_REVIEW
````

6) 附件下载URL（示例）
````bash
curl -s "http://localhost:8082/api/v1/files/$FILE_ID/download-url" \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID"
````


2) 考试管理：创建、开放/关闭、重复 code 校验
3) 岗位管理：在考试下创建岗位、重复 code 校验
4) 科目管理：为岗位创建多类型科目、排序/权重/分值校验（已部分落地）
5) 报名全流程（候选人）：注册/登录→选考→报名表→提交/支付（可 stub）→状态查询
6) 审核：队列/任务领取、通过/退回、统计
7) 准考证/编排：批量生成、规则校验、候选人端可见

每个 Feature 包含：
- Background：管理员/候选人存在，必要测试数据以 API 预置
- 1～3 条主干路径 + 1～2 条负例（权限/校验）
- Playwright 用例：Page Object + API 预置（ui-data-setup.ts），Shadcn 组件使用 ARIA 语义（combobox/option/role）

---

## 6. 结论与后续决策点

- 当前后端已实现稳定的 **Hibernate SCHEMA 多租户**，通过 `search_path` 精准路由；满足同库分 Schema 的数据隔离。
- ShardingSphere 处于“依赖与算法类存在，但规则未启用”的状态；若作为长期演进方向，建议在生产/灰度环境逐步引入 `spring.shardingsphere.*`，统一为代理数据源，并与 Hibernate 多租户方案做取舍或清晰分工。
- 科目管理与您的要求完全一致：REST 归属于 PositionController，科目为岗位的下属设置。
- 建议将本蓝图作为 BDD 场景设计基线，并在 CI 中加入 OpenAPI 契约校验（Diff 与 Path Lint）。

---

## 附：关键类/配置清单（定位）

- 多租户（运行时生效）
  - application.yml: `spring.jpa.properties.hibernate.multitenancy: SCHEMA`
  - HibernateMultiTenancyConfig（注册连接提供者/解析器）
  - TenantSchemaConnectionProvider（按租户设置 search_path）
  - TenantIdentifierResolver（从 TenantContext 解析）
  - TenantInterceptor（从 Header/URL 提取租户）
  - SchemaManagementService（创建租户 Schema 与业务表）
- ShardingSphere（预备/未启用）
  - 依赖：shardingsphere-jdbc-core, shardingsphere-cluster-mode-core
  - TenantSchemaShardingAlgorithm（算法类型 TENANT_SCHEMA）
  - application*.yml 尚未配置 `spring.shardingsphere.*` 规则
- 科目管理 REST（PositionController）
  - GET `/positions/{id}/subjects`
  - POST `/positions/{id}/subjects`
  - PUT `/positions/subjects/{subjectId}`
  - DELETE `/positions/subjects/{subjectId}`

