# 集成测试说明

## 快速开始

### 1. 前置条件

确保本地PostgreSQL服务运行，并创建测试数据库：

```sql
CREATE DATABASE exam_test;
```

### 2. 配置数据库连接

如果您的PostgreSQL配置与默认不同，请修改:
`src/test/resources/application-test.yml`

默认配置:
- 地址: localhost:5432
- 数据库: exam_test
- 用户名: postgres
- 密码: postgres

### 3. 运行测试

```bash
# 运行所有集成测试
mvn test -pl exam-bootstrap

# 运行特定测试类
mvn test -Dtest=ExamManagementIntegrationTest -pl exam-bootstrap
```

## 详细文档

请参考: `docs/Integration-Tests-Setup-Guide.md`

