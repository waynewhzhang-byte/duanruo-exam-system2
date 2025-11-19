'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FileUpload from '@/components/ui/fileupload'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/loading'
import { Upload, File, Download, Eye, Trash2, CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react'

interface FileItem {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  category: 'identity' | 'education' | 'work' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  url?: string
  reviewComment?: string
}

interface FileRequirement {
  category: 'identity' | 'education' | 'work' | 'other'
  label: string
  description: string
  required: boolean
  maxFiles: number
  acceptedFormats: string[]
  examples: string[]
}

// File requirements configuration
const fileRequirements: FileRequirement[] = [
  {
    category: 'identity',
    label: '身份证明',
    description: '请上传身份证正反面照片，确保信息清晰可见',
    required: true,
    maxFiles: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png'],
    examples: ['身份证正面.jpg', '身份证反面.jpg'],
  },
  {
    category: 'education',
    label: '学历证明',
    description: '请上传最高学历的毕业证书或学位证书',
    required: true,
    maxFiles: 3,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf'],
    examples: ['毕业证书.pdf', '学位证书.pdf', '成绩单.pdf'],
  },
  {
    category: 'work',
    label: '工作证明',
    description: '请上传工作证明、劳动合同或在职证明',
    required: false,
    maxFiles: 5,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
    examples: ['工作证明.pdf', '劳动合同.pdf', '在职证明.pdf'],
  },
  {
    category: 'other',
    label: '其他材料',
    description: '其他相关证明材料',
    required: false,
    maxFiles: 10,
    acceptedFormats: ['*/*'],
    examples: ['获奖证书.pdf', '技能证书.pdf', '推荐信.pdf'],
  },
]

// Mock data
const mockFiles: FileItem[] = [
  {
    id: '1',
    fileName: '身份证正面.jpg',
    fileSize: 2048576,
    uploadedAt: '2024-01-15 14:30:00',
    category: 'identity',
    status: 'approved',
  },
  {
    id: '2',
    fileName: '身份证反面.jpg',
    fileSize: 1987654,
    uploadedAt: '2024-01-15 14:31:00',
    category: 'identity',
    status: 'approved',
  },
  {
    id: '3',
    fileName: '毕业证书.pdf',
    fileSize: 5432109,
    uploadedAt: '2024-01-15 14:35:00',
    category: 'education',
    status: 'pending',
  },
  {
    id: '4',
    fileName: '工作证明.pdf',
    fileSize: 3210987,
    uploadedAt: '2024-01-15 14:40:00',
    category: 'work',
    status: 'rejected',
    reviewComment: '文件不清晰，请重新上传',
  },
]

const statusLabels = {
  pending: '待审核',
  approved: '已通过',
  rejected: '被拒绝',
}

export default function EnhancedFilesPage() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<string>('identity')

  const handleUploadComplete = (fileId: string, fileName: string) => {
    console.log('Upload completed:', fileId, fileName)
    // TODO: Add uploaded files to the list
    setShowUploadModal(false)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    alert('上传失败: ' + error)
  }

  const handleDownload = (fileId: string) => {
    console.log('Download file:', fileId)
    // TODO: Implement file download
  }

  const handlePreview = (fileId: string) => {
    console.log('Preview file:', fileId)
    // TODO: Implement file preview
  }

  const handleDelete = (fileId: string) => {
    if (confirm('确定要删除这个文件吗？')) {
      setFiles(prev => prev.filter(file => file.id !== fileId))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: FileItem['status']) => {
    const variants = {
      approved: 'success' as const,
      rejected: 'danger' as const,
      pending: 'warning' as const,
    }
    return (
      <Badge variant={variants[status] as any}>
        {statusLabels[status]}
      </Badge>
    )
  }

  const getRequirementStatus = (requirement: FileRequirement) => {
    const categoryFiles = files.filter(file => file.category === requirement.category)
    const approvedFiles = categoryFiles.filter(file => file.status === 'approved')
    
    if (requirement.required && approvedFiles.length === 0) {
      return { status: 'missing', message: '缺少必需文件' }
    }
    if (approvedFiles.length >= requirement.maxFiles) {
      return { status: 'complete', message: '已完成' }
    }
    if (categoryFiles.length > 0) {
      return { status: 'partial', message: `${approvedFiles.length}/${requirement.maxFiles} 已通过` }
    }
    return { status: 'empty', message: '未上传' }
  }

  const filteredFiles = selectedCategory === 'all' 
    ? files 
    : files.filter(file => file.category === selectedCategory)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">文件管理增强版</h1>
            <p className="text-gray-600">管理您的报名相关文件，支持分类和状态跟踪</p>
          </div>
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            上传文件
          </Button>
        </div>

        {/* File Requirements Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fileRequirements.map((requirement) => {
            const categoryFiles = files.filter(file => file.category === requirement.category)
            const approvedFiles = categoryFiles.filter(file => file.status === 'approved')
            const requirementStatus = getRequirementStatus(requirement)
            
            return (
              <Card key={requirement.category} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{requirement.label}</h3>
                        {requirement.required && (
                          <Badge variant="destructive" className="text-xs">必需</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{requirement.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">已上传</span>
                      <span className="text-sm font-medium">
                        {approvedFiles.length}/{requirement.maxFiles}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          requirementStatus.status === 'complete' ? 'bg-green-500' :
                          requirementStatus.status === 'partial' ? 'bg-yellow-500' :
                          requirementStatus.status === 'missing' ? 'bg-red-500' :
                          'bg-gray-300'
                        }`}
                        style={{
                          width: `${Math.min((approvedFiles.length / requirement.maxFiles) * 100, 100)}%`
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${
                        requirementStatus.status === 'complete' ? 'text-green-600' :
                        requirementStatus.status === 'partial' ? 'text-yellow-600' :
                        requirementStatus.status === 'missing' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {requirementStatus.message}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUploadCategory(requirement.category)
                          setShowUploadModal(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">上传文件</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择文件类型
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                >
                  {fileRequirements.map((req) => (
                    <option key={req.category} value={req.category}>
                      {req.label} {req.required && '(必需)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {uploadCategory && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const requirement = fileRequirements.find(r => r.category === uploadCategory)
                    if (!requirement) return null
                    
                    return (
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">{requirement.label} - 上传要求</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• {requirement.description}</li>
                          <li>• 最多上传 {requirement.maxFiles} 个文件</li>
                          <li>• 支持格式：{requirement.acceptedFormats.join(', ')}</li>
                          <li>• 示例文件：{requirement.examples.join(', ')}</li>
                        </ul>
                      </div>
                    )
                  })()}
                </div>
              )}
              
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                accept={fileRequirements.find(r => r.category === uploadCategory)?.acceptedFormats.join(',') || '*/*'}
                maxSize={10}
                multiple={true}
              />
            </div>
          </div>
        )}

        {/* File List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>文件列表</CardTitle>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="all">全部分类</option>
                  {fileRequirements.map((req) => (
                    <option key={req.category} value={req.category}>{req.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredFiles.length === 0 ? (
              <EmptyState
                icon={<File className="h-12 w-12" />}
                title="暂无文件"
                description="请上传相关文件"
              />
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <File className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.fileName}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>{fileRequirements.find(r => r.category === file.category)?.label}</span>
                            <span>{file.uploadedAt}</span>
                          </div>
                          {file.reviewComment && (
                            <p className="text-sm text-red-600 mt-1">
                              审核意见：{file.reviewComment}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(file.status)}
                        
                        <div className="flex items-center space-x-1">
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

