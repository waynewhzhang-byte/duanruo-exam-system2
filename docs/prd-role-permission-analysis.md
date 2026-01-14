# PRD角色权限分析报告

**基于文档**: `SAAS-PRD.md`  
**分析日期**: 2025-01-XX

---

## 1. PRD中定义的角色

根据 `SAAS-PRD.md`，系统定义了4个主要角色：

| 角色 | 范围 | PRD描述的主要职责 |
|------|------|-----------------|
| **系统超级管理员** (System Admin) | 全局 | 创建租户、创建租户管理员、管理租户状态 |
| **租户管理员** (Tenant Admin) | 租户级 | 管理考试/岗位/表单/审核员/模板设置 |
| **审核员** (Reviewer) | 租户级 | 审阅报名表、附件，执行人工审核 |
| **考生** (Candidate) | 全局 | 报名考试、提交资料、缴费、查看准考证 |

---

## 2. 角色权限需求分析（基于PRD用户故事）

### 2.1 系统超级管理员 (SUPER_ADMIN)

**PRD要求的功能**:
1. ✅ 创建租户 → 自动创建schema
2. ✅ 启用/停用租户
3. ✅ 查看租户信息、考试数量、考生数量
4. ✅ 创建租户管理员
5. ✅ 初始化租户资源（MinIO/S3 Bucket）
6. ✅ 系统监控

**应该拥有的权限**:
- `TENANT_CREATE` ✅
- `TENANT_UPDATE` ✅
- `TENANT_DELETE` ✅
- `TENANT_VIEW` ✅
- `TENANT_VIEW_ALL` ✅
- `TENANT_ACTIVATE` ✅
- `TENANT_DEACTIVATE` ✅
- `USER_CREATE` ✅
- `USER_MANAGE` ✅
- `SYSTEM_MONITOR` ✅
- `SYSTEM_CONFIG` ✅

### 2.2 租户管理员 (TENANT_ADMIN)

**PRD要求的功能**:
1. ✅ 创建考试
2. ✅ 配置岗位
3. ✅ 配置科目
4. ✅ 创建报名表单（表单构建器）
5. ✅ 设置自动审核规则
6. ✅ 分配审核员
7. ✅ 查看报名申请
8. ✅ 管理审核员（创建、分配）
9. ✅ 管理准考证模板
10. ✅ 管理考场和座位安排
11. ✅ 成绩录入（CSV导入/人工录入）
12. ✅ 查看统计报表
13. ✅ 查看支付配置
14. ✅ 管理租户内用户

**应该拥有的权限**:
- `EXAM_CREATE` ✅
- `EXAM_UPDATE` ✅
- `EXAM_DELETE` ✅
- `EXAM_VIEW` ✅
- `EXAM_OPEN` ✅
- `EXAM_CLOSE` ✅
- `EXAM_FORM_CONFIG` ✅
- `POSITION_CREATE` ✅
- `POSITION_UPDATE` ✅
- `POSITION_DELETE` ✅
- `POSITION_VIEW` ✅
- `SUBJECT_CREATE` ✅
- `SUBJECT_UPDATE` ✅
- `SUBJECT_DELETE` ✅
- `SUBJECT_VIEW` ✅
- `APPLICATION_VIEW_ALL` ✅
- `APPLICATION_BULK_OPERATION` ✅
- `REVIEW_PRIMARY` ✅ (可以审核)
- `REVIEW_SECONDARY` ✅ (可以审核)
- `REVIEW_STATISTICS` ✅
- `TICKET_GENERATE` ✅
- `TICKET_BATCH_GENERATE` ✅
- `TICKET_TEMPLATE_VIEW` ✅
- `TICKET_TEMPLATE_UPDATE` ✅
- `VENUE_CREATE` ✅
- `VENUE_UPDATE` ✅
- `VENUE_DELETE` ✅
- `VENUE_VIEW` ✅
- `SEAT_ALLOCATE` ✅
- `SEAT_VIEW` ✅
- `SEATING_ALLOCATE` ✅
- `SCORE_RECORD` ✅
- `SCORE_VIEW` ✅
- `SCORE_UPDATE` ✅
- `SCORE_BATCH_IMPORT` ✅
- `SCORE_STATISTICS` ✅
- `STATISTICS_VIEW` ✅
- `REPORT_VIEW` ✅
- `REPORT_EXPORT` ✅
- `PAYMENT_VIEW` ✅
- `PAYMENT_CONFIG_VIEW` ✅
- `TENANT_USER_MANAGE` ✅
- `USER_CREATE_TENANT` ✅
- `USER_TENANT_ROLE_GRANT` ✅
- `EXAM_ADMIN_MANAGE` ✅ (管理考试管理员)
- `FILE_VIEW` ✅ (查看申请附件)
- `FILE_DELETE` ✅

### 2.3 审核员 (PRIMARY_REVIEWER / SECONDARY_REVIEWER)

**PRD要求的功能**:
1. ✅ 查看报名表
2. ✅ 查看上传文件（学历证明、资格证、照片等）
3. ✅ 执行"通过/退回/拒绝"操作
4. ✅ 查看自动审核结果
5. ✅ 添加审核备注
6. ✅ 查看审核任务

**应该拥有的权限**:
- `APPLICATION_VIEW_ASSIGNED` ✅
- `REVIEW_PRIMARY` (一级审核员) ✅
- `REVIEW_SECONDARY` (二级审核员) ✅
- `REVIEW_STATISTICS` ✅
- `FILE_VIEW` ✅ (查看附件)
- `FILE_UPLOAD` ✅ (可能需要上传审核备注附件)

### 2.4 考生 (CANDIDATE)

**PRD要求的功能**:
1. ✅ 报名考试
2. ✅ 填写报名表单
3. ✅ 上传附件（证件照、身份证、资格证等）
4. ✅ 缴费（微信/支付宝）
5. ✅ 查看准考证
6. ✅ 查看成绩
7. ✅ 查看自己的申请状态

**应该拥有的权限**:
- `APPLICATION_CREATE` ✅
- `APPLICATION_VIEW_OWN` ✅
- `APPLICATION_UPDATE_OWN` ✅
- `APPLICATION_WITHDRAW` ✅
- `APPLICATION_PAY` ✅
- `FILE_UPLOAD` ✅
- `FILE_VIEW_OWN` ✅
- `PAYMENT_CREATE` ✅
- `PAYMENT_INITIATE` ✅
- `TICKET_VIEW_OWN` ✅
- `TICKET_DOWNLOAD` ✅
- `EXAM_VIEW_PUBLIC` ✅
- `SCORE_VIEW_OWN` ✅
- `APPLICATION_DRAFT_SAVE` ✅
- `APPLICATION_DRAFT_UPDATE` ✅
- `APPLICATION_DRAFT_LIST` ✅

---

## 3. 权限不匹配问题分析

### 3.1 TENANT_ADMIN缺失的权限

根据PRD分析，以下权限TENANT_ADMIN应该拥有但目前可能缺失：

#### ❌ 问题1: TICKET_TEMPLATE_DELETE
**PRD要求**: 租户管理员可以管理准考证模板（包括删除）
**当前状态**: `Role.TENANT_ADMIN` 没有 `TICKET_TEMPLATE_DELETE`
**影响**: 无法删除准考证模板

#### ❌ 问题2: TICKET_DOWNLOAD
**PRD要求**: 租户管理员应该可以下载准考证（用于验证或打印）
**当前状态**: `Role.TENANT_ADMIN` 没有 `TICKET_DOWNLOAD`
**影响**: 无法下载准考证

#### ⚠️ 问题3: AUDIT_VIEW
**PRD要求**: 租户管理员应该可以查看审计日志
**当前状态**: `Role.TENANT_ADMIN` 没有 `AUDIT_VIEW`
**影响**: 无法查看操作审计日志

#### ⚠️ 问题4: TEMPLATE_CREATE / TEMPLATE_UPDATE / TEMPLATE_DELETE
**PRD要求**: 租户管理员可以管理通知模板
**当前状态**: `Role.TENANT_ADMIN` 只有 `TEMPLATE_VIEW`
**影响**: 无法创建/更新/删除通知模板

### 3.2 PRIMARY_REVIEWER / SECONDARY_REVIEWER缺失的权限

#### ⚠️ 问题5: APPLICATION_VIEW_BASIC
**PRD要求**: 审核员需要查看申请基本信息
**当前状态**: 只有 `APPLICATION_VIEW_ASSIGNED`
**影响**: 可能无法查看某些基本信息

### 3.3 Controller权限使用问题

#### ❌ 问题6: 规则验证权限
**位置**: `RuleController.java:37`
```java
@PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
```
**问题**: 租户管理员应该也能验证规则配置
**建议**: 改为 `hasAnyAuthority('EXAM_ADMIN_MANAGE', 'EXAM_FORM_CONFIG')`

---

## 4. 修复方案

### 4.1 修复TENANT_ADMIN权限

在 `Role.TENANT_ADMIN` 中添加缺失的权限：

```java
Permission.TICKET_TEMPLATE_DELETE,  // 删除准考证模板
Permission.TICKET_DOWNLOAD,          // 下载准考证
Permission.AUDIT_VIEW,               // 查看审计日志
Permission.TEMPLATE_CREATE,          // 创建通知模板
Permission.TEMPLATE_UPDATE,          // 更新通知模板
Permission.TEMPLATE_DELETE,          // 删除通知模板
```

### 4.2 修复审核员权限

在 `Role.PRIMARY_REVIEWER` 和 `Role.SECONDARY_REVIEWER` 中添加：

```java
Permission.APPLICATION_VIEW_BASIC,   // 查看申请基本信息
```

### 4.3 修复Controller权限

修改 `RuleController.java`:

```java
@PreAuthorize("hasAnyAuthority('EXAM_ADMIN_MANAGE', 'EXAM_FORM_CONFIG')")
```

---

## 5. 验证清单

修复后需要验证：

- [ ] TENANT_ADMIN可以删除准考证模板
- [ ] TENANT_ADMIN可以下载准考证
- [ ] TENANT_ADMIN可以查看审计日志
- [ ] TENANT_ADMIN可以管理通知模板
- [ ] 审核员可以查看申请基本信息
- [ ] 租户管理员可以验证规则配置

---

## 6. 总结

### 发现的问题
1. ❌ TENANT_ADMIN缺少 `TICKET_TEMPLATE_DELETE`
2. ❌ TENANT_ADMIN缺少 `TICKET_DOWNLOAD`
3. ⚠️ TENANT_ADMIN缺少 `AUDIT_VIEW`
4. ⚠️ TENANT_ADMIN缺少通知模板管理权限
5. ⚠️ 审核员缺少 `APPLICATION_VIEW_BASIC`
6. ⚠️ 规则验证权限过于严格

### 修复优先级
- **P0**: TICKET_TEMPLATE_DELETE, TICKET_DOWNLOAD (核心功能)
- **P1**: AUDIT_VIEW, 通知模板权限 (重要功能)
- **P2**: APPLICATION_VIEW_BASIC, 规则验证权限 (增强功能)

