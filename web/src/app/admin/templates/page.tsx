'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FORM_TEMPLATES, getTemplatesByCategory } from '@/data/form-templates'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Settings, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Plus,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react'

export default function TemplateManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const categories = [
    { value: 'all', label: '全部模板' },
    { value: 'basic', label: '基础模板' },
    { value: 'advanced', label: '高级模板' },
    { value: 'custom', label: '自定义模板' },
  ]

  const filteredTemplates = FORM_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handlePreviewTemplate = (template: any) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleCloneTemplate = (template: any) => {
    console.log('Clone template:', template.id)
    alert(`克隆模板: ${template.name}`)
  }

  const handleDeleteTemplate = (template: any) => {
    if (confirm(`确定要删除模板 "${template.name}" 吗？`)) {
      console.log('Delete template:', template.id)
      alert(`删除模板: ${template.name}`)
    }
  }

  const getFieldCount = (template: any) => {
    return template.sections.reduce((acc: number, section: any) => acc + section.fields.length, 0)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-purple-100 text-purple-800'
      case 'custom': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">表单模板管理</h1>
            <p className="text-gray-600">管理考试报名表单模板，支持创建、编辑、预览和删除</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              导入模板
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出模板
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建模板
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="搜索模板名称或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">{template.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Template Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">版本:</span>
                      <span className="ml-1 font-medium">{template.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">字段数:</span>
                      <span className="ml-1 font-medium">{getFieldCount(template)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">分组数:</span>
                      <span className="ml-1 font-medium">{template.sections.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">状态:</span>
                      <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {template.isActive ? '启用' : '禁用'}
                      </Badge>
                    </div>
                  </div>

                  {/* File Requirements */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">文件要求</h4>
                    <div className="space-y-1">
                      {template.fileRequirements.map((req: any, index: number) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <span className={`w-2 h-2 rounded-full mr-2 ${req.required ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <span>{req.label}</span>
                          {req.required && <span className="ml-1 text-red-600">*</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        预览
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneTemplate(template)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        克隆
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到模板</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? '尝试调整搜索条件或筛选器' 
                  : '还没有创建任何模板'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建第一个模板
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">模板预览: {selectedTemplate.name}</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    关闭
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {selectedTemplate.sections.map((section: any, index: number) => (
                    <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        {section.collapsible && (
                          <Badge className="bg-blue-100 text-blue-600">可折叠</Badge>
                        )}
                      </div>
                      
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.fields.map((field: any) => (
                          <div key={field.id} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{field.label}</span>
                              <div className="flex items-center space-x-1">
                                <Badge className="bg-gray-100 text-gray-600 text-xs">
                                  {field.type}
                                </Badge>
                                {field.required && (
                                  <Badge className="bg-red-100 text-red-600 text-xs">必填</Badge>
                                )}
                              </div>
                            </div>
                            {field.description && (
                              <p className="text-xs text-gray-500">{field.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
