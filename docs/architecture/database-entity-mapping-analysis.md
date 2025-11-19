# 数据库表与JPA实体映射完整性分析

**生成时间**: 2025-10-29  
**分析范围**: PostgreSQL数据库表 vs Spring Boot JPA实体  
**目的**: 确认仓储层是否完整映射了所有数据库结构

---

## 📊 映射概览

| Schema | 总表数 | 已映射 | 缺失映射 | 完整度 |
|--------|--------|--------|----------|--------|
| Public Schema | 8 | 8 | 0 | ✅ 100% |
| Tenant Schema | 19 | 17 | 2 | ⚠️ 89.5% |
| **总计** | **27** | **25** | **2** | **92.6%** |

---

## 1️⃣ Public Schema 映射分析

### ✅ 完全映射（8/8）

| # | 数据库表 | JPA Entity | Repository | 迁移脚本 | 状态 |
|---|----------|------------|------------|----------|------|
| 1 | `users` | `UserEntity` | `UserJpaRepository` + `UserRepositoryImpl` | V002_1 | ✅ |
| 2 | `tenants` | `TenantEntity` | `JpaTenantRepository` + `TenantRepositoryImpl` | V010 | ✅ |
| 3 | `user_tenant_roles` | `UserTenantRoleEntity` | `JpaUserTenantRoleRepository` + `UserTenantRoleRepositoryImpl` | V010 | ✅ |
| 4 | `notification_templates` | `NotificationTemplateEntity` | `JpaNotificationTemplateRepository` + `NotificationTemplateRepositoryImpl` | V017 | ✅ |
| 5 | `notification_histories` | `NotificationHistoryEntity` | `JpaNotificationHistoryRepository` + `NotificationHistoryRepositoryImpl` | V018 | ✅ |
| 6 | `pii_access_logs` | `PIIAccessLogEntity` | *(待确认)* | V019 | ✅ |
| 7 | `tenant_backups` | `TenantBackupEntity` | `JpaTenantBackupRepository` | V020 | ✅ |
| 8 | `audit_logs` | `AuditLogEntity` | *(待确认)* | V021 | ✅ |

**结论**: Public Schema 的所有表都已完整映射到JPA实体。

---

## 2️⃣ Tenant Schema 映射分析

### ✅ 已映射表（17/19）

| # | 数据库表 | JPA Entity | Repository | 迁移脚本 | 状态 |
|---|----------|------------|------------|----------|------|
| 1 | `exams` | `ExamEntity` | `JpaExamRepository` + `ExamRepositoryImpl` | V001 | ✅ |
| 2 | `positions` | `PositionEntity` | `JpaPositionRepository` + `PositionRepositoryImpl` | V001 | ✅ |
| 3 | `subjects` | `SubjectEntity` | `JpaSubjectRepository` + `SubjectRepositoryImpl` | V001 | ✅ |
| 4 | `applications` | `ApplicationEntity` | `JpaApplicationRepository` + `ApplicationRepositoryImpl` | V001 | ✅ |
| 6 | `tickets` | `TicketEntity` | `JpaTicketRepository` + `TicketRepositoryImpl` | V001 | ✅ |
| 8 | `files` | `FileEntity` | `JpaFileRepository` | V001 | ✅ |
| 9 | `venues` | `VenueEntity` | `JpaVenueRepository` + `VenueRepositoryImpl` | V005 | ✅ |
| 10 | `allocation_batches` | `AllocationBatchEntity` | `JpaAllocationBatchRepository` + `AllocationBatchRepositoryImpl` | V005 | ✅ |
| 11 | `seat_assignments` | `SeatAssignmentEntity` | `JpaSeatAssignmentRepository` + `SeatAssignmentRepositoryImpl` | V005 | ✅ |
| 12 | `review_tasks` | `ReviewTaskEntity` | `JpaReviewTaskRepository` + `ReviewTaskRepositoryImpl` | V006 | ✅ |
| 13 | `exam_reviewers` | `ExamReviewerEntity` | `JpaExamReviewerRepository` + `ExamReviewerRepositoryImpl` | V006 | ✅ |
| 14 | `exam_admins` | `ExamAdminEntity` | `JpaExamAdminRepository` | V006 | ✅ |
| 15 | `exam_scores` | `ExamScoreEntity` | `JpaExamScoreRepository` (implements `ExamScoreRepository`) | V007 | ✅ |
| 16 | `payment_orders` | `PaymentOrderEntity` | *(待确认)* | V008 | ✅ |
| 17 | `ticket_number_rules` | `TicketNumberRuleEntity` | `JpaTicketNumberRuleRepository` + `TicketNumberRuleRepositoryImpl` | V009 | ✅ |
| 18 | `ticket_sequences` | `TicketSequenceEntity` | `TicketSequenceRepositoryImpl` | V009 | ✅ |
| 19 | `application_audit_logs` | `ApplicationAuditLogEntity` | `JpaApplicationAuditLogRepository` + `ApplicationAuditLogRepositoryImpl` | V010 | ✅ |

### ❌ 缺失映射表（2/19）

| # | 数据库表 | 迁移脚本 | 问题描述 | 建议 |
|---|----------|----------|----------|------|
| 5 | `reviews` | V001 | **缺少 `ReviewEntity`** | 选项1: 创建 `ReviewEntity` 和 `ReviewRepository`<br>选项2: 删除此表（如果已被 `review_tasks` 替代） |
| 7 | `scores` | V001 | **缺少 `ScoreEntity`** | 选项1: 创建 `ScoreEntity` 和 `ScoreRepository`<br>选项2: 删除此表（已被 `exam_scores` 替代） |

---

## 🔍 详细问题分析

### 问题 1: `reviews` 表缺少实体映射

**表结构** (V001__Create_tenant_business_tables.sql):
```sql
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    stage VARCHAR(50) NOT NULL,
    reviewer_id UUID NOT NULL,
    decision VARCHAR(50),
    comment TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**现状**:
- ✅ 数据库表存在
- ❌ 没有对应的 `ReviewEntity`
- ❌ 没有对应的 `ReviewRepository`
- ✅ 有 `ReviewTaskEntity` (V006) - 用于审核任务管理

**分析**:
- `reviews` 表用于存储审核记录（历史）
- `review_tasks` 表用于管理审核任务（工作流）
- 两者功能不同，应该都保留

**建议**: **创建 `ReviewEntity` 和 `ReviewRepository`**

---

### 问题 2: `scores` 表缺少实体映射

**表结构** (V001__Create_tenant_business_tables.sql):
```sql
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    score DECIMAL(10,2),
    status VARCHAR(50),
    recorded_by UUID,
    recorded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**现状**:
- ✅ 数据库表存在
- ❌ 没有对应的 `ScoreEntity`
- ✅ 有 `ExamScoreEntity` (V007) - 功能更完善的成绩表

**`exam_scores` 表结构** (V007__Create_score_management_tables.sql):
```sql
CREATE TABLE IF NOT EXISTS exam_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    is_absent BOOLEAN NOT NULL DEFAULT FALSE,
    graded_by UUID,
    graded_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_application_subject UNIQUE (application_id, subject_id)
);
```

**对比分析**:
| 特性 | `scores` (V001) | `exam_scores` (V007) |
|------|-----------------|----------------------|
| 缺考标记 | ❌ | ✅ `is_absent` |
| 备注字段 | ❌ | ✅ `remarks` |
| 更新时间 | ❌ | ✅ `updated_at` |
| 唯一约束 | ❌ | ✅ `uq_application_subject` |
| JPA实体 | ❌ | ✅ `ExamScoreEntity` |
| Repository | ❌ | ✅ `JpaExamScoreRepository` |

**建议**: **删除 `scores` 表，统一使用 `exam_scores` 表**

---

## 📋 修复建议

### 方案 A: 创建缺失的实体（推荐用于 `reviews` 表）

#### 1. 创建 `ReviewEntity`

```java
@Entity
@Table(name = "reviews")
public class ReviewEntity {
    @Id
    private UUID id;
    
    @Column(name = "application_id", nullable = false)
    private UUID applicationId;
    
    @Column(name = "stage", nullable = false, length = 50)
    private String stage;
    
    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;
    
    @Column(name = "decision", length = 50)
    private String decision;
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Getters and Setters
}
```

#### 2. 创建 `JpaReviewRepository`

```java
@Repository
public interface JpaReviewRepository extends JpaRepository<ReviewEntity, UUID> {
    List<ReviewEntity> findByApplicationId(UUID applicationId);
    List<ReviewEntity> findByReviewerId(UUID reviewerId);
    List<ReviewEntity> findByStage(String stage);
}
```

### 方案 B: 删除遗留表（推荐用于 `scores` 表）

#### 创建迁移脚本删除 `scores` 表

**文件**: `exam-infrastructure/src/main/resources/db/tenant-migration/V011__Drop_legacy_scores_table.sql`

```sql
-- 删除遗留的 scores 表
-- 原因：已被 exam_scores 表替代（V007）

-- 检查是否有数据
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM scores;
    IF row_count > 0 THEN
        RAISE EXCEPTION 'scores 表中仍有 % 条数据，请先迁移数据到 exam_scores 表', row_count;
    END IF;
END $$;

-- 删除表
DROP TABLE IF EXISTS scores CASCADE;

-- 记录日志
COMMENT ON SCHEMA current_schema() IS 'Dropped legacy scores table in favor of exam_scores (V011)';
```

---

## ✅ 验证清单

### 验证步骤

1. **检查所有Entity文件是否存在**
```bash
ls -la exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/entity/
```

2. **检查所有Repository文件是否存在**
```bash
ls -la exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/repository/
```

3. **验证数据库表与Entity的映射**
```sql
-- 在 tenant_test_company_a schema 中执行
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tenant_test_company_a' 
ORDER BY table_name;
```

4. **检查是否有孤立的Entity（没有对应的表）**
- 通过启动应用并查看Hibernate日志
- 检查是否有 "Table not found" 错误

5. **检查是否有孤立的表（没有对应的Entity）**
- 对比上述映射表
- 确认 `reviews` 和 `scores` 表的处理方案

---

## 📊 总结

### 当前状态
- ✅ **Public Schema**: 100% 完整映射（8/8）
- ⚠️ **Tenant Schema**: 89.5% 映射（17/19）
- 📈 **总体完整度**: 92.6%（25/27）

### 待处理问题
1. ❌ `reviews` 表缺少 `ReviewEntity` 和 `ReviewRepository`
2. ❌ `scores` 表缺少 `ScoreEntity`（建议删除，已被 `exam_scores` 替代）

### 推荐行动
1. **立即**: 创建 `ReviewEntity` 和 `ReviewRepository`
2. **立即**: 创建迁移脚本删除 `scores` 表
3. **验证**: 重新编译并启动应用，确认无错误
4. **测试**: 运行完整的BDD测试套件

---

## 📝 附录：完整Entity列表

### Public Schema Entities (8个)
1. `UserEntity` → `users`
2. `TenantEntity` → `tenants`
3. `UserTenantRoleEntity` → `user_tenant_roles`
4. `NotificationTemplateEntity` → `notification_templates`
5. `NotificationHistoryEntity` → `notification_histories`
6. `PIIAccessLogEntity` → `pii_access_logs`
7. `TenantBackupEntity` → `tenant_backups`
8. `AuditLogEntity` → `audit_logs`

### Tenant Schema Entities (17个已映射 + 2个缺失)
1. `ExamEntity` → `exams` ✅
2. `PositionEntity` → `positions` ✅
3. `SubjectEntity` → `subjects` ✅
4. `ApplicationEntity` → `applications` ✅
5. **❌ 缺失** → `reviews`
6. `TicketEntity` → `tickets` ✅
7. **❌ 缺失** → `scores` (建议删除表)
8. `FileEntity` → `files` ✅
9. `VenueEntity` → `venues` ✅
10. `AllocationBatchEntity` → `allocation_batches` ✅
11. `SeatAssignmentEntity` → `seat_assignments` ✅
12. `ReviewTaskEntity` → `review_tasks` ✅
13. `ExamReviewerEntity` → `exam_reviewers` ✅
14. `ExamAdminEntity` → `exam_admins` ✅
15. `ExamScoreEntity` → `exam_scores` ✅
16. `PaymentOrderEntity` → `payment_orders` ✅
17. `TicketNumberRuleEntity` → `ticket_number_rules` ✅
18. `TicketSequenceEntity` → `ticket_sequences` ✅
19. `ApplicationAuditLogEntity` → `application_audit_logs` ✅

---

**文档版本**: 1.0  
**最后更新**: 2025-10-29

