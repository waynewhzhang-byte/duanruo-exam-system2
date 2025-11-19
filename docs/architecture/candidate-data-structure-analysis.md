# 考生（Candidate）数据结构分析

## 问题

您提出的疑问：
> "candidates这个是针对全局用户中的考生角色，其可以参加多个不同考试（考试可能在不同租户下定义，但是我在租户schema中没有看到candidates的身份，请根据jpa进行分析数据结构"

## 核心发现：系统中**没有独立的candidates表**

经过对JPA实体和数据库迁移脚本的全面分析，得出以下结论：

### 1. 数据库层面

**Public Schema（全局数据）：**
- ✅ `users` 表 - 存储所有用户（包括考生）
- ✅ `user_tenant_roles` 表 - 存储用户在各租户下的角色
- ❌ **没有** `candidates` 表

**Tenant Schema（租户业务数据）：**
- ✅ `applications` 表 - 存储报名申请，包含 `candidate_id` 字段
- ✅ `tickets` 表 - 存储准考证，包含 `candidate_id` 和冗余的考生信息
- ❌ **没有** `candidates` 表

### 2. JPA实体层面

**存在的实体：**
- ✅ `UserEntity` - 对应 `public.users` 表
- ✅ `UserTenantRoleEntity` - 对应 `public.user_tenant_roles` 表
- ✅ `ApplicationEntity` - 对应 `tenant_*.applications` 表
- ✅ `TicketEntity` - 对应 `tenant_*.tickets` 表
- ❌ **没有** `CandidateEntity`

### 3. 领域模型层面

**存在的领域对象：**
- ✅ `User` - 用户聚合根（exam-domain/src/main/java/com/duanruo/exam/domain/user/User.java）
- ✅ `Candidate` - **候选人聚合根**（exam-domain/src/main/java/com/duanruo/exam/domain/candidate/Candidate.java）
- ✅ `Application` - 报名申请聚合根

**重要发现：**
- `Candidate` 领域对象**存在**，但**没有对应的数据库表**
- `Candidate` 对象包含 `userId` 字段，关联到 `public.users` 表

## 数据结构设计分析

### 当前设计模式：**User-Centric（以用户为中心）**

```
┌─────────────────────────────────────────────────────────────┐
│                    Public Schema (全局)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ users (全局用户表)                                    │  │
│  │ - id (UUID)                                           │  │
│  │ - username                                            │  │
│  │ - email                                               │  │
│  │ - full_name                                           │  │
│  │ - phone_number                                        │  │
│  │ - roles (JSON: ["CANDIDATE", "ADMIN", ...])          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↑                                   │
│                          │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │ user_tenant_roles (用户-租户-角色关联)                │  │
│  │ - user_id (FK → users.id)                            │  │
│  │ - tenant_id (FK → tenants.id)                        │  │
│  │ - role (CANDIDATE, PRIMARY_REVIEWER, ...)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Tenant Schema (租户业务数据)                    │
│              tenant_test_company_a                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ applications (报名申请)                               │  │
│  │ - id (UUID)                                           │  │
│  │ - exam_id (FK → exams.id)                            │  │
│  │ - position_id (FK → positions.id)                    │  │
│  │ - candidate_id (UUID) ← 引用 public.users.id         │  │
│  │ - payload (JSONB - 包含考生详细信息)                  │  │
│  │ - status                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ tickets (准考证)                                      │  │
│  │ - id (UUID)                                           │  │
│  │ - application_id (FK → applications.id)              │  │
│  │ - candidate_id (UUID) ← 引用 public.users.id         │  │
│  │ - candidate_name (冗余)                               │  │
│  │ - candidate_id_number (冗余，加密)                    │  │
│  │ - candidate_photo (冗余)                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 设计原理

#### 1. **考生身份 = User + CANDIDATE角色**

考生不是一个独立的实体，而是：
- **全局层面**：`public.users` 表中的一条记录，`roles` 字段包含 `"CANDIDATE"`
- **租户层面**：通过 `user_tenant_roles` 表，用户在特定租户下被授予 `CANDIDATE` 角色

#### 2. **candidate_id 字段的含义**

在 `applications` 和 `tickets` 表中的 `candidate_id` 字段：
- **类型**：UUID
- **引用**：指向 `public.users.id`（虽然没有显式的外键约束）
- **语义**：表示"哪个用户作为考生提交了这个申请"

#### 3. **考生详细信息的存储位置**

考生的详细信息分散存储在三个地方：

**A. 基本信息（public.users）：**
- 用户名、邮箱、手机号、全名

**B. 报名表单数据（tenant_*.applications.payload）：**
```json
{
  "name": "张三",
  "idNumber": "110101199001011234",
  "gender": "男",
  "birthDate": "1990-01-01",
  "education": "本科",
  "major": "计算机科学",
  "graduationSchool": "清华大学",
  "workExperience": "5年",
  "attachments": {
    "idCard": "file-uuid-1",
    "diploma": "file-uuid-2"
  }
}
```

**C. 准考证冗余信息（tenant_*.tickets）：**
- `candidate_name` - 考生姓名（冗余，用于快速显示）
- `candidate_id_number` - 身份证号（冗余，加密存储）
- `candidate_photo` - 照片URL（冗余）

#### 4. **Candidate领域对象的作用**

虽然没有 `candidates` 表，但 `Candidate` 领域对象仍然存在：

```java
public class Candidate {
    private CandidateId id;
    private String userId;        // 关联到 public.users.id
    private String name;
    private String idNumber;      // 身份证号（加密）
    private String phone;         // 手机号（加密）
    private String email;         // 邮箱（加密）
    // ...
}
```

**用途：**
- **领域逻辑封装**：提供考生相关的业务规则（如身份证验证、信息脱敏）
- **数据聚合**：从 `users` 表和 `applications.payload` 中聚合考生信息
- **临时对象**：在内存中使用，不直接持久化到独立表

## 跨租户报名的实现机制

### 场景：一个用户参加多个租户的考试

**示例：**
- 用户 `user_001` 在 `public.users` 表中注册
- 用户在租户A（`tenant_company_a`）报名考试1
- 用户在租户B（`tenant_company_b`）报名考试2

**数据流：**

```
1. 用户注册（一次）
   public.users
   ├─ id: user_001
   ├─ username: "zhangsan"
   ├─ email: "zhangsan@example.com"
   └─ roles: ["CANDIDATE"]

2. 在租户A报名
   public.user_tenant_roles
   ├─ user_id: user_001
   ├─ tenant_id: tenant_a_id
   └─ role: "CANDIDATE"
   
   tenant_company_a.applications
   ├─ id: app_001
   ├─ exam_id: exam_a_001
   ├─ candidate_id: user_001  ← 引用全局用户
   └─ payload: { "name": "张三", "idNumber": "...", ... }

3. 在租户B报名
   public.user_tenant_roles
   ├─ user_id: user_001
   ├─ tenant_id: tenant_b_id
   └─ role: "CANDIDATE"
   
   tenant_company_b.applications
   ├─ id: app_002
   ├─ exam_id: exam_b_001
   ├─ candidate_id: user_001  ← 同一个用户
   └─ payload: { "name": "张三", "idNumber": "...", ... }
```

### 关键点

1. **用户唯一性**：用户在 `public.users` 中只有一条记录
2. **角色多样性**：同一用户可以在不同租户下拥有不同角色
3. **数据隔离**：报名数据存储在各自租户的 schema 中
4. **引用一致性**：所有 `candidate_id` 都指向同一个 `public.users.id`

## 设计优缺点分析

### ✅ 优点

1. **简化用户管理**
   - 用户只需注册一次
   - 统一的身份认证
   - 避免数据冗余

2. **灵活的角色管理**
   - 同一用户可以在不同租户下拥有不同角色
   - 支持角色动态授予和撤销

3. **数据隔离**
   - 租户业务数据完全隔离
   - 符合SAAS多租户架构

4. **性能优化**
   - 减少表连接
   - `tickets` 表冗余考生信息，提高查询性能

### ⚠️ 潜在问题

1. **缺少外键约束**
   - `applications.candidate_id` 和 `tickets.candidate_id` 没有外键约束
   - 可能导致数据不一致（如用户被删除但申请仍存在）

2. **数据冗余**
   - 考生信息在 `users`、`applications.payload`、`tickets` 中重复存储
   - 更新时需要同步多处

3. **跨Schema查询复杂**
   - 查询考生的所有报名需要跨多个租户Schema
   - 需要应用层聚合数据

4. **Candidate领域对象未持久化**
   - 领域模型与数据模型不一致
   - 可能导致理解困难

## 建议

### 选项1：保持现状（推荐）

**适用场景：**
- 系统已经运行
- 性能满足需求
- 数据量不大

**改进措施：**
1. 添加应用层外键检查
2. 实现 `CandidateRepository`，从 `users` 和 `applications` 聚合数据
3. 完善文档，明确说明设计意图

### 选项2：引入candidates表

**在 public schema 中创建 `candidates` 表：**

```sql
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    id_number VARCHAR(500) NOT NULL,  -- 加密
    phone VARCHAR(500),                -- 加密
    email VARCHAR(500),                -- 加密
    gender VARCHAR(10),
    birth_date DATE,
    education VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

**优点：**
- 领域模型与数据模型一致
- 考生信息集中管理
- 支持外键约束

**缺点：**
- 需要数据迁移
- 增加系统复杂度
- 可能影响现有功能

## 总结

**回答您的问题：**

1. **candidates不是独立的表**
   - 考生身份通过 `public.users` + `CANDIDATE` 角色实现
   - 没有独立的 `candidates` 表（无论在 public schema 还是 tenant schema）

2. **考生可以参加多个租户的考试**
   - 通过 `user_tenant_roles` 表关联用户和租户
   - 每个租户的 `applications` 表通过 `candidate_id` 引用全局 `users.id`

3. **Candidate领域对象的作用**
   - 封装业务逻辑
   - 聚合分散的考生信息
   - 不直接持久化到数据库

4. **数据存储位置**
   - 基本信息：`public.users`
   - 详细信息：`tenant_*.applications.payload` (JSONB)
   - 冗余信息：`tenant_*.tickets` (用于性能优化)

这是一种**User-Centric（以用户为中心）**的设计，而不是**Candidate-Centric（以考生为中心）**的设计。

