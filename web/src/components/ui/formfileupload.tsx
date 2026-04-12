'use client'

import { useState, useCallback, useContext } from 'react'
import { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form'
import { Upload, X, File, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react'
import { apiPostWithTenant, apiGetWithTenant } from '@/lib/api'
import { FormField, FormItem, FormLabel, FormMessage } from './form'
import { TenantContext } from '@/contexts/TenantContext'
import Image from 'next/image'

interface FileInfo {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  url?: string
}

interface FormFileUploadProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description?: string
  accept?: string
  maxSize?: number // in MB
  multiple?: boolean
  required?: boolean
  category?: string
  className?: string
  tenantId?: string // Optional: if provided, use this instead of context
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  fileId?: string
}

export default function FormFileUpload<T extends FieldValues>({
  form,
  name,
  label,
  description,
  accept = '*/*',
  maxSize = 10,
  multiple = false,
  required = false,
  category,
  className = '',
  tenantId: propTenantId,
}: FormFileUploadProps<T>) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string>('')

  // Try to get tenant from context, fallback to prop
  const tenantContext = useContext(TenantContext)
  const effectiveTenantId = propTenantId || tenantContext?.tenant?.id

  const uploadFile = useCallback(async (file: File, uploadId: string) => {
    try {
      // Validate tenant context
      if (!effectiveTenantId) {
        throw new Error('租户信息缺失，无法上传文件')
      }

      // Step 1: Get upload URL
      setUploadingFiles(prev => prev.map(f =>
        f.id === uploadId ? { ...f, progress: 10 } : f
      ))

      const uploadUrlResponse = await apiPostWithTenant<{ uploadUrl: string; fileId: string }>(
        '/files/upload-url',
        effectiveTenantId,
        {
          fileName: file.name,
          contentType: file.type,
          fieldKey: category || name || 'general',
        }
      )

      setUploadingFiles(prev => prev.map(f =>
        f.id === uploadId ? { ...f, progress: 30, fileId: uploadUrlResponse.fileId } : f
      ))

      // Step 2: Upload to MinIO
      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败')
      }

      setUploadingFiles(prev => prev.map(f =>
        f.id === uploadId ? { ...f, progress: 80 } : f
      ))

      // Step 3: Confirm upload
      await apiPostWithTenant(`/files/${uploadUrlResponse.fileId}/confirm`, effectiveTenantId, {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      })

      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId ? { ...f, progress: 100, status: 'success' } : f
      ))

      // Update form field value
      const newFile: FileInfo = {
        id: uploadUrlResponse.fileId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      }

      const currentValue = form.getValues(name) || []
      const newValue = multiple ? [...currentValue, newFile] : [newFile]
      form.setValue(name, newValue as any)
      form.trigger(name)

      // Remove from uploading list after 2 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
      }, 2000)

    } catch (error: any) {
      const errorMessage = error.message || '上传失败'
      setUploadingFiles(prev => prev.map(f =>
        f.id === uploadId ? { ...f, status: 'error', error: errorMessage } : f
      ))
    }
  }, [form, name, multiple, category, effectiveTenantId])

  const handleFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        return false
      }
      return true
    })

    if (validFiles.length !== fileArray.length) {
      // Show error for oversized files
      const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024)
      console.error(`文件 ${oversizedFiles.map(f => f.name).join(', ')} 大小超过 ${maxSize}MB`)
    }

    // Add to uploading list
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading',
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Start uploads
    newUploadingFiles.forEach(uploadingFile => {
      uploadFile(uploadingFile.file, uploadingFile.id)
    })
  }, [maxSize, uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    e.target.value = ''
  }, [handleFiles])

  const removeFile = useCallback((fileId: string) => {
    const currentValue = form.getValues(name) || []
    const newValue = currentValue.filter((file: FileInfo) => file.id !== fileId)
    form.setValue(name, newValue as any)
    form.trigger(name)
  }, [form, name])

  const removeUploadingFile = useCallback((uploadId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePreview = async (fileId: string, fileName: string) => {
    if (!effectiveTenantId) return
    try {
      const resp = await apiGetWithTenant<{ url: string }>(
        `/files/${fileId}/download-url`,
        effectiveTenantId,
      )
      setPreviewFileName(fileName)
      setPreviewUrl(resp.url)
    } catch {
      // ignore
    }
  }

  const handleDownload = async (fileId: string) => {
    if (!effectiveTenantId) return
    try {
      const resp = await apiGetWithTenant<{ url: string }>(
        `/files/${fileId}/download-url`,
        effectiveTenantId,
      )
      window.open(resp.url, '_blank')
    } catch {
      // ignore
    }
  }

  return (
    <>
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const files = (field.value || []) as FileInfo[]

        return (
          <FormItem className={className}>
            <FormLabel>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>

            {description && (
              <p className="text-sm text-gray-500 mb-2">{description}</p>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragOver
                  ? 'border-primary-500 bg-primary-50'
                  : fieldState.error
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div>
                <label className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-500 font-medium">
                    点击上传文件
                  </span>
                  <span className="text-gray-500"> 或拖拽文件到此处</span>
                  <input
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                支持格式：{accept === '*/*' ? '所有格式' : accept} | 最大 {maxSize}MB
                {multiple && ' | 支持多文件'}
              </p>
            </div>

            {/* Uploaded Files */}
            {files.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium text-gray-700">已上传文件：</p>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handlePreview(file.id, file.fileName)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="预览"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="下载"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="删除"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium text-gray-700">上传中：</p>
                {uploadingFiles.map((uploadingFile) => (
                  <div
                    key={uploadingFile.id}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {uploadingFile.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : uploadingFile.status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <File className="h-5 w-5 text-blue-500" />
                      )}

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>

                        {uploadingFile.status === 'uploading' && (
                          <div className="mt-1">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadingFile.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {uploadingFile.status === 'error' && uploadingFile.error && (
                          <p className="text-xs text-red-600 mt-1">{uploadingFile.error}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeUploadingFile(uploadingFile.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FormMessage />
          </FormItem>
        )
      }}
    />

    {/* File preview modal */}
    {previewUrl && (
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
        onClick={() => setPreviewUrl(null)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreviewUrl(null); } }}
        aria-label="关闭预览"
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col"
          style={{ height: '90vh' }}
          onClick={(e) => e.stopPropagation()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
          aria-label="预览内容"
        >
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <span className="font-medium text-gray-900 truncate max-w-xs">{previewFileName}</span>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(previewFileName) ? (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={previewUrl ?? ''}
                  alt={previewFileName}
                  className="max-w-full max-h-full object-contain"
                  fill
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <iframe
              src={previewUrl ?? ''}
              className="flex-1 w-full border-0"
              title={previewFileName}
            />
          )}
        </div>
      </div>
    )}
  </>
  )
}
