# 表单模板管理功能实现总结

## 概述

实现了基于方案A的表单模板管理功能：每个考试创建独立的表单模板，支持草稿/已发布两种状态。

## 后端修改

### 1. Domain Layer (领域层)

**文件：** `exam-domain/src/main/java/com/duanruo/exam/domain/exam/Exam.java`

**修改内容：**
- ✅ 添加 `FormTemplateId formTemplateId` 字段
- ✅ 添加 `getFormTemplateId()` getter 方法
- ✅ 添加 `assignFormTemplate(FormTemplateId)` 业务方法
- ✅ 添加 `unassignFormTemplate()` 业务方法
- ✅ 添加新的 `rebuild` 方法重载，支持 `formTemplateId` 参数
- ✅ 添加 `rebuildWithFormTemplateAndRules` 方法重载

**业务规则：**
- 只有 DRAFT 状态的考试可以关联/取消关联表单模板
- CLOSED、IN_PROGRESS、COMPLETED 状态的考试不能修改表单模板

### 2. Infrastructure Layer (基础设施层)

**文件：** `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/entity/ExamEntity.java`

**修改内容：**
- ✅ 添加 `UUID formTemplateId` 字段
- ✅ 添加 `getFormTemplateId()` 和 `setFormTemplateId()` 方法

**文件：** `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/mapper/ExamMapper.java`

**修改内容：**
- ✅ `toEntity()` 方法：映射 `formTemplateId` 到 entity
- ✅ `toDomain()` 方法：映射 `formTemplateId` 到 domain

### 3. 数据库支持

**已存在的 Migration：**
- ✅ `V015__Create_form_template_tables.sql` - 创建 `form_templates` 表
- ✅ `exams` 表已有 `form_template_id` 列（外键）

**表结构：**
```sql
-- form_templates 表
CREATE TABLE form_templates (
    id UUID PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    form_schema JSONB,
    created_by UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- exams 表
ALTER TABLE exams ADD COLUMN form_template_id UUID REFERENCES form_templates(id);
```

## 前端修改

### 1. API Hooks

**文件：** `web/src/lib/api-hooks.ts`

**新增内容：**
- ✅ `FormTemplateStatus` 枚举（DRAFT, PUBLISHED, ARCHIVED）
- ✅ `FormFieldType` 枚举（TEXT, TEXTAREA, NUMBER, EMAIL, PHONE, DATE, SELECT, RADIO, CHECKBOX, FILE）
- ✅ `FormFieldSchema` - 表单字段 Zod schema
- ✅ `FormTemplateSchema` - 表单模板 Zod schema
- ✅ `CreateFormTemplateRequestSchema` - 创建请求 schema
- ✅ `UpdateFormTemplateRequestSchema` - 更新请求 schema

**新增 Query Hooks：**
- ✅ `useFormTemplate(templateId, tenantId)` - 获取单个表单模板
- ✅ `useFormTemplates(tenantId)` - 获取表单模板列表
- ✅ `useExamFormTemplate(examId, tenantId)` - 获取考试关联的表单模板

**新增 Mutation Hooks：**
- ✅ `useCreateFormTemplate()` - 创建表单模板
- ✅ `useUpdateFormTemplate()` - 更新表单模板
- ✅ `usePublishFormTemplate()` - 发布表单模板（DRAFT → PUBLISHED）
- ✅ `useAssignFormTemplateToExam()` - 将表单模板关联到考试

### 2. ExamApplicationForm 组件

**文件：** `web/src/components/admin/exam-detail/ExamApplicationForm.tsx`

**修改内容：**
- ✅ 使用 `useExamFormTemplate` 获取考试的表单模板
- ✅ 自动创建表单模板（如果考试没有关联表单模板）
- ✅ 显示表单模板状态徽章（草稿/已发布）
- ✅ 添加"发布表单"按钮（仅草稿状态显示）
- ✅ 添加发布确认对话框
- ✅ 已发布表单显示只读提示
- ✅ 实现 `handleSaveTemplate()` - 保存表单模板
- ✅ 实现 `handlePublish()` - 发布表单模板
- ✅ 实现 `convertToUITemplate()` - 将 API 格式转换为 UI 格式
- ✅ 实现 `mapFieldType()` - 字段类型映射

**功能特性：**
1. **自动创建：** 访问考试详情页面时，如果考试没有表单模板，自动创建一个草稿模板
2. **状态管理：** 显示表单模板状态（草稿/已发布），草稿可编辑，已发布只读
3. **发布流程：** 点击"发布表单"按钮 → 确认对话框 → 调用 API 发布 → 刷新数据
4. **只读模式：** 已发布的表单显示蓝色提示框，FormBuilder 进入只读模式

### 3. FormBuilder 组件

**文件：** `web/src/components/admin/form-builder/FormBuilder.tsx`

**修改内容：**
- ✅ 添加 `readOnly` 属性（默认 false）
- ✅ 只读模式下隐藏"撤销"、"重做"、"保存模板"按钮
- ✅ 只读模式下显示提示文字："只读模式 - 已发布的表单无法修改"
- ✅ 设计视图在只读模式下显示提示卡片，引导用户查看预览

## 工作流程

### 创建考试时的表单模板流程

1. 租户管理员创建考试
2. 访问考试详情页面 → "报名表单"标签页
3. 系统自动创建草稿表单模板（如果不存在）
4. 管理员使用表单设计器添加字段
5. 点击"保存模板"保存修改
6. 点击"发布表单"发布模板
7. 确认发布后，表单状态变为"已发布"
8. 考生可以看到并填写报名表单

### 表单模板状态转换

```
DRAFT (草稿)
  ↓ 点击"发布表单"
PUBLISHED (已发布) - 只读，考生可见
  ↓ 归档（未实现）
ARCHIVED (已归档) - 只读，不可用于新考试
```

## 测试建议

### 后端测试

1. **创建考试：** 验证自动创建表单模板
2. **关联表单模板：** 测试 `PUT /exams/{examId}/form-template/{templateId}`
3. **发布表单模板：** 测试 `POST /form-templates/{templateId}/publish`
4. **状态验证：** 已发布的表单模板不能修改字段
5. **考试状态限制：** CLOSED/IN_PROGRESS/COMPLETED 状态的考试不能修改表单模板

### 前端测试

1. **自动创建：** 访问新考试的"报名表单"标签页，验证自动创建
2. **编辑表单：** 添加字段、修改字段属性、保存模板
3. **发布流程：** 点击"发布表单" → 确认 → 验证状态变化
4. **只读模式：** 已发布表单无法编辑，显示只读提示
5. **租户隔离：** 验证所有 API 调用都传递了 `tenantId`

## 后续优化建议

1. **表单模板库：** 实现方案B，支持从模板库选择或复制模板
2. **版本管理：** 支持创建新版本（基于已发布模板）
3. **表单预填充：** 考生报名时，自动填充已有的个人信息
4. **条件显示：** 根据其他字段值动态显示/隐藏字段
5. **字段验证：** 更丰富的验证规则（正则表达式、自定义函数）
6. **表单分析：** 统计各字段的填写情况、常见错误等

