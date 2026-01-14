# 🚨 紧急修复：租户管理员401 Unauthorized问题

## 问题根因

**JWT Secret Key配置不一致导致Token验证失败！**

`application.yml` 和 `application-dev.yml` 中的JWT secret key默认值不同：
- `application.yml`: `exam-registration-jwt-secret-key-change-in-production-64bytes-min`
- `application-dev.yml`: `exam-registration-jwt-secret-key-change-in-production` ❌

当后端使用dev profile启动时，使用的是`application-dev.yml`的配置。如果用户的Token是用不同的secret key生成的，后端无法验证Token签名，导致返回401。

## ✅ 已修复

已统一两个配置文件中的JWT secret key默认值为：
```
exam-registration-jwt-secret-key-change-in-production-64bytes-min
```

## 🔧 立即执行的修复步骤

### 1. 停止当前后端服务

在运行后端的终端中按 `Ctrl+C` 停止服务。

### 2. 重新启动后端

```powershell
# 方式1: 使用启动脚本
./scripts/start-backend.ps1

# 方式2: 直接使用Maven
mvn -f exam-bootstrap/pom.xml spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. 清除浏览器中的旧Token

打开浏览器开发者工具 (F12) → Application/存储 → Local Storage → 删除以下项：
- `token`
- `user`
- 或者直接清除所有localStorage

### 4. 重新登录

访问 http://localhost:3000/login
- 用户名: `duanruotest1`
- 密码: `Waynez0625@wh`

### 5. 验证修复

登录成功后，访问考试列表页面，应该能正常显示数据。

## 🔍 验证Token是否有效

### 方法1: 使用Chrome DevTools

1. 登录后，打开开发者工具 (F12)
2. 切换到 Network 标签
3. 访问考试列表页面
4. 查找 `/api/v1/exams` 请求
5. 检查响应状态码：
   - ✅ 200 OK → Token有效
   - ❌ 401 Unauthorized → Token无效，需要重新登录

### 方法2: 使用PowerShell脚本测试

```powershell
# 1. 登录获取Token
$loginBody = @{
    username = "duanruotest1"
    password = "Waynez0625@wh"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

Write-Host "Token获取成功: $($token.Substring(0, 50))..."

# 2. 测试访问考试列表
$headers = @{
    "Authorization" = "Bearer $token"
    "X-Tenant-ID" = $loginResponse.user.tenantId
}

try {
    $examsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/exams?page=0&size=10" -Method Get -Headers $headers
    Write-Host "✓ 成功访问考试列表，考试数量: $($examsResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ 访问失败: $($_.Exception.Message)" -ForegroundColor Red
}
```

## 📋 技术细节

### Token验证流程

1. **JwtAuthenticationFilter** 从请求头提取Token
2. **JwtTokenService.validateToken()** 验证Token:
   ```java
   Jwts.parserBuilder()
       .setSigningKey(secretKey)  // ← 使用配置的secret key
       .build()
       .parseClaimsJws(token);    // ← 验证签名
   ```
3. 如果签名不匹配 → 抛出 `JwtException` → 返回 `false`
4. 如果验证失败 → SecurityContext未设置 → Spring Security返回401

### 为什么会出现这个问题？

1. 开发过程中可能使用了不同的配置启动后端
2. 用户登录时获得的Token使用当时的secret key生成
3. 后端重启后使用了不同的secret key
4. 旧Token无法通过新secret key的验证

## 🛡️ 预防措施

### 1. 生产环境必须使用环境变量

```bash
# Linux/Mac
export JWT_SECRET=your-production-secret-key-at-least-64-bytes-long

# Windows PowerShell
$env:JWT_SECRET="your-production-secret-key-at-least-64-bytes-long"
```

### 2. 配置一致性检查

在CI/CD流程中添加检查，确保所有profile的默认配置一致。

### 3. Token版本控制

考虑在Token payload中添加版本号：
```json
{
  "tokenVersion": "v1",
  "userId": "...",
  ...
}
```

### 4. 增强日志

修改 `JwtTokenService.validateToken()` 使用Logger而不是System.out：
```java
catch (JwtException | IllegalArgumentException e) {
    logger.error("Token validation failed: {}", e.getMessage(), e);
    return false;
}
```

## 📄 相关文档

- 详细根因分析: `docs/fixes/tenant-admin-401-unauthorized-root-cause-analysis.md`
- 安全配置指南: `docs/security-guidelines.md`

## ✅ 修复确认清单

- [x] 统一JWT secret key配置
- [ ] 重启后端服务
- [ ] 清除浏览器旧Token
- [ ] 重新登录
- [ ] 验证考试列表访问成功

