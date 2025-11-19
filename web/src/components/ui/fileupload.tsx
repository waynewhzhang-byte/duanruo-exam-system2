'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react'
import { apiPost } from '@/lib/api'

interface FileUploadProps {
  onUploadComplete?: (fileId: string, fileName: string) => void
  onUploadError?: (error: string) => void
  accept?: string
  maxSize?: number // in MB
  multiple?: boolean
  className?: string
  fieldKey?: string // 表单字段键，用于后端关联
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  fileId?: string
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = '*/*',
  maxSize = 10,
  multiple = false,
  className = '',
  fieldKey = 'general',
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File, uploadId: string) => {
    try {
      // Step 1: Get upload URL
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId ? { ...f, progress: 10 } : f
      ))

      const uploadUrlResponse = await apiPost<{ url: string; fileId: string }>('/files/upload-url', {
        fileName: file.name,
        contentType: file.type,
        fieldKey: fieldKey,
      })

      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId ? { ...f, progress: 30, fileId: uploadUrlResponse.fileId } : f
      ))

      // Step 2: Upload to MinIO
      const uploadResponse = await fetch(uploadUrlResponse.url, {
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
      await apiPost(`/files/${uploadUrlResponse.fileId}/confirm`, {})

      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId ? { ...f, progress: 100, status: 'success' } : f
      ))

      onUploadComplete?.(uploadUrlResponse.fileId, file.name)

      // Remove from list after 2 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
      }, 2000)

    } catch (error: any) {
      const errorMessage = error.message || '上传失败'
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId ? { ...f, status: 'error', error: errorMessage } : f
      ))
      onUploadError?.(errorMessage)
    }
  }, [onUploadComplete, onUploadError, fieldKey])

  const handleFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        onUploadError?.(` ${file.name} 文件大小超过 ${maxSize}MB`)
        return false
      }
      return true
    })

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
  }, [maxSize, onUploadError, uploadFile])

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = useCallback((uploadId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <button
            type="button"
            className="text-primary-600 hover:text-primary-500 font-medium"
            onClick={() => fileInputRef.current?.click()}
          >
            点击上传文件
          </button>
          <span className="text-gray-500"> 或拖拽文件到此处</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          支持格式：{accept === '*/*' ? '所有格式' : accept} | 最大 {maxSize}MB
          {multiple && ' | 支持多文件'}
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
      />

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                {uploadingFile.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : uploadingFile.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <File className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <button
                    onClick={() => removeFile(uploadingFile.id)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                
                {uploadingFile.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {uploadingFile.status === 'error' && uploadingFile.error && (
                  <p className="text-xs text-red-600 mt-1">{uploadingFile.error}</p>
                )}
                
                {uploadingFile.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">上传成功</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
