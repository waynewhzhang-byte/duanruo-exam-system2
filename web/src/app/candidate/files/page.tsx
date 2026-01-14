'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import FileUpload from '@/components/ui/fileupload'
import { Button } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/loading'
import { FileText, Download, Trash2, Eye, Building } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  fileType: string
  category: string
}

interface Tenant {
  id: string
  name: string
  code: string
  slug?: string
}

// Mock data (will be replaced with real API data later)
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
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  // 获取用户关联的租户列表
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => {
      return apiGet<Tenant[]>('/tenants/me')
    },
  })

  // 自动选择第一个租户
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

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

  // 如果正在加载租户信息
  if (tenantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // 如果没有租户，显示提示
  if (!tenants || tenants.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的文件</h1>
          <p className="text-gray-600">管理您的证明材料和附件</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无关联租户</h3>
            <p className="text-sm text-muted-foreground mb-4">您需要先报名考试才能上传文件</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的文件</h1>
            <p className="text-gray-600">管理您的证明材料和附件</p>
          </div>
          {/* 租户选择器 */}
          <div className="flex items-center gap-2">
            {tenants.length > 1 ? (
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="w-48">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="选择考试机构" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                <Building className="h-4 w-4 mr-2" />
                {tenants[0]?.name}
              </div>
            )}
          </div>
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
              tenantId={selectedTenantId}
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
  )
}

