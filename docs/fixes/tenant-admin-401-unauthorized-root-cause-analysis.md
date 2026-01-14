# 租户管理员401 Unauthorized问题根因分析

## 问题描述

租户管理员 `duanruotest1` (密码: `Waynez0625@wh`) 登录系统后，访问考试列表时收到 **401 Unauthorized** 错误。

## 问题现象

1. ✅ 登录成功，获得JWT Token
2. ✅ Token包含正确的角色 (`TENANT_ADMIN`) 和权限 (`exam:view` 等82个权限)
3. ✅ 前端正确发送 `Authorization: Bearer <token>` header
4. ✅ 前端正确发送 `X-Tenant-ID` header
5. ❌ 后端返回 401 Unauthorized，错误信息: "Authentication required"

## 数据库验证

```sql
-- 用户存在
SELECT COUNT(*) FROM users WHERE username = 'duanruotest1';
-- 结果: 1

-- 租户角色存在且激活
SELECT role, active, tenant_id::text 
FROM user_tenant_roles 
WHERE user_id = '802f6a05-3784-48a1-8c23-3b706dd78f61';
-- 结果:
-- role: TENANT_ADMIN
-- active: t (true)
-- tenant_id: 45f3dbfe-514b-4a6f-9d41-1a9d630bca3e (与Token中的tenantId匹配)
```

## Token内容分析

从Chrome DevTools解析的Token payload:
```json
{
  "userId": "802f6a05-3784-48a1-8c23-3b706dd78f61",
  "username": "duanruotest1",
  "email": "duanruo@example.com",
  "fullName": "李四",
  "tenantId": "45f3dbfe-514b-4a6f-9d41-1a9d630bca3e",
  "tokenType": "TENANT",
  "status": "ACTIVE",
  "roles": ["TENANT_ADMIN"],
  "permissions": ["exam:view", "exam:create", ...], // 82个权限
  "iss": "exam-registration-system",
  "iat": 1764132966,
  "exp": 1764219366
}
```

## 代码执行流程分析

### 1. Spring Security配置 (SecurityConfig.java)

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/auth/login").permitAll()
    .requestMatchers("/auth/register").permitAll()
    // ... 其他公开端点
    .anyRequest().authenticated()  // ← 所有其他请求需要认证
)
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
```

### 2. JWT认证过滤器 (JwtAuthenticationFilter.java)

```java
protected void doFilterInternal(...) {
    String token = extractTokenFromRequest(request);
    
    if (token != null && jwtTokenService.validateToken(token)) {
        // 提取用户信息和权限
        // 设置SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
    
    filterChain.doFilter(request, response);  // ← 继续执行
}
```

**关键点**: 如果Token验证失败，过滤器**不会抛出异常**，而是继续执行过滤器链。

### 3. Spring Security授权检查

当请求到达Controller时，Spring Security检查SecurityContext中是否有Authentication对象：
- 如果有 → 继续执行，检查@PreAuthorize权限
- 如果没有 → 触发 `JwtAuthenticationEntryPoint`，返回401

### 4. JWT Token验证 (JwtTokenService.java)

```java
public Boolean validateToken(String token) {
    try {
        Jwts.parserBuilder()
            .setSigningKey(secretKey)  // ← 使用配置的secret key验证签名
            .build()
            .parseClaimsJws(token);
        return !isTokenExpired(token);
    } catch (JwtException | IllegalArgumentException e) {
        System.out.println("Token validation failed: " + e.getMessage());
        e.printStackTrace();
        return false;  // ← 验证失败返回false
    }
}
```

## 🎯 根本原因

**JWT Secret Key配置不一致！**

### 配置文件对比

**application.yml** (默认配置):
```yaml
app:
  security:
    jwt:
      secret: ${JWT_SECRET:exam-registration-jwt-secret-key-change-in-production-64bytes-min}
```

**application-dev.yml** (开发环境配置):
```yaml
app:
  security:
    jwt:
      secret: ${JWT_SECRET:exam-registration-jwt-secret-key-change-in-production}
```

**差异**: 默认值不同！
- application.yml: `...-64bytes-min` (后缀)
- application-dev.yml: `...-production` (无后缀)

### 问题场景

1. 后端使用 `dev` profile启动 → 使用 `application-dev.yml` 的secret key
2. 用户登录时，Token使用当前的secret key生成
3. 如果之前后端使用不同的配置启动过，旧Token使用的是不同的secret key
4. 当前后端无法验证旧Token的签名 → `validateToken()` 返回 `false`
5. SecurityContext未设置 → Spring Security返回401

## 解决方案

### 方案1: 统一配置文件中的默认secret key

修改 `application-dev.yml`:
```yaml
app:
  security:
    jwt:
      secret: ${JWT_SECRET:exam-registration-jwt-secret-key-change-in-production-64bytes-min}
```

### 方案2: 使用环境变量

设置环境变量 `JWT_SECRET`，确保所有环境使用相同的secret key:
```bash
export JWT_SECRET=your-consistent-secret-key-here
```

### 方案3: 重新登录

清除浏览器中的旧Token，重新登录获取新Token。

## 验证步骤

1. 统一secret key配置
2. 重启后端服务
3. 清除浏览器localStorage中的token
4. 重新登录
5. 测试访问考试列表

## 预防措施

1. **配置一致性检查**: 确保所有profile的默认配置一致
2. **环境变量优先**: 生产环境必须使用环境变量设置secret key
3. **Token版本控制**: 考虑在Token中添加版本号，便于识别不同配置生成的Token
4. **日志增强**: 在Token验证失败时记录详细的错误信息（当前只打印到System.out）

## 相关文件

- `exam-bootstrap/src/main/resources/application.yml`
- `exam-bootstrap/src/main/resources/application-dev.yml`
- `exam-application/src/main/java/com/duanruo/exam/application/service/JwtTokenService.java`
- `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/security/JwtAuthenticationFilter.java`
- `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/config/SecurityConfig.java`

