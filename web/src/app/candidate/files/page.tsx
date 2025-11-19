'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import FileUpload from '@/components/ui/fileupload'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/loading'
import { FileText, Download, Trash2, Eye } from 'lucide-react'

interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  fileType: string
  category: string
}

// Mock data
const mockFiles: UploadedFile[] = [
  {
    id: '1',
    fileName: '身份证正面.jpg',
    fileSize: 2048576, // 2MB
    uploadedAt: '2024-01-15 14:30:00',
    fileType: 'image/jpeg',
    category: '身份证明',
  },
  {
    id: '2',
    fileName: '学历证书.pdf',
    fileSize: 5242880, // 5MB
    uploadedAt: '2024-01-15 14:32:00',
    fileType: 'application/pdf',
    category: '学历证明',
  },
  {
    id: '3',
    fileName: '工作证明.pdf',
    fileSize: 1048576, // 1MB
    uploadedAt: '2024-01-15 14:35:00',
    fileType: 'application/pdf',
    category: '工作经历',
  },
]

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>(mockFiles)

  const handleUploadComplete = (fileId: string, fileName: string) => {
    console.log('Upload completed:', fileId, fileName)
    // In real app, refresh the files list
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // Show error toast
  }

  const handleDownload = (fileId: string) => {
    console.log('Download file:', fileId)
    // In real app, call download API
  }

  const handlePreview = (fileId: string) => {
    console.log('Preview file:', fileId)
    // In real app, open preview modal
  }

  const handleDelete = (fileId: string) => {
    if (confirm('确定要删除这个文件吗？')) {
      setFiles(prev => prev.filter(f => f.id !== fileId))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️'
    } else if (fileType === 'application/pdf') {
      return '📄'
    } else if (fileType.includes('word')) {
      return '📝'
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return '📊'
    }
    return '📁'
  }

  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.category]) {
      acc[file.category] = []
    }
    acc[file.category].push(file)
    return acc
  }, {} as Record<string, UploadedFile[]>)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的文件</h1>
          <p className="text-gray-600">管理您的证明材料和附件</p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>上传文件</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSize={10}
              multiple={true}
            />
            <div className="mt-4 text-sm text-gray-500">
              <p>支持的文件类型：PDF、JPG、PNG、DOC、DOCX</p>
              <p>单个文件最大 10MB，支持批量上传</p>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {Object.keys(groupedFiles).length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="暂无文件"
                description="您还没有上传任何文件，请先上传您的证明材料"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getFileIcon(file.fileType)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {file.fileName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.fileSize)} • 上传于 {file.uploadedAt}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(file.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(file.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle>使用提示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 请确保上传的文件清晰可读，避免模糊或缺失信息</p>
              <p>• 身份证明文件需要正反面都上传</p>
              <p>• 学历证书请上传最高学历的毕业证书</p>
              <p>• 工作证明需要包含公司盖章和联系方式</p>
              <p>• 如需修改文件，请先删除原文件再重新上传</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

