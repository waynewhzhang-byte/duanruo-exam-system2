import { z } from 'zod'

// 字段类型枚举
export const FieldType = z.enum([
  'text',
  'email', 
  'phone',
  'number',
  'date',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'multi-select',
  'file-upload',
  'education-background',
  'work-experience',
  'agreement',
])

export type FieldType = z.infer<typeof FieldType>

// 验证规则
export const ValidationRule = z.object({
  type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
  value: z.union([z.string(), z.number()]).optional(),
  message: z.string(),
})

export type ValidationRule = z.infer<typeof ValidationRule>

// 条件逻辑
export const ConditionalLogic = z.object({
  field: z.string(), // 依赖的字段名
  operator: z.enum(['equals', 'not-equals', 'contains', 'not-contains', 'greater-than', 'less-than']),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export type ConditionalLogic = z.infer<typeof ConditionalLogic>

// 字段选项
export const FieldOption = z.object({
  label: z.string(),
  value: z.string(),
  disabled: z.boolean().optional(),
})

export type FieldOption = z.infer<typeof FieldOption>

// 文件上传配置
export const FileUploadConfig = z.object({
  category: z.string(),
  accept: z.string(),
  maxSize: z.number(), // MB
  maxFiles: z.number(),
  required: z.boolean(),
  description: z.string().optional(),
})

export type FileUploadConfig = z.infer<typeof FileUploadConfig>

// 表单字段定义
export const FormField = z.object({
  id: z.string(),
  type: FieldType,
  name: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  validation: z.array(ValidationRule).optional(),
  options: z.array(FieldOption).optional(),
  conditional: ConditionalLogic.optional(),
  fileConfig: FileUploadConfig.optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
  // 布局相关
  width: z.enum(['full', 'half', 'third', 'quarter']).default('full'),
  order: z.number().default(0),
})

export type FormField = z.infer<typeof FormField>

// 表单分组/节
export const FormSection = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormField),
  conditional: ConditionalLogic.optional(),
  collapsible: z.boolean().default(false),
  collapsed: z.boolean().default(false),
  order: z.number().default(0),
})

export type FormSection = z.infer<typeof FormSection>

// 文件要求配置
export const FileRequirement = z.object({
  category: z.string(),
  label: z.string(),
  description: z.string(),
  required: z.boolean(),
  maxFiles: z.number(),
  acceptedFormats: z.array(z.string()),
  examples: z.array(z.string()),
})

export type FileRequirement = z.infer<typeof FileRequirement>

// 表单模板
export const FormTemplate = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  category: z.string(), // 模板分类：basic, advanced, custom
  tags: z.array(z.string()).optional(),
  sections: z.array(FormSection),
  fileRequirements: z.array(FileRequirement),
  // 元数据
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  isActive: z.boolean().default(true),
  // 配置选项
  allowSaveDraft: z.boolean().default(true),
  allowMultipleSubmissions: z.boolean().default(false),
  submitButtonText: z.string().default('提交报名'),
  successMessage: z.string().optional(),
})

export type FormTemplate = z.infer<typeof FormTemplate>

// 表单提交数据
export const FormSubmission = z.object({
  templateId: z.string(),
  examId: z.string(),
  candidateId: z.string(),
  data: z.record(z.string(), z.any()), // 动态字段数据
  files: z.record(z.string(), z.array(z.string())), // 文件ID映射
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']),
  submittedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
  reviewComment: z.string().optional(),
})

export type FormSubmission = z.infer<typeof FormSubmission>

// 字段类型标签
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  'text': '单行文本',
  'email': '邮箱',
  'phone': '手机号',
  'number': '数字',
  'date': '日期',
  'textarea': '多行文本',
  'select': '下拉选择',
  'radio': '单选按钮',
  'checkbox': '复选框',
  'multi-select': '多选下拉',
  'file-upload': '文件上传',
  'education-background': '教育背景',
  'work-experience': '工作经历',
  'agreement': '协议确认',
}

// 验证规则类型标签
export const VALIDATION_TYPE_LABELS: Record<string, string> = {
  'required': '必填',
  'min': '最小值/长度',
  'max': '最大值/长度',
  'pattern': '正则表达式',
  'custom': '自定义验证',
}

// 条件操作符标签
export const CONDITIONAL_OPERATOR_LABELS: Record<string, string> = {
  'equals': '等于',
  'not-equals': '不等于',
  'contains': '包含',
  'not-contains': '不包含',
  'greater-than': '大于',
  'less-than': '小于',
}

// 预设字段模板
export const PRESET_FIELDS: Record<string, any> = {
  fullName: {
    type: 'text',
    name: 'fullName',
    label: '姓名',
    required: true,
    validation: [
      { type: 'required', message: '姓名不能为空' },
      { type: 'min', value: 2, message: '姓名至少2个字符' },
      { type: 'max', value: 50, message: '姓名最多50个字符' },
    ],
  },
  idNumber: {
    type: 'text',
    name: 'idNumber',
    label: '身份证号码',
    required: true,
    validation: [
      { type: 'required', message: '身份证号码不能为空' },
      { type: 'pattern', value: '^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$', message: '身份证号码格式不正确' },
    ],
  },
  phone: {
    type: 'phone',
    name: 'phone',
    label: '手机号码',
    required: true,
    validation: [
      { type: 'required', message: '手机号码不能为空' },
      { type: 'pattern', value: '^1[3-9]\\d{9}$', message: '手机号码格式不正确' },
    ],
  },
  email: {
    type: 'email',
    name: 'email',
    label: '邮箱地址',
    required: true,
    validation: [
      { type: 'required', message: '邮箱地址不能为空' },
    ],
  },
  gender: {
    type: 'radio',
    name: 'gender',
    label: '性别',
    required: true,
    options: [
      { label: '男', value: 'MALE' },
      { label: '女', value: 'FEMALE' },
    ],
  },
  birthDate: {
    type: 'date',
    name: 'birthDate',
    label: '出生日期',
    required: true,
  },
  address: {
    type: 'textarea',
    name: 'address',
    label: '地址',
    required: true,
    validation: [
      { type: 'required', message: '地址不能为空' },
      { type: 'max', value: 200, message: '地址最多200个字符' },
    ],
  },
  idCardFiles: {
    type: 'file-upload',
    name: 'idCardFiles',
    label: '身份证照片',
    required: true,
    fileConfig: {
      category: 'identity',
      accept: '.jpg,.jpeg,.png',
      maxSize: 5,
      maxFiles: 2,
      required: true,
      description: '请上传身份证正反面照片，确保信息清晰可见',
    },
  },
  educationCertificateFiles: {
    type: 'file-upload',
    name: 'educationCertificateFiles',
    label: '学历证书',
    required: true,
    fileConfig: {
      category: 'education',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 10,
      maxFiles: 3,
      required: true,
      description: '请上传最高学历的毕业证书或学位证书',
    },
  },
  agreeToTerms: {
    type: 'agreement',
    name: 'agreeToTerms',
    label: '我已阅读并同意《服务条款》',
    required: true,
  },
}
