# 考试状态管理修复总结

## 问题描述

用户在考试详情页面点击"开放报名"按钮时，提示"租户信息缺失，请刷新页面重试"。

## 问题根源

### 1. 租户ID传递问题

**文件：** `web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx`

**问题：**
```typescript
// 错误的写法
<ExamStatusEditor
  examId={examId}
  currentStatus={exam.status}
  tenantId={tenant?.id || ''}  // ❌ 如果 tenant 未加载，传递空字符串
  onStatusChange={refetch}
/>
```

当 `tenant` 还未加载完成时，`tenant?.id` 为 `undefined`，然后 `|| ''` 会返回空字符串 `''`，导致后端无法识别租户。

**修复：**
```typescript
// 正确的写法
{tenant?.id && (
  <ExamStatusEditor
    examId={examId}
    currentStatus={exam.status}
    tenantId={tenant.id}  // ✅ 只有在 tenant.id 存在时才渲染组件
    onStatusChange={refetch}
  />
)}
```

### 2. 前后端状态不一致

**后端状态（ExamStatus.java）：**
- `DRAFT` - 草稿
- `OPEN` - 开放报名
- `CLOSED` - 报名关闭
- `IN_PROGRESS` - 考试进行中
- `COMPLETED` - 已完成

**前端旧状态（错误）：**
- `DRAFT` - 草稿
- `PUBLISHED` - 已发布 ❌
- `REGISTRATION_OPEN` - 报名中 ❌
- `REGISTRATION_CLOSED` - 报名截止 ❌
- `IN_PROGRESS` - 考试进行中
- `COMPLETED` - 已完成
- `CANCELLED` - 已取消 ❌

**问题：** 前端使用了后端不存在的状态值，导致状态转换失败。

## 修复内容

### 1. 修复租户ID传递

**文件：** `web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx`

**修改内容：**
- ✅ 只有在 `tenant?.id` 存在时才渲染 `ExamStatusEditor` 和 `ExamStatusActions` 组件
- ✅ 为"发布考试"和"重新发布"按钮添加 `disabled={!tenant?.id}` 属性

### 2. 统一前后端状态定义

**文件：** `web/src/components/admin/exam-detail/ExamStatusEditor.tsx`

**修改前：**
```typescript
const STATUS_OPTIONS = [
    { value: 'DRAFT', label: '草稿', description: '考试尚未发布' },
    { value: 'PUBLISHED', label: '已发布', ... },  // ❌ 后端不存在
    { value: 'REGISTRATION_OPEN', label: '报名中', ... },  // ❌ 后端不存在
    ...
]
```

**修改后：**
```typescript
const STATUS_OPTIONS = [
    { value: 'DRAFT', label: '草稿', description: '考试尚未开放报名' },
    { value: 'OPEN', label: '开放报名', description: '考试报名已开放，考生可以提交报名申请', action: 'open' },
    { value: 'CLOSED', label: '报名关闭', description: '报名已关闭，等待考试开始', action: 'close' },
    { value: 'IN_PROGRESS', label: '考试进行中', description: '考试正在进行', action: 'start' },
    { value: 'COMPLETED', label: '已完成', description: '考试已结束', action: 'complete' },
]
```

**状态转换规则（基于后端 ExamStatus.canTransitionTo）：**
```typescript
const STATUS_TRANSITIONS: Record<string, string[]> = {
    'DRAFT': ['OPEN'],           // 草稿 → 开放报名
    'OPEN': ['CLOSED'],          // 开放报名 → 报名关闭
    'CLOSED': ['IN_PROGRESS'],   // 报名关闭 → 考试进行中
    'IN_PROGRESS': ['COMPLETED'], // 考试进行中 → 已完成
    'COMPLETED': [],             // 已完成（终态）
}
```

### 3. 修复状态操作菜单

**文件：** `web/src/components/admin/exam-detail/ExamStatusActions.tsx`

**修改内容：**
- ✅ 移除不存在的状态（`PUBLISHED`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `CANCELLED`）
- ✅ 简化状态转换逻辑，严格按照后端规则
- ✅ 添加租户ID验证

### 4. 修复状态徽章显示

**文件：** `web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx`

**修改内容：**
```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="outline">草稿</Badge>
    case 'OPEN':
      return <Badge variant="default" className="bg-green-600">开放报名</Badge>
    case 'CLOSED':
      return <Badge variant="secondary">报名关闭</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="default" className="bg-blue-600">考试进行中</Badge>
    case 'COMPLETED':
      return <Badge variant="secondary">已完成</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}
```

### 5. 添加错误提示

**文件：** `web/src/components/admin/exam-detail/ExamStatusEditor.tsx` 和 `ExamStatusActions.tsx`

**新增验证：**
```typescript
if (!tenantId) {
    toast.error('租户信息缺失，请刷新页面重试')
    return
}
```

## 后端API端点

所有状态转换API都已存在且正常工作：

```
POST /api/v1/exams/{id}/open      - 开放报名 (DRAFT → OPEN)
POST /api/v1/exams/{id}/close     - 关闭报名 (OPEN → CLOSED)
POST /api/v1/exams/{id}/start     - 开始考试 (CLOSED → IN_PROGRESS)
POST /api/v1/exams/{id}/complete  - 完成考试 (IN_PROGRESS → COMPLETED)
```

**别名端点（向后兼容）：**
```
POST /api/v1/exams/{id}/publish   - 等同于 /open
POST /api/v1/exams/{id}/cancel    - 等同于 /close
```

## 修改的文件

1. ✅ `web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx` - 修复租户ID传递和状态徽章
2. ✅ `web/src/components/admin/exam-detail/ExamStatusEditor.tsx` - 统一状态定义和转换规则
3. ✅ `web/src/components/admin/exam-detail/ExamStatusActions.tsx` - 简化状态操作菜单

## 测试验证

### 1. 验证租户ID传递

**步骤：**
1. 访问考试详情页面
2. 等待页面完全加载（租户信息加载完成）
3. 点击"开放报名"按钮

**预期结果：**
- ✅ 不再提示"租户信息缺失"
- ✅ 考试状态成功从 DRAFT 转换为 OPEN
- ✅ 状态徽章显示为"开放报名"（绿色）

### 2. 验证状态流转

**完整流程：**
```
DRAFT (草稿)
  ↓ 点击"开放报名"
OPEN (开放报名)
  ↓ 点击"关闭报名"
CLOSED (报名关闭)
  ↓ 点击"开始考试"
IN_PROGRESS (考试进行中)
  ↓ 点击"完成考试"
COMPLETED (已完成)
```

**预期结果：**
- ✅ 每个状态只能转换到下一个允许的状态
- ✅ 状态徽章正确显示
- ✅ 操作菜单只显示允许的操作

## 总结

所有问题已修复：
1. ✅ 租户ID正确传递到状态管理组件
2. ✅ 前后端状态定义完全一致
3. ✅ 状态转换规则严格遵循后端业务逻辑
4. ✅ 添加了完善的错误提示

现在可以正常进行考试状态管理操作！

