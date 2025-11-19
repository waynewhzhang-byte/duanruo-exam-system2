import { z } from 'zod'

// File info schema
export const FileInfo = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(),
  url: z.string().optional(),
})

export type FileInfo = z.infer<typeof FileInfo>

// Education level enum
export const EducationLevel = z.enum([
  'HIGH_SCHOOL',
  'ASSOCIATE',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
])

export type EducationLevel = z.infer<typeof EducationLevel>

// Work experience schema
export const WorkExperience = z.object({
  company: z.string().min(1, '公司名称不能为空'),
  position: z.string().min(1, '职位不能为空'),
  startDate: z.string().min(1, '开始时间不能为空'),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  description: z.string().optional(),
})

export type WorkExperience = z.infer<typeof WorkExperience>

// Education background schema
export const EducationBackground = z.object({
  school: z.string().min(1, '学校名称不能为空'),
  major: z.string().min(1, '专业不能为空'),
  level: EducationLevel,
  startDate: z.string().min(1, '开始时间不能为空'),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  gpa: z.string().optional(),
})

export type EducationBackground = z.infer<typeof EducationBackground>

// Application form schema
export const ApplicationForm = z.object({
  // Personal Information
  fullName: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  idNumber: z.string()
    .min(18, '身份证号码必须是18位')
    .max(18, '身份证号码必须是18位')
    .regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, '身份证号码格式不正确'),
  phone: z.string()
    .min(11, '手机号码必须是11位')
    .max(11, '手机号码必须是11位')
    .regex(/^1[3-9]\d{9}$/, '手机号码格式不正确'),
  email: z.string().email('邮箱格式不正确'),
  gender: z.enum(['MALE', 'FEMALE'], { message: '请选择性别' }),
  birthDate: z.string().min(1, '出生日期不能为空'),
  address: z.string().min(1, '地址不能为空').max(200, '地址最多200个字符'),
  
  // Emergency Contact
  emergencyContactName: z.string().min(1, '紧急联系人姓名不能为空'),
  emergencyContactPhone: z.string()
    .min(11, '紧急联系人手机号码必须是11位')
    .max(11, '紧急联系人手机号码必须是11位')
    .regex(/^1[3-9]\d{9}$/, '紧急联系人手机号码格式不正确'),
  emergencyContactRelation: z.string().min(1, '与紧急联系人关系不能为空'),
  
  // Education Background
  educationBackgrounds: z.array(EducationBackground).min(1, '至少需要填写一个教育背景'),
  
  // Work Experience
  workExperiences: z.array(WorkExperience).optional(),
  
  // File Attachments
  idCardFiles: z.array(FileInfo).min(1, '请上传身份证正反面照片'),
  educationCertificateFiles: z.array(FileInfo).min(1, '请上传学历证书'),
  workCertificateFiles: z.array(FileInfo).optional(),
  otherFiles: z.array(FileInfo).optional(),
  
  // Exam Selection
  examId: z.string().min(1, '请选择考试'),
  positionId: z.string().min(1, '请选择岗位'),
  
  // Additional Information
  specialNeeds: z.string().optional(),
  selfIntroduction: z.string().max(1000, '自我介绍最多1000个字符').optional(),
  
  // Agreements
  agreeToTerms: z.boolean().refine(val => val === true, '请同意服务条款'),
  agreeToPrivacy: z.boolean().refine(val => val === true, '请同意隐私政策'),
})

export type ApplicationForm = z.infer<typeof ApplicationForm>

// Education level labels
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  HIGH_SCHOOL: '高中',
  ASSOCIATE: '大专',
  BACHELOR: '本科',
  MASTER: '硕士',
  DOCTORATE: '博士',
}

// Gender labels
export const GENDER_LABELS = {
  MALE: '男',
  FEMALE: '女',
} as const
