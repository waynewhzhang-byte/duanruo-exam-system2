'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, GripVertical, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { FormTemplate, FormSection, FormField } from '@/types/form-template'
import { useState } from 'react'
import FieldConfigPanel from './FieldConfigPanel'

interface FormBuilderCanvasProps {
  template: FormTemplate
  selectedSection: string | null
  selectedField: string | null
  onSelectSection: (sectionId: string | null) => void
  onSelectField: (fieldId: string | null) => void
  onAddSection: () => void
  onUpdateSection: (sectionId: string, updates: Partial<FormSection>) => void
  onDeleteSection: (sectionId: string) => void
  onUpdateField: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void
  onDeleteField: (sectionId: string, fieldId: string) => void
}

export default function FormBuilderCanvas({
  template,
  selectedSection,
  selectedField,
  onSelectSection,
  onSelectField,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onUpdateField,
  onDeleteField,
}: FormBuilderCanvasProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const handleSectionClick = (sectionId: string) => {
    onSelectSection(sectionId)
    onSelectField(null)
  }

  const handleFieldClick = (sectionId: string, fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectSection(sectionId)
    onSelectField(fieldId)
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 画布区域 */}
      <div className="col-span-8">
        <Card className="h-[calc(100vh-300px)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">表单画布</CardTitle>
                <CardDescription className="text-xs">
                  {template.sections.length} 个分区，
                  {template.sections.reduce((sum, s) => sum + s.fields.length, 0)} 个字段
                </CardDescription>
              </div>
              <Button size="sm" onClick={onAddSection}>
                <Plus className="h-4 w-4 mr-1" />
                添加分区
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="h-[calc(100%-80px)]">
              {template.sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-muted-foreground mb-4">暂无分区</p>
                  <Button onClick={onAddSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加第一个分区
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {template.sections.map((section) => (
                    <Card
                      key={section.id}
                      className={`cursor-pointer transition-all ${
                        selectedSection === section.id
                          ? 'ring-2 ring-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleSectionClick(section.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-move" />
                            <div className="flex-1">
                              {editingSection === section.id ? (
                                <div className="space-y-2" onClick={(e) => e.stopPropagation()} role="group" aria-label="编辑分区" onKeyDown={(e) => e.stopPropagation()}>
                                  <Input
                                    value={section.title}
                                    onChange={(e) =>
                                      onUpdateSection(section.id, { title: e.target.value })
                                    }
                                    onBlur={() => setEditingSection(null)}
                                    autoFocus
                                    className="h-8"
                                  />
                                  <Input
                                    value={section.description || ''}
                                    onChange={(e) =>
                                      onUpdateSection(section.id, { description: e.target.value })
                                    }
                                    placeholder="分区描述（可选）"
                                    className="h-7 text-xs"
                                  />
                                </div>
                              ) : (
                                <div onDoubleClick={() => setEditingSection(section.id)}>
                                  <h3 className="font-semibold">{section.title}</h3>
                                  {section.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {section.description}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} role="group" aria-label="分区操作" onKeyDown={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSection(section.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('确定要删除这个分区吗？')) {
                                  onDeleteSection(section.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {section.fields.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                            从左侧拖拽或点击字段添加到此分区
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {section.fields.map((field) => (
                              <div
                                key={field.id}
className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    selectedField === field.id
                                    ? 'bg-primary/5 border-primary'
                                    : 'hover:bg-accent'
                                }`}
                                onClick={(e) => handleFieldClick(section.id, field.id, e)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSection(section.id); onSelectField(field.id); } }}
                                aria-label={`选择字段 ${field.label || field.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{field.label}</span>
                                        {field.required && (
                                          <span className="text-xs text-destructive">*</span>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          ({field.type})
                                        </span>
                                      </div>
                                      {field.placeholder && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {field.placeholder}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('确定要删除这个字段吗？')) {
                                        onDeleteField(section.id, field.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 配置面板 */}
      <div className="col-span-4">
        <Card className="h-[calc(100vh-300px)]">
          <CardHeader>
            <CardTitle className="text-base">属性配置</CardTitle>
            <CardDescription className="text-xs">
              {selectedField
                ? '字段属性'
                : selectedSection
                ? '分区属性'
                : '选择分区或字段进行配置'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="h-[calc(100%-80px)]">
              {selectedField && selectedSection ? (
                <FieldConfigPanel
                  section={template.sections.find((s) => s.id === selectedSection)!}
                  field={
                    template.sections
                      .find((s) => s.id === selectedSection)
                      ?.fields.find((f) => f.id === selectedField)!
                  }
                  onUpdateField={(updates) =>
                    onUpdateField(selectedSection, selectedField, updates)
                  }
                />
              ) : selectedSection ? (
                <SectionConfigPanel
                  section={template.sections.find((s) => s.id === selectedSection)!}
                  onUpdateSection={(updates) => onUpdateSection(selectedSection, updates)}
                />
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  请选择一个分区或字段
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 分区配置面板
function SectionConfigPanel({
  section,
  onUpdateSection,
}: {
  section: FormSection
  onUpdateSection: (updates: Partial<FormSection>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>分区标题</Label>
        <Input
          value={section.title}
          onChange={(e) => onUpdateSection({ title: e.target.value })}
          placeholder="输入分区标题"
        />
      </div>
      <div>
        <Label>分区描述</Label>
        <Textarea
          value={section.description || ''}
          onChange={(e) => onUpdateSection({ description: e.target.value })}
          placeholder="输入分区描述（可选）"
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>可折叠</Label>
        <Switch
          checked={section.collapsible}
          onCheckedChange={(checked) => onUpdateSection({ collapsible: checked })}
        />
      </div>
      {section.collapsible && (
        <div className="flex items-center justify-between">
          <Label>默认折叠</Label>
          <Switch
            checked={section.collapsed}
            onCheckedChange={(checked) => onUpdateSection({ collapsed: checked })}
          />
        </div>
      )}
    </div>
  )
}

