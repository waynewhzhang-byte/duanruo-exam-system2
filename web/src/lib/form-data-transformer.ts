/**
 * 表单数据转换工具
 * 将前端动态表单数据转换为后端API期望的格式
 */

export interface FileInfo {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

export interface AttachmentRef {
  fileId: string
  fieldKey: string
}

export interface ApplicationSubmitRequest {
  examId: string
  positionId: string
  formVersion?: number
  payload: Record<string, any>
  attachments: AttachmentRef[]
}

/**
 * 识别文件字段的模式
 * 通常以 "Files" 结尾或包含 "file", "attachment", "upload" 等关键词
 */
const FILE_FIELD_PATTERNS = [
  /.*Files?$/i,           // xxxFiles, xxxFile
  /.*Attachments?$/i,     // xxxAttachments, xxxAttachment  
  /.*Uploads?$/i,         // xxxUploads, xxxUpload
  /.*Documents?$/i,       // xxxDocuments, xxxDocument
  /.*证明$/,              // xxx证明
  /.*证书$/,              // xxx证书
  /.*照片$/,              // xxx照片
  /.*图片$/,              // xxx图片
]

/**
 * 判断字段是否为文件字段
 */
function isFileField(fieldName: string, value: any): boolean {
  // 检查字段名模式
  const matchesPattern = FILE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName))
  
  // 检查值的结构是否像文件数组
  const isFileArray = Array.isArray(value) && 
    value.length > 0 && 
    value.every(item => 
      typeof item === 'object' && 
      item !== null &&
      'id' in item && 
      'fileName' in item
    )
  
  return matchesPattern || isFileArray
}

/**
 * 提取文件字段并转换为 AttachmentRef 数组
 */
function extractFileAttachments(formData: Record<string, any>): {
  attachments: AttachmentRef[]
  cleanedPayload: Record<string, any>
} {
  const attachments: AttachmentRef[] = []
  const cleanedPayload: Record<string, any> = {}

  for (const [fieldName, value] of Object.entries(formData)) {
    if (isFileField(fieldName, value)) {
      // 这是文件字段，转换为 AttachmentRef
      if (Array.isArray(value)) {
        value.forEach((fileInfo: FileInfo) => {
          if (fileInfo && fileInfo.id) {
            attachments.push({
              fileId: fileInfo.id,
              fieldKey: fieldName
            })
          }
        })
      }
      // 不将文件字段添加到 payload 中
    } else {
      // 非文件字段，添加到 payload 中
      cleanedPayload[fieldName] = value
    }
  }

  return { attachments, cleanedPayload }
}

/**
 * 转换表单数据为后端API格式
 */
export function transformFormDataForSubmission(
  formData: Record<string, any>,
  examId: string,
  positionId: string,
  formVersion: number = 1
): ApplicationSubmitRequest {
  // 提取文件附件和清理payload
  const { attachments, cleanedPayload } = extractFileAttachments(formData)

  // 移除空值和undefined值
  const payload = Object.fromEntries(
    Object.entries(cleanedPayload).filter(([_, value]) => 
      value !== null && value !== undefined && value !== ''
    )
  )

  return {
    examId,
    positionId,
    formVersion,
    payload,
    attachments
  }
}

/**
 * 验证必需的文件附件
 */
export function validateRequiredAttachments(
  formData: Record<string, any>,
  requiredFileFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []

  for (const fieldName of requiredFileFields) {
    const value = formData[fieldName]
    
    if (!value || !Array.isArray(value) || value.length === 0) {
      missingFields.push(fieldName)
    } else {
      // 检查是否有有效的文件ID
      const hasValidFiles = value.some((fileInfo: any) => 
        fileInfo && fileInfo.id && typeof fileInfo.id === 'string'
      )
      
      if (!hasValidFiles) {
        missingFields.push(fieldName)
      }
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

/**
 * 获取表单中的所有文件字段名
 */
export function getFileFieldNames(formData: Record<string, any>): string[] {
  return Object.keys(formData).filter(fieldName => 
    isFileField(fieldName, formData[fieldName])
  )
}

/**
 * 调试工具：打印表单数据转换结果
 */
export function debugFormDataTransformation(
  formData: Record<string, any>,
  examId: string,
  positionId: string
) {
  console.group('🔄 表单数据转换调试')
  
  console.log('📝 原始表单数据:', formData)
  
  const fileFields = getFileFieldNames(formData)
  console.log('📎 识别的文件字段:', fileFields)
  
  const { attachments, cleanedPayload } = extractFileAttachments(formData)
  console.log('📋 清理后的payload:', cleanedPayload)
  console.log('📁 文件附件:', attachments)
  
  const result = transformFormDataForSubmission(formData, examId, positionId)
  console.log('🎯 最终提交数据:', result)
  
  console.groupEnd()
  
  return result
}

/**
 * 字段名映射配置
 * 用于处理前端字段名与后端期望字段名不一致的情况
 */
export const FIELD_NAME_MAPPING: Record<string, string> = {
  // 前端字段名 -> 后端字段名
  'idCardFiles': 'identity_documents',
  'educationCertificateFiles': 'education_certificates', 
  'workCertificateFiles': 'work_certificates',
  'otherFiles': 'other_documents',
}

/**
 * 应用字段名映射
 */
export function applyFieldNameMapping(
  data: Record<string, any>,
  mapping: Record<string, string> = FIELD_NAME_MAPPING
): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = mapping[key] || key
    result[mappedKey] = value
  }
  
  return result
}
