'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DynamicForm from '@/components/forms/DynamicForm'
import { transformFormDataForSubmission } from '@/lib/form-data-transformer'
import { FORM_TEMPLATES, getTemplateById } from '@/data/form-templates'
import { FormTemplate } from '@/types/form-template'
import { ArrowLeft, FileText, Settings, Eye } from 'lucide-react'
import { useOpenExams } from '@/lib/api-hooks'
import { Spinner } from '@/components/ui/loading'

function TemplateApplicationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('examId')
  const templateId = searchParams.get('templateId')
  
  const { data: exams, isLoading } = useOpenExams()
  
  const [selectedExam, setSelectedExam] = useState(examId || '')
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    templateId ? getTemplateById(templateId) || null : null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleExamSelect = (examId: string) => {
    const exam = exams?.find(e => e.id === examId)
    if (exam) {
      setSelectedExam(examId)
      setSelectedTemplate(null)
    }
  }

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      const exam = exams?.find(e => e.id === selectedExam)

      const submitData = transformFormDataForSubmission(
        data,
        selectedExam,
        selectedExam,
        1
      )

      console.log('🔄 表单数据转换结果:', submitData)

      // TODO: 调用实际的API
      // const response = await apiPost('/applications', submitData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      alert('报名提交成功！')
      router.push('/candidate/applications')
    } catch (error) {
      console.error('Submit error:', error)
      alert('提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (data: Record<string, any>) => {
    try {
      console.log('Save draft:', {
        examId: selectedExam,
        templateId: selectedTemplate?.id,
        data,
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('草稿保存成功！')
    } catch (error) {
      console.error('Save draft error:', error)
      alert('保存失败，请重试')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">模板化报名</h1>
            <p className="text-gray-600">基于考试模板的动态报名表单</p>
          </div>
        </div>

        {/* Exam Selection */}
        {!selectedExam && (
          <Card>
            <CardHeader>
              <CardTitle>选择考试</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : exams && exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors"
                        onClick={() => handleExamSelect(exam.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <FileText className="h-6 w-6 text-primary-600" />
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            报名中
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{exam.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{exam.description || ''}</p>
                        <div className="text-xs text-gray-500">
                          <p>考试ID: {exam.examId}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">暂无可用考试</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Template Info */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>{selectedTemplate.name}</span>
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? '隐藏' : '预览'}模板
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedExam('')
                      setSelectedTemplate(null)
                    }}
                  >
                    重新选择
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {showPreview && (
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">模板结构预览</h4>
                  <div className="space-y-2">
                    {selectedTemplate.sections.map((section, index) => (
                      <div key={section.id} className="flex items-center space-x-2 text-sm">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="font-medium">{section.title}</span>
                        <span className="text-gray-500">({section.fields.length} 个字段)</span>
                        {section.collapsible && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">可折叠</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">文件要求</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedTemplate.fileRequirements.map((req) => (
                        <div key={req.category} className="flex items-center space-x-2 text-sm">
                          <span className={`w-2 h-2 rounded-full ${req.required ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <span>{req.label}</span>
                          {req.required && (
                            <span className="text-xs text-red-600">必需</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Dynamic Form */}
        {selectedTemplate && !showPreview && (
          <DynamicForm
            template={selectedTemplate}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Template Selection Help */}
        {!selectedExam && (
          <Card>
            <CardHeader>
              <CardTitle>模板说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">基础模板</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    适用于简单考试，包含基本个人信息和必要附件。
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• 个人基本信息</li>
                    <li>• 身份证明文件</li>
                    <li>• 协议确认</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">完整模板</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    适用于复杂考试，包含详细的教育和工作背景。
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• 完整个人信息</li>
                    <li>• 紧急联系人</li>
                    <li>• 教育背景</li>
                    <li>• 工作经历</li>
                    <li>• 多种附件类型</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">技能认证模板</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    适用于技能认证类考试，重点关注技能水平。
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• 基本个人信息</li>
                    <li>• 技能类别选择</li>
                    <li>• 技能水平评估</li>
                    <li>• 技能证明材料</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function TemplateApplicationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateApplicationPageContent />
    </Suspense>
  )
}
