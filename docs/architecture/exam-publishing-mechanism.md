# 考试发布机制架构设计

## 背景

考生（Candidate）是全局角色，可以报名多个租户的考试。当前架构中，考试信息存储在各个租户的独立 Schema 中，导致考生无法跨租户查看开放的考试。

## 问题分析

### 当前问题
1. 考试数据隔离在租户 Schema 中，全局查询需要遍历所有租户
2. 动态 UNION ALL 查询性能差、不可扩展
3. 没有考试发布的生命周期管理
4. 租户隔离和全局可见性的边界不清晰

### 业务需求
1. 考生在 `/candidate/exams` 可以看到所有租户发布的考试
2. 考生选择考试后，进入对应租户的报名流程
3. 租户发布考试时，考试信息对全局考生可见
4. 考试状态变更时，全局目录同步更新

## 架构设计

### 核心思路

采用 **事件驱动的发布机制 + 全局考试目录表**：

```
┌─────────────────────────────────────────────────────────────────┐
│                        public schema                             │
│  ┌─────────────┐    ┌─────────────────────┐    ┌─────────────┐  │
│  │   tenants   │    │  published_exams    │    │    users    │  │
│  └─────────────┘    │  (全局考试目录)      │    └─────────────┘  │
│         │           └─────────────────────┘                      │
│         │                    ▲                                   │
└─────────│────────────────────│───────────────────────────────────┘
          │                    │ 发布/同步
          │           ┌────────┴────────┐
          │           │ ExamPublishing  │
          │           │    Service      │
          │           └────────┬────────┘
          │                    │ 事件驱动
          ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      tenant_xxx schema                           │
│  ┌─────────┐    ┌───────────┐    ┌──────────────┐              │
│  │  exams  │───▶│ positions │───▶│   subjects   │              │
│  └─────────┘    └───────────┘    └──────────────┘              │
│       │                                                          │
│       │ 状态变更触发事件                                          │
│       ▼                                                          │
│  ExamOpenedEvent / ExamClosedEvent / ExamUpdatedEvent           │
└─────────────────────────────────────────────────────────────────┘
```

### 数据模型

#### 1. 全局考试目录表 (public.published_exams)

```sql
CREATE TABLE public.published_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    exam_id UUID NOT NULL,  -- 租户schema中的考试ID
    
    -- 考试基本信息（快照）
    code VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    exam_start TIMESTAMP,
    exam_end TIMESTAMP,
    fee_required BOOLEAN DEFAULT FALSE,
    fee_amount DECIMAL(10,2),
    
    -- 状态
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    
    -- 统计信息
    position_count INT DEFAULT 0,
    
    -- 时间戳
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, exam_id)
);

CREATE INDEX idx_published_exams_status ON public.published_exams(status);
CREATE INDEX idx_published_exams_tenant ON public.published_exams(tenant_id);
```

### 领域事件

| 事件 | 触发时机 | 处理逻辑 |
|------|----------|----------|
| ExamOpenedEvent | 考试从DRAFT变为OPEN | 创建或更新 published_exams 记录 |
| ExamClosedEvent | 考试从OPEN变为CLOSED | 更新 published_exams 状态 |
| ExamUpdatedEvent | 考试信息修改 | 同步更新 published_exams |
| ExamCompletedEvent | 考试完成 | 更新状态或删除记录 |

### 服务设计

```java
// 考试发布服务
@Service
public class ExamPublishingService {
    void publishExam(TenantId tenantId, Exam exam);
    void updatePublishedExam(TenantId tenantId, Exam exam);
    void updateStatus(TenantId tenantId, ExamId examId, ExamStatus status);
    void unpublish(TenantId tenantId, ExamId examId);
}

// 公开考试查询服务
@Service  
public class PublishedExamQueryService {
    List<PublishedExamDTO> findAllOpen();
    Optional<PublishedExamDTO> findById(UUID id);
    List<PublishedExamDTO> findByTenant(TenantId tenantId);
}
```

## 用户流程

### 考生查看和报名流程

```
1. 考生访问 /candidate/exams
   ↓
2. GET /api/v1/public/exams/open → 查询 published_exams
   ↓
3. 显示考试列表（含租户名称、考试标题、报名时间等）
   ↓
4. 考生点击"查看详情"
   ↓
5. 跳转到 /{tenantCode}/exams/{examId}
   ↓
6. 在租户上下文中显示详情和报名表单
   ↓
7. 考生提交报名（在租户内完成）
```

### 管理员发布考试流程

```
1. 创建考试（DRAFT）→ 配置岗位/科目 → 配置报名表单
   ↓
2. 点击"开放报名"
   ↓
3. Exam.open() → 触发 ExamOpenedEvent
   ↓
4. ExamPublishingEventHandler 处理事件
   ↓
5. 写入 public.published_exams
   ↓
6. 考试对全局考生可见
```

## 实现要点

1. **事务一致性**：状态变更和发布在同一事务
2. **幂等处理**：使用 UPSERT 避免重复发布问题
3. **补偿机制**：定时任务检查并修复数据不一致
4. **性能优化**：全局目录可缓存

## 下一步实施计划

1. 创建 `published_exams` 表（Flyway迁移）
2. 实现 `ExamPublishingService`
3. 在 `Exam.open()` 中触发发布事件
4. 修改公开考试查询API使用新表
5. 更新前端跳转逻辑

