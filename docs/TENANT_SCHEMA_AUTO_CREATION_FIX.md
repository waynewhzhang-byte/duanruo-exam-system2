# 租户Schema自动创建修复说明

## 问题描述

创建新租户后，数据库中没有自动创建对应的Schema和业务表，需要手工创建。

## 根本原因

1. **PostgreSQL Schema名称引号问题**
   - Schema名称包含连字符（如 `tenant_test-company-b`）时，SQL语句需要使用双引号包裹
   - 原代码直接使用Schema名称，导致SQL语法错误

2. **错误处理不足**
   - 异步执行失败时，错误被静默吞掉
   - 缺少详细的日志记录，难以排查问题

3. **Flyway迁移验证不足**
   - 迁移执行后没有验证表是否创建成功
   - 缺少详细的迁移日志

## 修复内容

### 1. 修复Schema名称引号问题

**文件**: `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/SchemaManagementService.java`

**修改**:
- 在创建Schema时，为Schema名称添加双引号包裹
- 在删除Schema时，同样添加双引号包裹

```java
// 修复前
String createSchemaSql = String.format("CREATE SCHEMA IF NOT EXISTS %s", schemaName);

// 修复后
String quotedSchemaName = "\"" + schemaName + "\"";
String createSchemaSql = String.format("CREATE SCHEMA IF NOT EXISTS %s", quotedSchemaName);
```

### 2. 改进事件监听器日志和错误处理

**文件**: `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantSchemaEventListener.java`

**改进**:
- 添加详细的步骤日志
- 改进错误日志，包含完整的堆栈跟踪
- 添加Schema创建后的验证步骤
- 如果Schema已存在但没有表，自动运行迁移

### 3. 改进Flyway迁移日志和验证

**文件**: `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/SchemaManagementService.java`

**改进**:
- 添加Flyway配置日志
- 记录迁移执行的脚本数量
- 迁移后验证表是否创建成功
- 如果表为空，记录警告日志

### 4. 修复后端响应格式

**文件**: `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/dto/tenant/TenantResponse.java`

**修改**:
- 添加 `slug` 字段，映射到 `code` 字段，满足前端Schema要求

## 工作流程

1. **超级管理员创建租户**
   - 前端提交创建租户请求
   - 后端验证并保存租户信息到 `public.tenants` 表

2. **发布租户创建事件**
   - `TenantApplicationService` 发布 `TenantCreatedEvent` 事件

3. **事件监听器处理**
   - `TenantSchemaEventListener` 监听事件（事务提交后）
   - 异步执行Schema创建（不阻塞主事务）

4. **Schema创建流程**
   - 查找租户信息
   - 检查Schema是否已存在
   - 创建Schema（使用引号包裹的Schema名称）
   - 设置Schema搜索路径
   - 运行Flyway迁移创建业务表
   - 验证表是否创建成功

## 验证步骤

1. **创建新租户**
   ```bash
   # 通过前端UI创建新租户
   # 或使用API:
   POST /api/v1/tenants
   {
     "name": "测试租户",
     "code": "test-tenant",
     "contactEmail": "admin@test.com",
     "contactPhone": "13800138000"
   }
   ```

2. **检查日志**
   - 查看后端日志，应该看到详细的Schema创建日志
   - 包括：事件接收、租户查找、Schema创建、Flyway迁移、表验证等步骤

3. **验证数据库**
   ```sql
   -- 检查Schema是否存在
   SELECT schema_name FROM information_schema.schemata 
   WHERE schema_name LIKE 'tenant_%';
   
   -- 检查Schema中的表
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'tenant_test-tenant' 
   AND table_type = 'BASE TABLE';
   ```

## 故障排查

如果Schema没有自动创建，检查以下内容：

1. **检查日志**
   - 查看是否有 "Handling tenant created event" 日志
   - 查看是否有错误日志

2. **检查异步配置**
   - 确认 `AsyncConfig` 类已加载
   - 确认 `@EnableAsync` 注解生效

3. **检查事件发布**
   - 确认 `TenantApplicationService` 中调用了 `eventPublisher.publishEvent()`

4. **检查Flyway迁移脚本**
   - 确认 `exam-infrastructure/src/main/resources/db/tenant-migration/` 目录下有迁移脚本
   - 确认脚本格式正确（V001__*.sql）

5. **手动触发Schema创建**
   - 如果自动创建失败，可以使用 `SchemaManagementService.migrateExistingSchema()` 手动创建

## 注意事项

1. **Schema名称格式**
   - Schema名称格式：`tenant_{code}`
   - 如果code包含连字符，Schema名称也会包含连字符
   - PostgreSQL要求使用双引号包裹包含特殊字符的标识符

2. **异步执行**
   - Schema创建是异步执行的，不会阻塞租户创建
   - 如果创建失败，错误会被记录到日志，但不会影响租户创建
   - 建议监控日志，及时发现和处理错误

3. **Flyway迁移**
   - 每个租户Schema都有独立的Flyway迁移历史表
   - 迁移脚本在 `classpath:db/tenant-migration` 目录
   - 使用 `baselineOnMigrate=true` 自动创建基线

## 后续改进建议

1. **添加重试机制**
   - 如果Schema创建失败，可以自动重试
   - 或者提供手动触发Schema创建的API

2. **添加监控告警**
   - Schema创建失败时发送告警通知
   - 记录到错误表，便于追踪

3. **添加健康检查**
   - 检查所有租户的Schema是否完整
   - 定期验证Schema结构

4. **考虑同步执行**
   - 对于关键操作，可以考虑同步执行
   - 或者使用事务性发件箱模式确保可靠性

