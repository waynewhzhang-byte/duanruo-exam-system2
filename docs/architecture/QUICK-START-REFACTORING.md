# 前后端集成重构 - 快速开始指南

> **完整方案**: 请参考 [frontend-backend-integration-refactoring-plan.md](./frontend-backend-integration-refactoring-plan.md)

## 🚀 立即开始 (30分钟快速验证)

### Step 1: 诊断当前问题 (5分钟)

```bash
# 1. 统计权限注解使用情况
grep -rn "@PreAuthorize" exam-adapter-rest/src/main/java | \
  grep "hasRole" | wc -l
# 预期输出: 显示使用 hasRole() 的数量

# 2. 检查 OpenAPI 是否可访问
curl http://localhost:8081/api/v3/api-docs | jq '.paths | length'
# 预期输出: API 端点数量

# 3. 运行 BDD Layer 1 测试,查看失败率
cd web
npm run test:bdd:layer-1 2>&1 | tee bdd-test-output.txt
# 查看失败的场景
```

### Step 2: 验证权限一致性 (10分钟)

创建临时测试脚本:

```java
// exam-adapter-rest/src/test/java/QuickPermissionCheck.java
import org.junit.jupiter.api.Test;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

public class QuickPermissionCheck {

    @Test
    public void findPermissionInconsistencies() throws Exception {
        Pattern hasRole = Pattern.compile("hasRole\\('([^']+)'\\)");
        Pattern hasAuth = Pattern.compile("hasAuthority\\('([^']+)'\\)");

        Map<String, Integer> roleUsage = new HashMap<>();
        Map<String, Integer> authorityUsage = new HashMap<>();

        Files.walk(Paths.get("src/main/java"))
            .filter(p -> p.toString().endsWith(".java"))
            .forEach(path -> {
                try {
                    String content = Files.readString(path);
                    Matcher rm = hasRole.matcher(content);
                    Matcher am = hasAuth.matcher(content);

                    while (rm.find()) {
                        roleUsage.merge(rm.group(1), 1, Integer::sum);
                    }
                    while (am.find()) {
                        authorityUsage.merge(am.group(1), 1, Integer::sum);
                    }
                } catch (Exception e) {}
            });

        System.out.println("=== 权限使用统计 ===");
        System.out.println("hasRole() 使用次数: " + roleUsage.values().stream().mapToInt(Integer::intValue).sum());
        System.out.println("hasAuthority() 使用次数: " + authorityUsage.values().stream().mapToInt(Integer::intValue).sum());

        System.out.println("\n=== hasRole() 详细列表 (需要迁移) ===");
        roleUsage.forEach((role, count) ->
            System.out.println(String.format("  %s: %d 次", role, count))
        );
    }
}
```

运行:
```bash
cd exam-adapter-rest
mvn test -Dtest=QuickPermissionCheck
```

### Step 3: 导出并验证 OpenAPI (10分钟)

```bash
# 1. 启动后端 (在新终端)
cd exam-bootstrap
mvn spring-boot:run

# 2. 等待启动后,导出 OpenAPI (在原终端)
mkdir -p web/openapi
curl http://localhost:8081/api/v3/api-docs > web/openapi/exam-system-api.json

# 3. 验证 x-permissions 字段
cd web
node -e "
const spec = require('./openapi/exam-system-api.json');
let total = 0, withPerms = 0;

Object.values(spec.paths).forEach(path => {
  Object.values(path).forEach(op => {
    if (op.operationId) {
      total++;
      if (op['x-permissions']) withPerms++;
    }
  });
});

console.log(\`总端点: \${total}\`);
console.log(\`带权限: \${withPerms}\`);
console.log(\`覆盖率: \${(withPerms/total*100).toFixed(1)}%\`);
"
```

### Step 4: 测试前端类型生成 (5分钟)

```bash
cd web

# 1. 安装依赖
npm install -D openapi-typescript
npm install openapi-fetch

# 2. 生成类型
npx openapi-typescript openapi/exam-system-api.json -o src/lib/api/generated/schema.ts

# 3. 检查生成的文件
ls -lh src/lib/api/generated/schema.ts
# 预期: 文件应该存在且大小 > 50KB

# 4. 快速测试类型安全性
cat > test-api-types.ts << 'EOF'
import type { paths } from './src/lib/api/generated/schema';

// 编译时类型检查测试
type ExamsGetResponse = paths['/exams']['get']['responses']['200']['content']['application/json'];
type ExamCreateRequest = paths['/exams']['post']['requestBody']['content']['application/json'];

console.log('✓ 类型生成成功');
EOF

npx tsx test-api-types.ts
rm test-api-types.ts
```

---

## 📋 优先级实施清单

### 🔴 立即执行 (Week 1)

#### Day 1-2: 权限标准化
- [ ] 运行权限检查脚本,识别所有 `hasRole()` 使用
- [ ] 创建 `Permission` 枚举 (基于现有 RBAC 文档)
- [ ] 批量替换: `hasRole('TENANT_ADMIN')` → `hasAuthority('TENANT_MANAGE')`
- [ ] 在 `UserDetailsService` 中映射 Role → Authorities

**验证标准**: `mvn test` 全部通过,`grep "hasRole" -r src/main/java` 无结果

#### Day 3: OpenAPI 增强
- [ ] 更新 `OpenApiPermissionCustomizer` 支持复杂 SpEL
- [ ] 为所有端点添加标准错误响应 (400/401/403/500)
- [ ] 导出完整 OpenAPI JSON

**验证标准**: `x-permissions` 覆盖率 > 80%

### 🟡 本周完成 (Week 1-2)

#### Day 4-5: 前端代码生成
- [ ] 配置 `openapi-typescript` 生成脚本
- [ ] 创建 `web/src/lib/api/client.ts` (基于 `openapi-fetch`)
- [ ] 添加认证拦截器 (自动注入 JWT + X-Tenant-ID)
- [ ] 迁移 1-2 个页面使用新客户端 (试点)

**验证标准**: 试点页面编译通过,IDE 有类型提示

#### Day 6-7: 契约测试
- [ ] 安装 Dredd
- [ ] 配置 `dredd.yml` 和 hooks
- [ ] 运行契约测试,修复不一致的端点

**验证标准**: Dredd 测试通过率 > 70%

### 🟢 两周完成 (Week 2-3)

#### Day 8-10: BDD 测试重构
- [ ] 将 Layer 1 BDD 测试从 UI 改为纯 API 调用
- [ ] 使用生成的类型安全客户端重写步骤定义
- [ ] 增加 API 响应断言 (状态码、字段、权限)

**验证标准**: Layer 1 测试通过率 > 90%

#### Day 11-12: CI/CD 集成
- [ ] 创建 GitHub Actions 工作流
- [ ] 添加权限一致性检查
- [ ] 添加契约测试步骤
- [ ] 配置 PR 自动评论测试结果

**验证标准**: CI 流程运行成功,PR 有测试报告

---

## 🎯 验证里程碑

### Milestone 1: 权限统一 (Day 3)
```bash
# 所有检查通过表示成功
✓ grep "hasRole" src -r | wc -l = 0
✓ mvn test (PermissionConsistencyTest) = PASS
✓ curl localhost:8081/api/v3/api-docs | jq '.paths[].*.["x-permissions"]' | grep -c "null" = 0
```

### Milestone 2: 前端类型安全 (Day 5)
```bash
✓ ls web/src/lib/api/generated/schema.ts = EXISTS
✓ cd web && npm run type-check = SUCCESS
✓ 至少 2 个页面使用新 API 客户端
```

### Milestone 3: 契约测试 (Day 7)
```bash
✓ cd web && npm run test:contract = >70% PASS
✓ Dredd 报告无 "契约不一致" 错误
```

### Milestone 4: BDD 重构 (Day 10)
```bash
✓ npm run test:bdd:layer-1 = >90% PASS
✓ 无 500 Internal Server Error
✓ 所有 403 错误都符合预期
```

### Milestone 5: CI 集成 (Day 12)
```bash
✓ GitHub Actions 工作流运行成功
✓ PR 自动评论包含测试报告
✓ 代码合并前必须通过契约测试
```

---

## 🆘 常见问题处理

### Q1: 权限迁移后出现大量 403 错误

**原因**: `hasRole()` 会自动添加 `ROLE_` 前缀,直接改为 `hasAuthority()` 会导致权限不匹配

**解决**:
```java
// exam-application/src/main/java/...UserDetailsServiceImpl.java

@Override
public UserDetails loadUserByUsername(String username) {
    User user = userRepository.findByUsername(username);

    // ✅ 将 Role 转换为 Authorities
    Set<GrantedAuthority> authorities = new HashSet<>();

    for (Role role : user.getRoles()) {
        // 保留 ROLE_ 前缀用于 hasRole()
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));

        // 添加对应的 Permissions
        for (Permission perm : role.getPermissions()) {
            authorities.add(new SimpleGrantedAuthority(perm.getCode()));
        }
    }

    return new org.springframework.security.core.userdetails.User(
        user.getUsername(),
        user.getPassword(),
        authorities
    );
}
```

### Q2: OpenAPI 生成的前端类型不匹配后端实际响应

**原因**: 后端 DTO 与 OpenAPI 注解不一致

**解决**:
```java
// 使用 @Schema 注解确保一致性
@Schema(description = "考试详情响应")
public class ExamResponse {

    @Schema(description = "考试ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private String id;

    @Schema(description = "考试名称", example = "2025年公务员考试", required = true)
    private String name;

    // ...
}
```

### Q3: BDD 测试在 CI 环境失败,本地通过

**原因**: 测试数据污染或顺序依赖

**解决**:
```typescript
// 每个场景前清理数据
import { Before } from '@cucumber/cucumber';

Before({ tags: '@layer-1' }, async function() {
  // 清理测试数据
  await cleanupTestData(this.testContext);

  // 重新初始化认证
  await this.authenticateAs('super_admin');
});
```

---

## 📞 支持渠道

- **技术问题**: 查看完整方案 [frontend-backend-integration-refactoring-plan.md](./frontend-backend-integration-refactoring-plan.md)
- **权限矩阵参考**: [RBAC_Design_Specification.md](../RBAC_Design_Specification.md)
- **BDD 测试指南**: [web/tests/bdd/README.md](../../web/tests/bdd/README.md)

---

**快速开始版本**: 1.0
**最后更新**: 2025-11-24
