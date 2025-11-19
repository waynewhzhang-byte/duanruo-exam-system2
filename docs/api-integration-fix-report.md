# API集成修复报告

**日期**: 2025-10-31  
**任务**: 分析并修复后端API、认证和CORS问题  
**状态**: ✅ 已完成

---

## 📊 问题分析结果

### 1. ✅ 后端API实现状态

#### 已实现的API

| API端点 | Controller | 方法 | 权限 | 状态 |
|---------|-----------|------|------|------|
| `GET /api/v1/exams` | ExamController | getAllExams() | EXAM_VIEW | ✅ 已实现 |
| `POST /api/v1/exams` | ExamController | createExam() | EXAM_CREATE | ✅ 已实现 |
| `PUT /api/v1/exams/{id}` | ExamController | updateExam() | SUPER_ADMIN, TENANT_ADMIN | ✅ 已实现 |
| `DELETE /api/v1/exams/{id}` | ExamController | removeExamByIdentifier() | EXAM_DELETE | ✅ 已实现 |
| `POST /api/v1/exams/{id}/open` | ExamController | openExam() | EXAM_OPEN | ✅ 已实现 |
| `POST /api/v1/exams/{id}/close` | ExamController | closeExam() | EXAM_CLOSE | ✅ 已实现 |
| `GET /api/v1/applications/{id}` | ApplicationController | getApplicationById() | APPLICATION_VIEW_OWN/ALL | ✅ 已实现 |
| `POST /api/v1/reviews/{applicationId}/approve` | ReviewController | approveApplication() | REVIEW_PRIMARY/SECONDARY | ✅ 已实现 |
| `POST /api/v1/reviews/{applicationId}/reject` | ReviewController | rejectApplication() | REVIEW_PRIMARY/SECONDARY | ✅ 已实现 |

#### 缺失的API（已修复）

| API端点 | 问题 | 解决方案 | 状态 |
|---------|------|---------|------|
| `POST /api/v1/exams/{id}/publish` | 前端调用但后端不存在 | 添加为`/open`的别名 | ✅ 已修复 |
| `POST /api/v1/exams/{id}/cancel` | 前端调用但后端不存在 | 添加为`/close`的别名 | ✅ 已修复 |

---

### 2. ⚠️ 认证问题（已修复）

#### 问题描述

前端页面使用原生`fetch`调用API，**没有自动添加Authorization header**，导致所有API调用都会返回401 Unauthorized。

#### 受影响的文件

1. `web/src/app/admin/exams/page.tsx` - 考试管理页面
2. `web/src/app/reviewer/review/[applicationId]/page.tsx` - 审核详情页面

#### 错误示例

```typescript
// ❌ 错误：没有Authorization header
const response = await fetch('/api/v1/exams')

// ❌ 错误：手动添加header也不够（没有从cookie读取token）
const response = await fetch('/api/v1/exams', {
  headers: { 'Authorization': 'Bearer ???' }
})
```

#### 解决方案

使用`lib/api.ts`中的封装函数，自动从cookie读取token并添加到header：

```typescript
// ✅ 正确：自动添加Authorization header
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

const data = await apiGet<Exam[]>('/exams')
await apiPost('/exams', formData)
await apiPut(`/exams/${id}`, formData)
await apiDelete(`/exams/${id}`)
```

---

### 3. ✅ CORS配置（已验证）

#### 配置状态

CORS已经正确配置，无需修改。

#### 配置详情

**文件**: `exam-bootstrap/src/main/resources/application.yml`

```yaml
app:
  security:
    cors:
      allowed-origins: http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS
      allowed-headers: "*"
      allow-credentials: true
```

**实现**: `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/config/SecurityConfig.java`

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // 允许的源
    configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
    
    // 允许的方法
    configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
    
    // 允许的头
    configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
    
    // 允许凭证（Cookie、Authorization头等）
    configuration.setAllowCredentials(allowCredentials);
    
    // 暴露的响应头
    configuration.setExposedHeaders(Arrays.asList(
        "Authorization",
        "X-Total-Count",
        "X-Page-Number",
        "X-Page-Size",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset"
    ));
    
    // 预检请求缓存时间（1小时）
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    
    return source;
}
```

---

## 🔧 修复详情

### 修复1: 添加缺失的后端API端点

**文件**: `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/ExamController.java`

**修改内容**:

```java
@Operation(summary = "发布考试（别名：开放报名）", description = "将考试状态设置为开放报名，等同于/open端点")
@PostMapping("/{id}/publish")
@PreAuthorize("hasAuthority('EXAM_OPEN')")
public ResponseEntity<ExamResponse> publishExam(@PathVariable("id") UUID id) {
    // 发布考试 = 开放报名
    ExamId examId = ExamId.of(id);
    ExamResponse exam = examApplicationService.openExam(examId);
    return ResponseEntity.ok(exam);
}

@Operation(summary = "取消考试（别名：关闭报名）", description = "将考试状态设置为关闭报名，等同于/close端点")
@PostMapping("/{id}/cancel")
@PreAuthorize("hasAuthority('EXAM_CLOSE')")
public ResponseEntity<ExamResponse> cancelExam(@PathVariable("id") UUID id) {
    // 取消考试 = 关闭报名
    ExamId examId = ExamId.of(id);
    ExamResponse exam = examApplicationService.closeExam(examId);
    return ResponseEntity.ok(exam);
}
```

**编译结果**: ✅ 成功

```
[INFO] BUILD SUCCESS
[INFO] Total time:  6.329 s
```

---

### 修复2: 考试管理页面API调用

**文件**: `web/src/app/admin/exams/page.tsx`

**修改内容**:

1. **添加导入**:
```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
```

2. **修复所有API调用**:

| 原代码 | 修复后 | 说明 |
|--------|--------|------|
| `fetch('/api/v1/exams')` | `apiGet<Exam[]>('/exams')` | 自动添加token |
| `fetch('/api/v1/exams', {method: 'POST', ...})` | `apiPost<Exam>('/exams', formData)` | 自动添加token和Content-Type |
| `fetch('/api/v1/exams/${id}', {method: 'PUT', ...})` | `apiPut<Exam>('/exams/${id}', formData)` | 自动添加token |
| `fetch('/api/v1/exams/${id}', {method: 'DELETE'})` | `apiDelete('/exams/${id}')` | 自动添加token |
| `fetch('/api/v1/exams/${id}/publish', {method: 'POST'})` | `apiPost('/exams/${id}/publish')` | 自动添加token |
| `fetch('/api/v1/exams/${id}/cancel', {method: 'POST'})` | `apiPost('/exams/${id}/cancel')` | 自动添加token |

**类型检查结果**: ✅ 无错误

---

### 修复3: 审核详情页面API调用

**文件**: `web/src/app/reviewer/review/[applicationId]/page.tsx`

**修改内容**:

1. **添加导入**:
```typescript
import { apiGet, apiPost } from '@/lib/api'
```

2. **修复所有API调用**:

| 原代码 | 修复后 | 说明 |
|--------|--------|------|
| `fetch('/api/v1/applications/${id}')` | `apiGet<Application>('/applications/${id}')` | 自动添加token |
| `fetch('/api/v1/reviews/${id}/approve', {method: 'POST', ...})` | `apiPost('/reviews/${id}/approve', {comments})` | 自动添加token |
| `fetch('/api/v1/reviews/${id}/reject', {method: 'POST', ...})` | `apiPost('/reviews/${id}/reject', {comments})` | 自动添加token |

**类型检查结果**: ✅ 无错误

---

## 📝 lib/api.ts 工作原理

### 自动Token注入

```typescript
// 1. 从cookie读取token
async function resolveAuthToken(provided?: string): Promise<string | null> {
  if (provided) return provided
  
  // 浏览器环境：从document.cookie读取
  if (typeof window !== 'undefined') {
    const found = document.cookie.split('; ').find(row => row.startsWith('auth-token='))
    if (found) return decodeURIComponent(found.split('=')[1])
  }
  
  // 服务器环境：从next/headers cookies()读取
  const cookieStore = await import('next/headers').cookies()
  return cookieStore.get('auth-token')?.value ?? null
}

// 2. 自动添加到Authorization header
const resolvedToken = await resolveAuthToken(token)
if (resolvedToken) {
  headers.Authorization = `Bearer ${resolvedToken}`
}
```

### 自动错误处理

```typescript
// 401 Unauthorized -> 跳转登录
if (response.status === 401) {
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
  throw new Error('Unauthorized')
}

// 其他错误 -> 抛出异常
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${errorData.message}`)
}
```

---

## ✅ 验证结果

### 后端编译

```bash
cd exam-adapter-rest && mvn clean compile -DskipTests
```

**结果**: ✅ 成功
```
[INFO] BUILD SUCCESS
[INFO] Total time:  6.329 s
```

### 前端类型检查

```bash
npm run type-check
```

**结果**: ✅ 我们修改的文件无错误

- `web/src/app/admin/exams/page.tsx` - ✅ 无错误
- `web/src/app/reviewer/review/[applicationId]/page.tsx` - ✅ 无错误

（其他234个错误是已存在的，不是本次修改引入的）

---

## 🎯 下一步建议

### 立即执行

1. **重启后端服务**:
```bash
cd exam-bootstrap
mvn spring-boot:run
```

2. **运行BDD测试验证修复**:
```bash
cd web
npm run test:bdd -- tests/bdd/features/super-admin/tenant-management.feature
npm run test:bdd -- tests/bdd/features/admin/exam-management.feature
npm run test:bdd -- tests/bdd/features/reviewer/review-process.feature
```

### 预期效果

修复后，以下场景应该通过：

1. **超级管理员租户管理** (3个场景)
   - 查看租户列表
   - 禁用/启用租户
   - 删除租户

2. **考试管理** (8个场景)
   - 创建考试
   - 编辑考试
   - 发布考试 ← **新修复**
   - 取消考试 ← **新修复**
   - 删除考试

3. **审核流程** (6个场景)
   - 查看待审核列表
   - 审核通过 ← **新修复**
   - 审核拒绝 ← **新修复**

**预计通过率提升**: 从 33.33% (28/84) → **53.57% (45/84)**

---

## 📚 总结

### 完成的工作

1. ✅ **后端API**: 添加了`/publish`和`/cancel`端点作为`/open`和`/close`的别名
2. ✅ **认证修复**: 将所有原生`fetch`调用替换为`lib/api.ts`封装函数
3. ✅ **CORS验证**: 确认CORS配置正确，无需修改

### 修复的文件

- **后端** (1个文件):
  - `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/ExamController.java`

- **前端** (2个文件):
  - `web/src/app/admin/exams/page.tsx`
  - `web/src/app/reviewer/review/[applicationId]/page.tsx`

### 关键改进

1. **统一API调用方式**: 所有API调用现在都使用`lib/api.ts`，确保token自动注入
2. **更好的错误处理**: 401错误自动跳转登录，其他错误抛出异常
3. **类型安全**: 使用TypeScript泛型确保API响应类型正确

### 教训

**问题根源**: 创建UI页面时使用了原生`fetch`，忽略了认证需求。

**解决方案**: 始终使用项目提供的API封装函数（`lib/api.ts`），而不是原生`fetch`。

**最佳实践**:
- ✅ 使用 `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- ❌ 不要使用原生 `fetch`

