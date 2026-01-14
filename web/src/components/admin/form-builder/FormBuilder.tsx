'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Eye, Code, Save, Undo, Redo, FileText } from 'lucide-react'
import { FormTemplate, FormSection, FormField } from '@/types/form-template'
import FormBuilderCanvas from './FormBuilderCanvas'
import FormBuilderSidebar from './FormBuilderSidebar'
import FormBuilderPreview from './FormBuilderPreview'
import { toast } from 'sonner'
import { BASIC_TEMPLATE, COMPREHENSIVE_TEMPLATE, FORM_TEMPLATES } from '@/data/form-templates'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FormBuilderProps {
  examId: string
  positionId?: string
  initialTemplate?: FormTemplate
  onSave?: (template: FormTemplate) => Promise<void>
  readOnly?: boolean
}

export default function FormBuilder({ examId, positionId, initialTemplate, onSave, readOnly = false }: FormBuilderProps) {
  const [template, setTemplate] = useState<FormTemplate>(
    initialTemplate || createDefaultTemplate()
  )
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'design' | 'preview' | 'json'>('design')
  const [isSaving, setIsSaving] = useState(false)

  // 应用预定义模板
  const handleApplyTemplate = (templateId: string) => {
    const presetTemplate = FORM_TEMPLATES.find(t => t.id === templateId)
    if (presetTemplate) {
      // 深拷贝模板并保持当前的ID和时间戳
      const newTemplate = JSON.parse(JSON.stringify(presetTemplate)) as FormTemplate
      newTemplate.id = template.id
      newTemplate.createdAt = template.createdAt
      newTemplate.updatedAt = new Date().toISOString()
      setTemplate(newTemplate)
      setSelectedSection(null)
      setSelectedField(null)
      toast.success(`已应用模板：${presetTemplate.name}`)
    }
  }

  // 添加新分区
  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: '新分区',
      description: '',
      order: template.sections.length + 1,
      collapsible: false,
      collapsed: false,
      fields: [],
    }
    setTemplate({
      ...template,
      sections: [...template.sections, newSection],
    })
    setSelectedSection(newSection.id)
  }

  // 更新分区
  const handleUpdateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setTemplate({
      ...template,
      sections: template.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    })
  }

  // 删除分区
  const handleDeleteSection = (sectionId: string) => {
    setTemplate({
      ...template,
      sections: template.sections.filter(section => section.id !== sectionId),
    })
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }
  }

  // 添加字段到分区
  const handleAddField = (sectionId: string, field: FormField) => {
    setTemplate({
      ...template,
      sections: template.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: [...section.fields, { ...field, id: `field-${Date.now()}`, order: section.fields.length + 1 }],
            }
          : section
      ),
    })
  }

  // 更新字段
  const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    setTemplate({
      ...template,
      sections: template.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId ? { ...field, ...updates } : field
              ),
            }
          : section
      ),
    })
  }

  // 删除字段
  const handleDeleteField = (sectionId: string, fieldId: string) => {
    setTemplate({
      ...template,
      sections: template.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.filter(field => field.id !== fieldId),
            }
          : section
      ),
    })
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  // 保存模板
  const handleSave = async () => {
    if (!onSave) {
      toast.error('保存功能未配置')
      return
    }

    setIsSaving(true)
    try {
      await onSave(template)
      toast.success('表单模板保存成功')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>表单设计器</CardTitle>
              <CardDescription>拖拽字段设计报名表单，支持实时预览</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        选择模板
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>预定义模板</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {FORM_TEMPLATES.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => handleApplyTemplate(t.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{t.name}</span>
                            <span className="text-xs text-muted-foreground">{t.description}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" disabled>
                    <Undo className="h-4 w-4 mr-1" />
                    撤销
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Redo className="h-4 w-4 mr-1" />
                    重做
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? '保存中...' : '保存模板'}
                  </Button>
                </>
              )}
              {readOnly && (
                <div className="text-sm text-muted-foreground">
                  只读模式 - 已发布的表单无法修改
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="design">
            <Plus className="h-4 w-4 mr-2" />
            设计
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            预览
          </TabsTrigger>
          <TabsTrigger value="json">
            <Code className="h-4 w-4 mr-2" />
            JSON
          </TabsTrigger>
        </TabsList>

        {/* 设计视图 */}
        <TabsContent value="design" className="space-y-4">
          {readOnly ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    此表单已发布，处于只读模式。如需修改，请创建新版本。
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('preview')}>
                    <Eye className="h-4 w-4 mr-2" />
                    查看预览
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              {/* 左侧：字段库 */}
              <div className="col-span-3">
                <FormBuilderSidebar
                  onAddField={(field) => {
                    if (selectedSection) {
                      handleAddField(selectedSection, field)
                    } else {
                      toast.error('请先选择一个分区')
                    }
                  }}
                />
              </div>

              {/* 中间：画布 */}
              <div className="col-span-9">
                <FormBuilderCanvas
                  template={template}
                  selectedSection={selectedSection}
                  selectedField={selectedField}
                  onSelectSection={setSelectedSection}
                  onSelectField={setSelectedField}
                  onAddSection={handleAddSection}
                  onUpdateSection={handleUpdateSection}
                  onDeleteSection={handleDeleteSection}
                  onUpdateField={handleUpdateField}
                  onDeleteField={handleDeleteField}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* 预览视图 */}
        <TabsContent value="preview">
          <FormBuilderPreview template={template} />
        </TabsContent>

        {/* JSON 视图 */}
        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>JSON 配置</CardTitle>
              <CardDescription>表单模板的 JSON 表示</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
                {JSON.stringify(template, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 创建默认模板 - 使用基础报名模板作为默认
function createDefaultTemplate(): FormTemplate {
  // 深拷贝 BASIC_TEMPLATE 并生成新的 ID
  const template = JSON.parse(JSON.stringify(BASIC_TEMPLATE)) as FormTemplate
  template.id = `template-${Date.now()}`
  template.createdAt = new Date().toISOString()
  template.updatedAt = new Date().toISOString()
  return template
}

