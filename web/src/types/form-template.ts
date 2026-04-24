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
  key: z.string().optional(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  validation: z.array(ValidationRule).optional(),
  options: z.array(FieldOption).optional(),
  conditional: ConditionalLogic.optional(),
  fileConfig: FileUploadConfig.optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown())]).optional(),
  // 布局相关
  width: z.enum(['full', 'half', 'third', 'quarter']).default('full'),
  order: z.number().default(0),
})

export type FormField = z.infer<typeof FormField>
export type FormFieldInput = z.input<typeof FormField>

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
export type FormTemplateInput = z.input<typeof FormTemplate>

// 表单提交数据
export const FormSubmission = z.object({
  templateId: z.string(),
  examId: z.string(),
  candidateId: z.string(),
  data: z.record(z.string(), z.unknown()), // 动态字段数据
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
export type PresetFieldBase = Omit<FormFieldInput, 'id' | 'key' | 'order' | 'width'>
export type PresetField = PresetFieldBase & {
  id: string
  key: string
  order: number
  width?: FormFieldInput['width']
}

export const PRESET_FIELDS: Record<string, PresetFieldBase> = {
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
  // ========== 附件字段 ==========
  idCardFiles: {
    type: 'file-upload',
    name: 'idCardFiles',
    label: '身份证附件',
    helpText: '请上传身份证正反面照片，用于核验身份证号码',
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
  graduationCertFiles: {
    type: 'file-upload',
    name: 'graduationCertFiles',
    label: '毕业证附件',
    helpText: '请上传毕业证书照片或扫描件',
    required: true,
    fileConfig: {
      category: 'graduation',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 10,
      maxFiles: 2,
      required: true,
      description: '请上传毕业证书，确保证书编号清晰可见',
    },
  },
  degreeCertFiles: {
    type: 'file-upload',
    name: 'degreeCertFiles',
    label: '学位证附件',
    helpText: '请上传学位证书照片或扫描件（如有）',
    required: false,
    fileConfig: {
      category: 'degree',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 10,
      maxFiles: 2,
      required: false,
      description: '请上传学位证书，确保证书编号清晰可见',
    },
  },
  educationCertificateFiles: {
    type: 'file-upload',
    name: 'educationCertificateFiles',
    label: '学历证明附件',
    helpText: '请上传学历认证报告或学信网截图',
    required: false,
    fileConfig: {
      category: 'education',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 10,
      maxFiles: 3,
      required: false,
      description: '请上传学历认证报告、学信网截图等学历证明材料',
    },
  },
  photoFiles: {
    type: 'file-upload',
    name: 'photoFiles',
    label: '个人照片',
    helpText: '请上传近期免冠白底证件照',
    required: true,
    fileConfig: {
      category: 'photo',
      accept: '.jpg,.jpeg,.png',
      maxSize: 2,
      maxFiles: 1,
      required: true,
      description: '请上传近期免冠白底证件照，用于准考证打印',
    },
  },
  workCertFiles: {
    type: 'file-upload',
    name: 'workCertFiles',
    label: '工作证明附件',
    helpText: '请上传在职证明或劳动合同（如需要工作经验）',
    required: false,
    fileConfig: {
      category: 'work',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 10,
      maxFiles: 3,
      required: false,
      description: '请上传在职证明、劳动合同等工作证明材料',
    },
  },
  otherCertFiles: {
    type: 'file-upload',
    name: 'otherCertFiles',
    label: '其他证明材料',
    helpText: '请上传职业资格证书、荣誉证书等其他证明材料',
    required: false,
    fileConfig: {
      category: 'other',
      accept: '.jpg,.jpeg,.png,.pdf,.doc,.docx',
      maxSize: 10,
      maxFiles: 5,
      required: false,
      description: '请上传职业资格证书、荣誉证书等其他证明材料',
    },
  },
  // ========== 教育背景字段 ==========
  highestEducation: {
    type: 'select',
    name: 'highestEducation',
    label: '最高学历',
    required: true,
    options: [
      { label: '博士研究生', value: 'DOCTORATE' },
      { label: '硕士研究生', value: 'MASTER' },
      { label: '本科', value: 'BACHELOR' },
      { label: '大专', value: 'ASSOCIATE' },
      { label: '高中/中专', value: 'HIGH_SCHOOL' },
      { label: '其他', value: 'OTHER' },
    ],
  },
  graduationSchool: {
    type: 'text',
    name: 'graduationSchool',
    label: '毕业院校',
    required: true,
    placeholder: '请输入您的毕业院校全称',
    validation: [
      { type: 'required', message: '毕业院校不能为空' },
      { type: 'max', value: 100, message: '毕业院校名称最多100个字符' },
    ],
  },
  major: {
    type: 'text',
    name: 'major',
    label: '所学专业',
    required: true,
    placeholder: '请输入您的专业名称',
    validation: [
      { type: 'required', message: '专业不能为空' },
      { type: 'max', value: 50, message: '专业名称最多50个字符' },
    ],
  },
  graduationDate: {
    type: 'date',
    name: 'graduationDate',
    label: '毕业时间',
    required: true,
  },
  // ========== 协议确认 ==========
  agreeToTerms: {
    type: 'agreement',
    name: 'agreeToTerms',
    label: '我已阅读并同意《服务条款》',
    required: true,
  },
  agreeToPrivacy: {
    type: 'agreement',
    name: 'agreeToPrivacy',
    label: '我已阅读并同意《隐私政策》',
    required: true,
  },
  confirmInfoAccuracy: {
    type: 'agreement',
    name: 'confirmInfoAccuracy',
    label: '我确认以上填写的信息真实有效，如有虚假愿承担相应责任',
    required: true,
  },
}
