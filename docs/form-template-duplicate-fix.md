# 表单模板重复定义修复总结

## 问题描述

在实现表单模板管理功能时，`useExamFormTemplate` 函数被定义了两次，导致编译错误：

```
Error: the name `useExamFormTemplate` is defined multiple times
```

## 问题根源

**文件：** `web/src/lib/api-hooks.ts`

**重复定义：**
1. **旧版本（第 1415 行）：** 只接受 `examId` 参数，不传递 `tenantId`
   ```typescript
   export function useExamFormTemplate(examId: string) {
     return useQuery({
       queryKey: ['exam-form-template', examId],
       queryFn: async () => {
         const response = await apiGet(`/exams/${examId}/form-template`)
         return response as { examId: string; templateJson: string | null }
       },
       enabled: !!examId,
     })
   }
   ```

2. **新版本（第 1882 行）：** 接受 `examId` 和 `tenantId` 参数，使用 `apiGetWithTenant`
   ```typescript
   export function useExamFormTemplate(examId: string | undefined, tenantId: string | undefined) {
     return useQuery({
       queryKey: formTemplateQueryKeys.examTemplate(examId || '', tenantId || ''),
       queryFn: async () => {
         if (!examId || !tenantId) throw new Error('Exam ID and Tenant ID are required')
         const response = await apiGetWithTenant(`/exams/${examId}/form-template`, tenantId)
         return FormTemplateSchema.parse(response)
       },
       enabled: !!examId && !!tenantId,
     })
   }
   ```

## 修复方案

### 1. 删除旧版本的 hooks

**文件：** `web/src/lib/api-hooks.ts`

**删除内容：**
- ❌ 删除旧版本的 `useExamFormTemplate` (第 1415-1424 行)
- ❌ 删除旧版本的 `useUpdateExamFormTemplate` (第 1429-1444 行)

**保留内容：**
- ✅ 保留新版本的 `useExamFormTemplate` (第 1882 行)
- ✅ 保留新版本的 `useUpdateFormTemplate` (第 1895 行)

### 2. 重定向旧的表单配置页面

**文件：** `web/src/app/[tenantSlug]/admin/exams/[examId]/form-config/page.tsx`

**修改前：** 独立的表单配置页面，使用旧版本的 API

**修改后：** 重定向到考试详情页面的"报名表单"标签页

```typescript
export default function ExamFormConfigPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string

  useEffect(() => {
    // 重定向到考试详情页面的"报名表单"标签页
    router.replace(`/${tenantSlug}/admin/exams/${examId}/detail?tab=form`)
  }, [router, tenantSlug, examId])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">正在跳转到表单配置页面...</p>
    </div>
  )
}
```

### 3. 支持 URL 参数切换标签页

**文件：** `web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx`

**新增功能：** 支持通过 URL 参数 `?tab=form` 直接打开"报名表单"标签页

```typescript
export default function TenantExamDetailPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('basic')

  // Support URL parameter ?tab=form to open specific tab
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // ...
}
```

## 修复结果

### 修改的文件

1. ✅ `web/src/lib/api-hooks.ts` - 删除重复定义
2. ✅ `web/src/app/[tenantSlug]/admin/exams/[examId]/form-config/page.tsx` - 重定向到新入口
3. ✅ `web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx` - 支持 URL 参数
4. ✅ `docs/form-template-testing-guide.md` - 更新测试指南

### 功能统一

**旧的表单配置入口（已废弃）：**
- ❌ `/admin/exams/{examId}/form-config`
- ⚠️ 访问此 URL 会自动重定向到新入口

**新的统一入口（推荐）：**
- ✅ `/admin/exams/{examId}/detail?tab=form`
- ✅ 或者在考试详情页面点击"报名表单"标签页

### 优势

1. **统一管理：** 所有考试相关功能都在考试详情页面，避免功能分散
2. **租户隔离：** 新版本的 hooks 都正确传递 `tenantId`，确保多租户数据隔离
3. **向后兼容：** 旧的 URL 会自动重定向，不会出现 404 错误
4. **用户体验：** 通过 URL 参数可以直接打开特定标签页，方便分享链接

## 测试验证

### 1. 验证重定向

**步骤：**
1. 访问旧的表单配置 URL：`http://localhost:3000/duanruo-test2/admin/exams/{examId}/form-config`
2. 观察页面是否自动跳转

**预期结果：**
- ✅ 显示"正在跳转到表单配置页面..."提示
- ✅ 自动跳转到 `http://localhost:3000/duanruo-test2/admin/exams/{examId}/detail?tab=form`
- ✅ 考试详情页面打开，"报名表单"标签页被激活

### 2. 验证 URL 参数

**步骤：**
1. 直接访问：`http://localhost:3000/duanruo-test2/admin/exams/{examId}/detail?tab=form`
2. 观察页面是否直接打开"报名表单"标签页

**预期结果：**
- ✅ 页面加载后，"报名表单"标签页被激活
- ✅ 不需要手动点击标签页

### 3. 验证编译错误已修复

**步骤：**
1. 运行 `npm run build` 或 `npm run dev`
2. 检查是否有编译错误

**预期结果：**
- ✅ 没有 "the name `useExamFormTemplate` is defined multiple times" 错误
- ✅ 编译成功

## 总结

所有重复定义问题已修复，表单配置功能已统一到考试详情页面的"报名表单"标签页。旧的独立表单配置页面已重定向到新入口，确保向后兼容。

