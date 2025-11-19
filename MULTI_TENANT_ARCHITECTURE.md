# 多租户架构设计文档

## 概述

本系统采用基于 **Hibernate Schema 级多租户** 的同库分Schema多租户架构，实现SAAS模式的考试报名系统。

通过 PostgreSQL 的 Schema 机制实现租户数据的物理隔离，每个租户拥有独立的 Schema，确保数据安全和隔离性。

## 架构设计

### 1. 数据隔离模型

```
PostgreSQL数据库: duanruo-exam-system
│
├── public schema (公共数据 - 跨租户共享)
│   ├── tenants (租户表)
│   ├── users (用户表)
│   └── user_tenant_roles (用户-租户-角色关联表)
│
├── tenant_default schema (默认租户 - 现有数据)
│   ├── exams
│   ├── positions
│   ├── subjects
│   ├── applications
│   ├── tickets
│   └── ... (所有业务表)
│
├── tenant_company_a schema (租户A的业务数据)
│   └── ... (相同的表结构)
│
└── tenant_company_b schema (租户B的业务数据)
    └── ... (相同的表结构)
```

### 2. 权限角色设计

#### 2.1 全局角色（存储在users.roles字段）

- **ADMIN (SUPER_ADMIN)**
  - 超级管理员
  - 可以管理所有租户
  - 可以创建/删除租户
  - 可以访问任何租户的数据
  - 不受租户限制

#### 2.2 租户级角色（存储在user_tenant_roles表）

- **TENANT_ADMIN**
  - 租户管理员
  - 只能管理自己租户的数据
  - 可以管理租户内的用户和角色
  - 可以创建考试、岗位等

- **CANDIDATE**
  - 考生
  - 可以在多个租户下报名
  - 只能查看和操作自己的报名信息

- **PRIMARY_REVIEWER**
  - 一级审核员
  - 审核报名申请

- **SECONDARY_REVIEWER**
  - 二级审核员
  - 复核报名申请

- **EXAMINER**
  - 考官
  - 管理考试和评分

### 3. 用户-租户关系

#### 3.1 多对多关系

- 一个用户可以属于多个租户
- 一个用户在不同租户下可以有不同角色
- 通过`user_tenant_roles`表维护关系

#### 3.2 示例场景

```
用户张三:
- 在租户A: TENANT_ADMIN (管理员)
- 在租户B: CANDIDATE (考生)
- 在租户C: PRIMARY_REVIEWER (审核员)

用户李四:
- 全局角色: SUPER_ADMIN (超级管理员)
- 可以访问所有租户
```

### 4. 请求处理流程

```
1. HTTP请求到达
   ↓
2. TenantInterceptor拦截
   ↓
3. 提取租户信息
   - 从请求头: X-Tenant-ID
   - 或从路径: /api/v1/tenants/{tenantId}/...
   ↓
4. 提取用户信息
   - 从JWT Token获取用户ID
   ↓
5. 权限验证
   - 检查用户是否为SUPER_ADMIN
     → 是: 允许访问任何租户
     → 否: 继续验证
   - 查询user_tenant_roles表
   - 验证用户在该租户下是否有权限
   ↓
6. 设置TenantContext
   - 将租户ID存储到ThreadLocal
   ↓
7. ShardingSphere路由
   - 根据TenantContext中的租户ID
   - 路由到对应的Schema
   ↓
8. 执行业务逻辑
   ↓
9. 清理TenantContext
```

### 5. Hibernate 多租户配置

#### 5.1 核心配置

```yaml
spring:
  jpa:
    properties:
      hibernate:
        multitenancy: SCHEMA  # 启用Schema级多租户
        # 连接提供者和解析器通过HibernateMultiTenancyConfig配置

  datasource:
    url: jdbc:postgresql://localhost:5432/duanruo-exam-system
    username: postgres
    password: zww0625wh
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

#### 5.2 Java配置

```java
@Configuration
public class HibernateMultiTenancyConfig {

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            DataSource dataSource,
            TenantSchemaConnectionProvider connectionProvider,
            TenantIdentifierResolver identifierResolver) {

        Map<String, Object> properties = new HashMap<>();
        properties.put(Environment.MULTI_TENANT, MultiTenancyStrategy.SCHEMA);
        properties.put(Environment.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
        properties.put(Environment.MULTI_TENANT_IDENTIFIER_RESOLVER, identifierResolver);

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setJpaPropertyMap(properties);

        return em;
    }
}
```

#### 5.3 工作原理

1. **TenantIdentifierResolver**: 从 TenantContext 解析当前租户ID
2. **TenantSchemaConnectionProvider**:
   - 获取数据库连接
   - 根据租户ID查询对应的 schema_name
   - 执行 `SET search_path TO {schema_name}, public`
   - 返回配置好的连接
3. **Hibernate**: 使用配置好的连接执行所有SQL操作

### 6. 租户上下文管理

#### 6.1 TenantContext

```java
public class TenantContext {
    private static final ThreadLocal<TenantId> currentTenant = new ThreadLocal<>();
    
    public static void setCurrentTenant(TenantId tenantId) {
        currentTenant.set(tenantId);
    }
    
    public static TenantId getCurrentTenant() {
        return currentTenant.get();
    }
    
    public static void clear() {
        currentTenant.remove();
    }
}
```

#### 6.2 TenantInterceptor

```java
@Component
public class TenantInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) {
        // 1. 提取租户ID
        String tenantId = request.getHeader("X-Tenant-ID");
        
        // 2. 获取当前用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // 3. 验证权限
        if (!isSuperAdmin(auth)) {
            validateTenantAccess(userId, tenantId);
        }
        
        // 4. 设置上下文
        TenantContext.setCurrentTenant(TenantId.of(tenantId));
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) {
        TenantContext.clear();
    }
}
```

### 7. Schema管理

#### 7.1 Schema创建

当创建新租户时，自动创建对应的Schema并初始化表结构：

```sql
-- 创建Schema
CREATE SCHEMA IF NOT EXISTS tenant_company_a;

-- 在新Schema中创建所有业务表
CREATE TABLE tenant_company_a.exams (...);
CREATE TABLE tenant_company_a.positions (...);
-- ... 其他表
```

#### 7.2 Flyway多Schema支持

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: public  # 默认只迁移public schema
```

对于租户Schema，使用程序化方式执行迁移。

### 8. API设计

#### 8.1 租户管理API（仅SUPER_ADMIN）

```
POST   /api/v1/tenants              # 创建租户
GET    /api/v1/tenants              # 列出所有租户
GET    /api/v1/tenants/{id}         # 获取租户详情
PUT    /api/v1/tenants/{id}         # 更新租户
DELETE /api/v1/tenants/{id}         # 删除租户
POST   /api/v1/tenants/{id}/activate   # 激活租户
POST   /api/v1/tenants/{id}/deactivate # 停用租户
```

#### 8.2 用户租户角色管理API

```
POST   /api/v1/tenants/{tenantId}/users/{userId}/roles  # 授予角色
DELETE /api/v1/tenants/{tenantId}/users/{userId}/roles/{role}  # 撤销角色
GET    /api/v1/tenants/{tenantId}/users  # 列出租户用户
GET    /api/v1/users/{userId}/tenants    # 列出用户的租户
```

#### 8.3 业务API（需要租户上下文）

```
请求头: X-Tenant-ID: {tenant-id}

GET    /api/v1/exams                # 获取当前租户的考试列表
POST   /api/v1/exams                # 在当前租户创建考试
...
```

### 9. 安全考虑

1. **租户隔离**
   - 通过Schema物理隔离数据
   - 防止跨租户数据访问

2. **权限验证**
   - 每个请求都验证用户在租户下的权限
   - SUPER_ADMIN有特殊权限

3. **审计日志**
   - 记录所有跨租户操作
   - 记录租户创建/删除操作

4. **数据备份**
   - 每个租户Schema独立备份
   - 支持租户级别的数据恢复

### 10. 性能优化

1. **连接池**
   - 使用HikariCP连接池
   - 合理配置连接数

2. **缓存**
   - 缓存租户信息
   - 缓存用户-租户-角色关系

3. **索引优化**
   - 在user_tenant_roles表上创建复合索引
   - 优化租户查询性能

### 11. 迁移策略

#### 11.1 现有数据迁移

1. 创建默认租户（tenant_default）
2. 将public schema的业务表数据迁移到tenant_default schema
3. 为现有用户分配默认租户的角色

#### 11.2 新租户创建

1. 在tenants表创建记录
2. 创建对应的Schema
3. 在新Schema中创建所有业务表
4. 为租户管理员分配TENANT_ADMIN角色

## 总结

本架构通过 Hibernate Schema 级多租户实现了：
- ✅ 数据完全隔离（Schema级别物理隔离）
- ✅ 灵活的权限模型（全局+租户级）
- ✅ 用户可以跨租户
- ✅ 最小化代码改动（业务层无感知）
- ✅ 符合SAAS最佳实践
- ✅ 性能稳定可预测（PostgreSQL原生search_path）
- ✅ 实现简单，易于维护

## 技术选型说明

### 为什么选择 Hibernate Schema 多租户而不是 ShardingSphere？

#### Hibernate Schema 方案的优势

1. **实现简单**
   - 只需配置 Hibernate，无需额外中间件
   - 代码量少，易于理解和维护
   - 调试简单，SQL日志清晰

2. **完全隔离**
   - Schema 级别物理隔离，安全性最高
   - 每个租户独立的表结构
   - 备份和恢复可以按租户进行

3. **性能稳定**
   - PostgreSQL 原生 search_path，性能可预测
   - 无额外的路由计算开销
   - 连接池管理简单

4. **适合项目规模**
   - 预期租户数量 < 100
   - 每个租户数据量适中
   - 单租户查询为主，很少跨租户

#### ShardingSphere 方案的劣势（对本项目）

1. **复杂度高**
   - 需要理解 ShardingSphere 配置和原理
   - 调试困难，SQL被代理后难以追踪
   - 学习成本高

2. **表结构要求**
   - 需要所有表都有 tenant_id 字段
   - 当前表结构不符合（需要大规模重构）
   - 数据迁移成本高

3. **性能开销**
   - 额外的路由计算和代理层
   - 对于小规模租户，收益不明显

4. **与 Hibernate 冲突**
   - 两者同时使用容易出问题
   - 需要仔细设计避免双重路由

### 未来扩展性

如果未来租户数量超过 1000，或需要分库分表，可以考虑：

1. **保持 Schema 隔离，引入 ShardingSphere 作为数据源代理**
   - 使用 ShardingSphere 路由到不同 Schema
   - 与 Hibernate 多租户并存，逐步切换

2. **分库方案**
   - 将租户 Schema 分散到多个数据库
   - 使用 ShardingSphere 管理多数据源

3. **混合方案**
   - 大租户独立数据库
   - 小租户共享数据库（Schema隔离）

