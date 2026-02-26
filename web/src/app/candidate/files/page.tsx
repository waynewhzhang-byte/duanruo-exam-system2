'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import FileUpload from '@/components/ui/fileupload'
import { Button } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/loading'
import { FileText, Download, Trash2, Eye, Building, X } from 'lucide-react'
import { useMyFiles, useDeleteFile } from '@/lib/api-hooks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiDelete } from '@/lib/api'
import { downloadFile } from '@/lib/helpers'

interface Tenant {
  id: string
  name: string
  code: string
  slug?: string
}

interface PreviewModalProps {
  fileId: string
  fileName: string
  fileType: string
  onClose: () => void
}

function PreviewModal({ fileId, fileName, fileType, onClose }: PreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      try {
        const response = await apiGet<{ previewUrl: string }>(`/files/${fileId}/preview-url`)
        setPreviewUrl(response.previewUrl)
      } catch (err) {
        setError('无法加载预览')
      } finally {
        setLoading(false)
      }
    }
    fetchPreviewUrl()
  }, [fileId])

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{fileName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {error && <div className="text-center py-8 text-red-500">{error}</div>}
          {!loading && !error && previewUrl && (
            <>
              {isImage && <img src={previewUrl} alt={fileName} className="max-w-full h-auto" />}
              {isPdf && <iframe src={previewUrl} className="w-full h-[70vh]" />}
              {!isImage && !isPdf && (
                <div className="text-center py-8">
                  <p className="mb-4">该文件类型不支持预览</p>
                  <Button onClick={() => downloadFile(previewUrl, fileName)}>下载文件</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FilesPage() {
  const queryClient = useQueryClient()
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type: string } | null>(null)

  const { data: filesData, isLoading: filesLoading, refetch } = useMyFiles()
  const files = filesData?.content || []

  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => {
      return apiGet<Tenant[]>('/tenants/me')
    },
  })

  const deleteFileMutation = useDeleteFile()

  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  const handleUploadComplete = (fileId: string, fileName: string) => {
    console.log('Upload completed:', fileId, fileName)
    refetch()
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await apiGet<{ downloadUrl: string }>(`/files/${fileId}/download-url`)
      downloadFile(response.downloadUrl, fileName)
    } catch (error) {
      console.error('Download failed:', error)
      alert('下载失败，请重试')
    }
  }

  const handlePreview = async (fileId: string, fileName: string, fileType: string) => {
    setPreviewFile({ id: fileId, name: fileName, type: fileType })
  }

  const handleDelete = async (fileId: string) => {
    if (confirm('确定要删除这个文件吗？')) {
      try {
        await deleteFileMutation.mutateAsync(fileId)
        alert('文件删除成功')
        refetch()
      } catch (error) {
        console.error('Delete failed:', error)
        alert('删除失败，请重试')
      }
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
    const category = file.fieldKey || '其他文件'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(file)
    return acc
  }, {} as Record<string, typeof files>)

  const isLoading = tenantsLoading || filesLoading

  if (isLoading) {
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
    <div>
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
                        key={file.fileId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getFileIcon(file.contentType)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {file.originalName}
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
                            onClick={() => handlePreview(file.fileId, file.originalName, file.contentType)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file.fileId, file.originalName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(file.fileId)}
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

      {previewFile && (
        <PreviewModal
          fileId={previewFile.id}
          fileName={previewFile.name}
          fileType={previewFile.type}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}

