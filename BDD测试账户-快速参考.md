# BDD测试账户 - 快速参考卡片

## 🚀 快速登录信息

### 超级管理员
```
用户名: super_admin
密码:   SuperAdmin123!@#
URL:    http://localhost:3000/login?role=super-admin
```

### 租户管理员（主测试账户）
```
用户名: tenant_admin_1762476737466
密码:   TenantAdmin@123
URL:    http://localhost:3000/login
租户ID: 421eee4a-1a2a-4f9d-95a4-37073d4b15c5
```

### 租户管理员（BDD通用）
```
用户名: tenant_admin
密码:   TenantAdmin123!@#
URL:    http://localhost:3000/login
租户:   测试企业A (test-company-a)
```

### 一级审核员
```
用户名: bdd_reviewer1
密码:   Reviewer123!@#
URL:    http://localhost:3000/login?role=reviewer
```

### 二级审核员
```
用户名: bdd_reviewer2
密码:   Reviewer123!@#
URL:    http://localhost:3000/login?role=reviewer
```

### 考生（主测试账户）
```
用户名: candidate_1762476516042
密码:   Candidate@123
URL:    http://localhost:3000/login
姓名:   张三
身份证: 110101199001011234
```

### 考生（BDD通用）
```
用户名: bdd_candidate
密码:   Candidate123!@#
URL:    http://localhost:3000/login
姓名:   张三
```

---

## 📋 Chrome DevTools 登录脚本

### 超级管理员登录
```javascript
// 在Chrome DevTools Console中执行
document.querySelector('input[name="username"]').value = 'super_admin';
document.querySelector('input[name="password"]').value = 'SuperAdmin123!@#';
document.querySelector('button[type="submit"]').click();
```

### 租户管理员登录
```javascript
document.querySelector('input[name="username"]').value = 'tenant_admin_1762476737466';
document.querySelector('input[name="password"]').value = 'TenantAdmin@123';
document.querySelector('button[type="submit"]').click();
```

### 考生登录
```javascript
document.querySelector('input[name="username"]').value = 'candidate_1762476516042';
document.querySelector('input[name="password"]').value = 'Candidate@123';
document.querySelector('button[type="submit"]').click();
```

---

## 🔧 Playwright 登录代码

### 超级管理员
```typescript
await page.goto('http://localhost:3000/login?role=super-admin');
await page.fill('input[name="username"]', 'super_admin');
await page.fill('input[name="password"]', 'SuperAdmin123!@#');
await page.click('button[type="submit"]');
await page.waitForURL(/\/super-admin/);
```

### 租户管理员
```typescript
await page.goto('http://localhost:3000/login');
await page.fill('input[name="username"]', 'tenant_admin_1762476737466');
await page.fill('input[name="password"]', 'TenantAdmin@123');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin|\/tenant/);
```

### 考生
```typescript
await page.goto('http://localhost:3000/login');
await page.fill('input[name="username"]', 'candidate_1762476516042');
await page.fill('input[name="password"]', 'Candidate@123');
await page.click('button[type="submit"]');
await page.waitForURL(/\/my-/);
```

---

## 🔑 API 登录测试

### PowerShell
```powershell
# 超级管理员
$loginData = @{
    username = "super_admin"
    password = "SuperAdmin123!@#"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" `
    -Method POST -Body $loginData -ContentType "application/json"
$token = $response.token
```

### cURL
```bash
# 租户管理员
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tenant_admin_1762476737466",
    "password": "TenantAdmin@123"
  }'
```

---

## 📊 账户权限对照表

| 功能 | 超管 | 租户管理员 | 一级审核员 | 二级审核员 | 考生 |
|------|------|-----------|-----------|-----------|------|
| 创建租户 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 创建考试 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 创建岗位 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 一级审核 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 二级审核 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 录入成绩 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 报名考试 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 查看准考证 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 查询成绩 | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 常用测试场景

### 场景1: 完整考试流程
1. **超级管理员**: 创建租户
2. **租户管理员**: 创建考试、岗位、科目
3. **考生**: 报名考试
4. **一级审核员**: 审核报名
5. **二级审核员**: 最终审核
6. **考生**: 支付、下载准考证
7. **租户管理员**: 安排座位、录入成绩
8. **考生**: 查询成绩

### 场景2: 审核流程测试
1. **租户管理员**: 创建审核员账户
2. **考生**: 提交报名
3. **一级审核员**: 一级审核通过
4. **二级审核员**: 二级审核通过
5. **考生**: 查看审核结果

### 场景3: 权限验证测试
1. **考生**: 尝试访问管理页面（应失败）
2. **审核员**: 尝试创建考试（应失败）
3. **租户管理员**: 尝试访问其他租户数据（应失败）

---

## 🔍 快速验证命令

### 检查账户是否存在
```sql
SELECT username, email, full_name, roles, status 
FROM public.users 
WHERE username IN ('super_admin', 'tenant_admin_1762476737466', 'candidate_1762476516042');
```

### 重置密码（如需要）
```sql
-- 重置超级管理员密码为 SuperAdmin123!@#
UPDATE public.users 
SET password_hash = '$2a$10$IJn3H1W5rHcOBA677AcVI.lPWCV7TBY09PBKvn6Zah6qlBZOSMeUO'
WHERE username = 'super_admin';
```

---

**提示**: 
- 所有密码都包含大小写字母、数字和特殊字符
- 测试账户仅用于开发和测试环境
- 生产环境请使用强密码并定期更换

