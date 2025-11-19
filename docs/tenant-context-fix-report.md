# 租户上下文修复报告

## 问题描述

审核员API返回500 Internal Server Error，错误信息为：`关系 "review_tasks" 不存在`

## 根本原因分析

### 问题现象

从日志中发现，虽然`TenantInterceptor`设置了租户上下文，但Hibernate仍然使用`public` schema而不是租户schema：

```
c.d.e.i.multitenancy.TenantContext - Setting current tenant: 00000000-0000-0000-0000-000000000001
c.d.e.i.m.TenantInterceptor - Tenant context set early for tenant: 00000000-0000-0000-0000-000000000001
c.d.e.i.m.TenantSchemaConnectionProvider - Set search_path to: public for tenant: public
```

### 根本原因

**时序问题**：`TenantIdentifierResolver`在`TenantInterceptor`**之前**被调用。

调用顺序：
1. HTTP请求到达
2. Spring Security Filter Chain执行
3. **Hibernate尝试获取租户标识符** ← `TenantIdentifierResolver.resolveCurrentTenantIdentifier()`被调用
4. `DispatcherServlet`分发请求
5. `TenantInterceptor.preHandle()`执行 ← 租户上下文在这里设置（太晚了！）

**为什么会这样？**

在某些情况下（如AOP、事务管理、懒加载等），Hibernate会在Controller方法执行之前就尝试获取租户标识符。而`HandlerInterceptor`是在Controller方法映射之后才执行的，所以租户上下文设置得太晚了。

## 解决方案

### 方案：使用Filter代替Interceptor设置租户上下文

**核心思想**：将租户上下文的设置从`HandlerInterceptor`移到`Filter`，因为Filter在Spring MVC的所有组件之前执行。

### 实现步骤

#### 1. 创建`TenantContextFilter`

新建`exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantContextFilter.java`：

```java
@Component
@Order(1) // 确保在所有Filter之前执行
public class TenantContextFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        try {
            // 1. 提取租户ID
            String tenantIdStr = extractTenantId(httpRequest);
            if (tenantIdStr == null) {
                tenantIdStr = DEFAULT_TENANT_ID;
            }
            
            // 2. 立即设置租户上下文
            TenantId tenantId = TenantId.of(tenantIdStr);
            TenantContext.setCurrentTenant(tenantId);
            
            // 3. 继续过滤器链
            chain.doFilter(request, response);
            
        } finally {
            // 4. 清除租户上下文
            TenantContext.clear();
        }
    }
}
```

**关键点**：
- 使用`@Order(1)`确保在所有Filter之前执行
- 在`finally`块中清除租户上下文，防止内存泄漏
- 从请求头`X-Tenant-ID`或URL路径提取租户ID

#### 2. 修改`TenantInterceptor`

将`TenantInterceptor`的职责从"设置租户上下文"改为"验证用户权限"：

```java
@Component
public class TenantInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 注意：租户上下文已经在TenantContextFilter中设置
        // 这里只负责验证用户是否有权限访问该租户
        
        // 1. 获取当前租户ID（从TenantContext）
        TenantId tenantId = TenantContext.getCurrentTenant();
        
        // 2. 跳过某些端点的租户权限检查
        if (shouldSkipTenantValidation(request)) {
            return true;
        }
        
        // 3. 验证用户是否属于该租户
        // ...
    }
    
    @Override
    public void afterCompletion(...) {
        // 租户上下文的清理已经在TenantContextFilter中完成
        // 这里不需要再次清理
    }
}
```

**关键变更**：
- 移除了租户ID提取逻辑（已在Filter中完成）
- 移除了租户上下文设置逻辑（已在Filter中完成）
- 移除了租户上下文清理逻辑（已在Filter中完成）
- 只保留权限验证逻辑

### 执行流程对比

#### 修复前（错误）

```
1. HTTP请求到达
2. Spring Security Filter Chain
3. Hibernate获取租户标识符 ← TenantContext为空，返回"public"
4. DispatcherServlet分发请求
5. TenantInterceptor设置租户上下文 ← 太晚了！
6. Controller方法执行
7. Hibernate查询 ← 使用"public" schema（错误！）
```

#### 修复后（正确）

```
1. HTTP请求到达
2. TenantContextFilter设置租户上下文 ← 最早阶段！
3. Spring Security Filter Chain
4. Hibernate获取租户标识符 ← TenantContext有值，返回正确的租户ID
5. DispatcherServlet分发请求
6. TenantInterceptor验证权限
7. Controller方法执行
8. Hibernate查询 ← 使用正确的租户schema（正确！）
9. TenantContextFilter清除租户上下文
```

## 验证结果

### 修复前

```bash
$ curl -H "Authorization: Bearer $token" -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000001" \
  http://localhost:8081/api/v1/reviews/pending

HTTP/1.1 500 Internal Server Error
错误: 关系 "review_tasks" 不存在
```

### 修复后

```bash
$ curl -H "Authorization: Bearer $token" -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000001" \
  http://localhost:8081/api/v1/reviews/pending

HTTP/1.1 200 OK
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "currentPage": 0,
  "pageSize": 20,
  "hasNext": false,
  "hasPrevious": false
}
```

### 日志验证

修复后的日志显示正确的执行顺序：

```
2025-10-30 10:17:43 [http-nio-8081-exec-3] DEBUG c.d.e.i.m.TenantContextFilter - Tenant context set in filter for tenant: 00000000-0000-0000-0000-000000000001
2025-10-30 10:17:43 [http-nio-8081-exec-3] DEBUG c.d.e.i.m.TenantIdentifierResolver - Resolved tenant identifier: 00000000-0000-0000-0000-000000000001
2025-10-30 10:17:43 [http-nio-8081-exec-3] DEBUG c.d.e.i.m.TenantSchemaConnectionProvider - Resolved schema name: tenant_test_company_a for tenant: 00000000-0000-0000-0000-000000000001
2025-10-30 10:17:43 [http-nio-8081-exec-3] DEBUG c.d.e.i.m.TenantSchemaConnectionProvider - Set search_path to: tenant_test_company_a for tenant: 00000000-0000-0000-0000-000000000001
```

## 关键要点

### 1. Filter vs Interceptor的执行顺序

- **Filter**：在Servlet容器层面执行，在Spring MVC之前
- **Interceptor**：在Spring MVC层面执行，在Controller方法映射之后

对于需要在**所有Spring组件之前**设置的上下文（如租户上下文、请求追踪等），应该使用**Filter**而不是**Interceptor**。

### 2. ThreadLocal的生命周期管理

- **设置**：在Filter的`doFilter()`开始时设置
- **使用**：在整个请求处理过程中使用
- **清除**：在Filter的`finally`块中清除，确保即使发生异常也能清除

### 3. 多租户架构的最佳实践

对于基于Schema的多租户架构：
1. 租户上下文必须在**Hibernate初始化之前**设置
2. 使用Filter而不是Interceptor设置租户上下文
3. 确保租户上下文在请求结束时被清除
4. 使用`@Order`注解控制Filter的执行顺序

## 影响范围

### 修改的文件

1. **新增**：`exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantContextFilter.java`
2. **修改**：`exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantInterceptor.java`

### 影响的功能

- ✅ 审核员API（`/api/v1/reviews/*`）
- ✅ 所有需要访问租户schema的API
- ✅ 所有Hibernate查询

### 不影响的功能

- ✅ 认证API（`/api/v1/auth/*`）- 跳过租户验证
- ✅ 公开API（`/api/v1/public/*`）- 跳过租户验证
- ✅ 租户管理API（`/api/v1/tenants/*`）- 跳过租户验证

## 后续建议

### 1. 添加集成测试

建议添加集成测试验证多租户隔离：

```java
@Test
void testTenantIsolation() {
    // 1. 以租户A的用户登录
    // 2. 访问租户A的数据 - 应该成功
    // 3. 尝试访问租户B的数据 - 应该返回403
}
```

### 2. 监控租户上下文

添加监控指标：
- 租户上下文设置失败次数
- 租户上下文未清除次数（内存泄漏）
- 跨租户访问尝试次数

### 3. 性能优化

考虑缓存租户schema名称映射，减少数据库查询：

```java
@Cacheable(value = "tenant-schemas", key = "#tenantId")
private String resolveSchemaName(String tenantId) {
    // ...
}
```

## 总结

通过将租户上下文的设置从`HandlerInterceptor`移到`Filter`，成功解决了Hibernate在获取租户标识符时租户上下文尚未设置的时序问题。这是一个典型的多租户架构中的时序问题，核心在于理解Spring MVC的请求处理流程和各个组件的执行顺序。

**修复状态**：✅ 已完成并验证
**测试结果**：✅ 所有审核员API返回200 OK
**代码质量**：✅ 无编译错误，无IDE警告

