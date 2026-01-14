# BDD测试结构设计文档

## 1. 测试分层策略

基于PRD业务流程（Section 9）和用户故事依赖关系，BDD测试分为以下层次：

```
第0层: 基础设施层 (Infrastructure) - 系统级前置条件
  └─ 第1层: 租户与用户层 (Tenant & User) - 多租户基础
      └─ 第2层: 考试配置层 (Exam Setup) - 考试内容配置
          └─ 第3层: 报名流程层 (Registration Flow) - 考生报名与审核
              └─ 第4层: 考务管理层 (Exam Operations) - 考场、座位、准考证
                  └─ 第5层: 成绩管理层 (Score Management) - 成绩录入与查询
                      └─ 第6层: 端到端集成层 (E2E Integration) - 完整业务流程
```

## 2. 各层测试详细规划

### 第0层: 基础设施层 (Infrastructure)
**目标**: 验证系统基础设施就绪
**依赖**: 无
**标签**: `@p0 @infrastructure @smoke`

| 测试文件 | 业务场景 | 关键验证点 |
|---------|---------|-----------|
| `00-system-health.feature` | 系统健康检查 | 数据库连接、API可用性 |

---

### 第1层: 租户与用户层 (Tenant & User)
**目标**: 验证多租户架构和SSO用户体系
**依赖**: 第0层
**标签**: `@p0 @tenant @user @smoke`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `01-super-admin-login.feature` | 超级管理员登录 | JWT认证、权限验证 | 系统健康 |
| `02-tenant-creation.feature` | 租户创建 | Schema创建、默认配置 | 超管登录 |
| `03-tenant-storage-init.feature` | 租户存储初始化 | MinIO Bucket创建、路径隔离 | 租户创建 |
| `04-tenant-admin-creation.feature` | 租户管理员创建 | 用户-租户-角色关联 | 租户创建 |
| `05-tenant-isolation.feature` | 多租户数据隔离 | Schema隔离、权限隔离 | 多租户存在 |
| `06-candidate-sso.feature` | 考生SSO跨租户 | 全局用户、多租户报名 | 多租户存在 |

---

### 第2层: 考试配置层 (Exam Setup)
**目标**: 验证考试内容配置功能
**依赖**: 第1层（租户管理员已创建）
**标签**: `@p0 @exam-setup @admin`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `10-exam-basic-creation.feature` | 考试基本信息创建 | 考试创建、状态管理 | 租户管理员 |
| `11-position-management.feature` | 岗位管理 | 岗位创建、要求配置 | 考试创建 |
| `12-subject-management.feature` | 科目管理 | 科目创建、岗位关联 | 岗位创建 |
| `13-form-builder-basic.feature` | 表单构建器-字段管理 | 拖拽添加字段、字段配置 | 考试创建 |
| `14-form-builder-validation.feature` | 表单构建器-校验规则 | 字段校验、条件逻辑 | 字段管理 |
| `15-form-builder-publish.feature` | 表单构建器-发布管理 | 版本管理、发布流程 | 表单完整配置 |
| `16-auto-review-rules-basic.feature` | 自动审核规则-基础规则 | 年龄、性别、学历规则 | 考试创建 |
| `17-auto-review-rules-advanced.feature` | 自动审核规则-高级规则 | 复合规则、优先级 | 基础规则 |
| `18-auto-review-rules-test.feature` | 自动审核规则-测试验证 | 规则测试、执行统计 | 规则配置 |
| `19-reviewer-assignment.feature` | 审核员分配 | 一级/二级审核员创建与分配 | 考试创建 |
| `20-exam-publish.feature` | 考试发布 | 配置检查、开放报名 | 所有配置完成 |

---

### 第3层: 报名流程层 (Registration Flow)
**目标**: 验证考生报名与审核流程
**依赖**: 第2层（考试已发布）
**标签**: `@p0 @registration @candidate @reviewer`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `30-candidate-registration.feature` | 考生注册与登录 | 考生账号创建、SSO登录 | 系统可用 |
| `31-exam-browse-apply.feature` | 浏览考试并报名 | 考试列表、报名入口 | 考试发布 |
| `32-application-form-fill.feature` | 填写报名表单 | 表单渲染、字段验证 | 考生登录 |
| `33-attachment-upload.feature` | 附件上传 | MinIO上传、预览、删除 | 表单填写 |
| `34-application-submit.feature` | 提交报名申请 | 草稿保存、提交审核 | 表单完成 |
| `35-auto-review-execution.feature` | 自动审核执行 | 规则引擎执行、结果判定 | 申请提交 |
| `36-primary-review.feature` | 一级人工审核 | 审核队列、通过/拒绝 | 自动审核通过 |
| `37-secondary-review.feature` | 二级人工审核 | 最终审核、审核意见 | 一级审核通过 |
| `38-review-batch-operations.feature` | 批量审核操作 | 批量通过/拒绝 | 审核权限 |
| `39-application-status-query.feature` | 报名状态查询 | 考生查看状态、审核结果 | 申请存在 |

---

### 第4层: 支付与准考证层 (Payment & Ticket)
**目标**: 验证缴费和准考证生成
**依赖**: 第3层（审核通过）
**标签**: `@p0 @payment @ticket`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `40-payment-order-creation.feature` | 创建支付订单 | 微信/支付宝订单 | 审核通过 |
| `41-payment-callback.feature` | 支付回调处理 | 回调验证、状态更新 | 订单创建 |
| `42-payment-timeout.feature` | 支付超时处理 | 订单关闭、重新支付 | 订单存在 |
| `43-payment-refund.feature` | 支付退款流程 | 退款申请、审核、执行 | 已支付 |
| `44-admission-ticket-template.feature` | 准考证模板管理 | 模板创建、变量配置 | 租户管理员 |
| `45-admission-ticket-generation.feature` | 准考证生成 | PDF生成、准考证号 | 支付成功 |
| `46-admission-ticket-qrcode.feature` | 准考证二维码 | 二维码生成、内容编码 | 准考证生成 |
| `47-admission-ticket-download.feature` | 准考证下载 | PDF下载、预览 | 准考证存在 |

---

### 第5层: 考务管理层 (Exam Operations)
**目标**: 验证考场和座位安排
**依赖**: 第3层（报名截止）
**标签**: `@p1 @exam-ops @admin`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `50-exam-close-registration.feature` | 关闭报名 | 状态变更、停止报名 | 报名进行中 |
| `51-venue-configuration.feature` | 考场配置 | 考场、教室创建 | 租户管理员 |
| `52-seat-allocation-strategy.feature` | 座位分配策略 | 按岗位分组、随机分配 | 考场配置 |
| `53-seat-allocation-execution.feature` | 座位分配执行 | 自动分配、冲突检测 | 报名关闭 |
| `54-seat-manual-adjustment.feature` | 座位手工调整 | 调整座位、重新分配 | 座位已分配 |
| `55-seat-export.feature` | 座位表导出 | Excel导出、打印 | 座位已分配 |
| `56-ticket-update-seat-info.feature` | 准考证更新座位 | 座位信息更新 | 座位分配完成 |

---

### 第6层: 成绩管理层 (Score Management)
**目标**: 验证成绩录入和查询
**依赖**: 第5层（考试结束）
**标签**: `@p1 @score @admin @candidate`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `60-score-manual-entry.feature` | 成绩人工录入 | 单个录入、编辑 | 考试结束 |
| `61-score-csv-import.feature` | 成绩CSV批量导入 | 文件解析、批量导入 | 考试结束 |
| `62-score-import-validation.feature` | 导入数据验证 | 格式校验、错误报告 | CSV导入 |
| `63-score-calculation.feature` | 成绩计算 | 总分、是否进入面试 | 成绩录入 |
| `64-score-admin-query.feature` | 管理员成绩查询 | 搜索、筛选、导出 | 成绩存在 |
| `65-score-candidate-query.feature` | 考生成绩查询 | 个人成绩、科目明细 | 成绩存在 |
| `66-score-statistics.feature` | 成绩统计分析 | 平均分、分布图 | 成绩存在 |

---

### 第7层: 端到端集成层 (E2E Integration)
**目标**: 验证完整业务流程打通
**依赖**: 所有前序层
**标签**: `@e2e @integration @smoke`

| 测试文件 | 业务场景 | 关键验证点 | 依赖 |
|---------|---------|-----------|-----|
| `90-e2e-full-workflow.feature` | 完整考试报名流程 | 从租户创建到成绩查询 | 所有层 |
| `91-e2e-multi-tenant.feature` | 多租户并发场景 | 数据隔离、并发安全 | 所有层 |
| `92-e2e-cross-tenant-sso.feature` | 跨租户SSO场景 | 考生多租户报名 | 所有层 |
| `93-e2e-performance.feature` | 性能压力场景 | 10万+报名、并发处理 | 所有层 |

---

## 3. 测试执行策略

### 3.1 执行顺序
```bash
# 阶段1: 基础设施验证 (必须通过)
npm run test:bdd -- tests/bdd/features/00-infrastructure/

# 阶段2: 租户与用户 (必须通过)
npm run test:bdd -- tests/bdd/features/01-tenant-user/

# 阶段3: 考试配置 (核心功能)
npm run test:bdd -- tests/bdd/features/02-exam-setup/

# 阶段4: 报名流程 (核心功能)
npm run test:bdd -- tests/bdd/features/03-registration/

# 阶段5: 支付与准考证 (核心功能)
npm run test:bdd -- tests/bdd/features/04-payment-ticket/

# 阶段6: 考务管理 (扩展功能)
npm run test:bdd -- tests/bdd/features/05-exam-ops/

# 阶段7: 成绩管理 (扩展功能)
npm run test:bdd -- tests/bdd/features/06-score/

# 阶段8: 端到端集成 (回归测试)
npm run test:bdd -- tests/bdd/features/07-e2e/
```

### 3.2 优先级标签
- `@smoke`: 冒烟测试，每次构建必跑
- `@p0`: 核心功能，每日回归必跑
- `@p1`: 重要功能，发版前必跑
- `@p2`: 辅助功能，可选

### 3.3 失败处理策略
- 某一层测试失败 → 停止执行后续层测试
- 记录失败场景 → 修复后重新执行该层及后续层
- 独立场景失败 → 可跳过继续执行同层其他场景

---

## 4. 测试数据管理

### 4.1 测试数据隔离
- 每层使用独立的测试数据前缀
- 示例：
  - 第1层：`tenant_test_l1_*`
  - 第2层：`exam_test_l2_*`
  - 第3层：`candidate_test_l3_*`

### 4.2 测试数据清理
- 每层测试前：清理该层数据
- 每层测试后：保留数据供后续层使用
- E2E测试后：完整清理所有测试数据

---

## 5. 目录结构

```
web/tests/bdd/features/
├── 00-infrastructure/
│   └── system-health.feature
├── 01-tenant-user/
│   ├── super-admin-login.feature
│   ├── tenant-creation.feature
│   ├── tenant-storage-init.feature
│   ├── tenant-admin-creation.feature
│   ├── tenant-isolation.feature
│   └── candidate-sso.feature
├── 02-exam-setup/
│   ├── exam-basic-creation.feature
│   ├── position-management.feature
│   ├── subject-management.feature
│   ├── form-builder-basic.feature
│   ├── form-builder-validation.feature
│   ├── form-builder-publish.feature
│   ├── auto-review-rules-basic.feature
│   ├── auto-review-rules-advanced.feature
│   ├── auto-review-rules-test.feature
│   ├── reviewer-assignment.feature
│   └── exam-publish.feature
├── 03-registration/
│   ├── candidate-registration.feature
│   ├── exam-browse-apply.feature
│   ├── application-form-fill.feature
│   ├── attachment-upload.feature
│   ├── application-submit.feature
│   ├── auto-review-execution.feature
│   ├── primary-review.feature
│   ├── secondary-review.feature
│   ├── review-batch-operations.feature
│   └── application-status-query.feature
├── 04-payment-ticket/
│   ├── payment-order-creation.feature
│   ├── payment-callback.feature
│   ├── payment-timeout.feature
│   ├── payment-refund.feature
│   ├── admission-ticket-template.feature
│   ├── admission-ticket-generation.feature
│   ├── admission-ticket-qrcode.feature
│   └── admission-ticket-download.feature
├── 05-exam-ops/
│   ├── exam-close-registration.feature
│   ├── venue-configuration.feature
│   ├── seat-allocation-strategy.feature
│   ├── seat-allocation-execution.feature
│   ├── seat-manual-adjustment.feature
│   ├── seat-export.feature
│   └── ticket-update-seat-info.feature
├── 06-score/
│   ├── score-manual-entry.feature
│   ├── score-csv-import.feature
│   ├── score-import-validation.feature
│   ├── score-calculation.feature
│   ├── score-admin-query.feature
│   ├── score-candidate-query.feature
│   └── score-statistics.feature
└── 07-e2e/
    ├── full-workflow.feature
    ├── multi-tenant.feature
    ├── cross-tenant-sso.feature
    └── performance.feature
```

---

## 6. 持续集成配置

### CI Pipeline示例
```yaml
# .github/workflows/bdd-tests.yml
stages:
  - smoke      # @smoke 冒烟测试
  - layer-1    # 租户与用户层
  - layer-2    # 考试配置层
  - layer-3    # 报名流程层
  - layer-4    # 支付与准考证层
  - layer-5    # 考务管理层
  - layer-6    # 成绩管理层
  - e2e        # 端到端集成测试
```

每个阶段失败 → 停止后续阶段执行

---

## 7. 报告生成

每层测试生成独立报告：
- `test-results/bdd/layer-0-infrastructure.html`
- `test-results/bdd/layer-1-tenant-user.html`
- `test-results/bdd/layer-2-exam-setup.html`
- ...
- `test-results/bdd/layer-7-e2e.html`

汇总报告：`test-results/bdd/summary.html`
