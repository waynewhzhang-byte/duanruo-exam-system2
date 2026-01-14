'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormTemplate, FormSection, FormField, ConditionalLogic } from '@/types/form-template'
import { transformFormDataForSubmission, debugFormDataTransformation } from '@/lib/form-data-transformer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import DynamicField from './DynamicField'
import { ChevronDown, ChevronUp, Save, Send } from 'lucide-react'

interface DynamicFormProps {
  template: FormTemplate
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void>
  onSaveDraft?: (data: Record<string, any>) => Promise<void>
  isSubmitting?: boolean
  className?: string
  // 用于表单提交的额外参数
  examId?: string
  positionId?: string
  tenantId?: string // Optional: for file uploads when not in TenantProvider context
}

// 根据模板生成 zod 验证模式
function generateValidationSchema(template: FormTemplate): z.ZodSchema {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  template.sections.forEach(section => {
    section.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny

      // 根据字段类型创建基础 schema
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'textarea':
          fieldSchema = z.string()
          break
        case 'number':
          fieldSchema = z.number()
          break
        case 'date':
          fieldSchema = z.string()
          break
        case 'select':
        case 'radio':
          fieldSchema = z.string()
          break
        case 'checkbox':
        case 'agreement':
          fieldSchema = z.boolean()
          break
        case 'multi-select':
          fieldSchema = z.array(z.string())
          break
        case 'file-upload':
          fieldSchema = z.array(z.object({
            id: z.string(),
            fileName: z.string(),
            fileSize: z.number(),
            uploadedAt: z.string(),
          }))
          break
        case 'education-background':
          fieldSchema = z.array(z.object({
            school: z.string(),
            major: z.string(),
            level: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            isCurrent: z.boolean(),
            gpa: z.string().optional(),
          }))
          break
        case 'work-experience':
          fieldSchema = z.array(z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            isCurrent: z.boolean(),
            description: z.string().optional(),
          }))
          break
        default:
          fieldSchema = z.any()
      }

      // 应用验证规则
      if (field.validation) {
        field.validation.forEach(rule => {
          switch (rule.type) {
            case 'required':
              if (field.type === 'checkbox' || field.type === 'agreement') {
                fieldSchema = (fieldSchema as z.ZodBoolean).refine(val => val === true, {
                  message: rule.message,
                })
              } else if (field.type === 'file-upload') {
                fieldSchema = (fieldSchema as z.ZodArray<any>).min(1, rule.message)
              } else {
                fieldSchema = (fieldSchema as z.ZodString).min(1, rule.message)
              }
              break
            case 'min':
              if (field.type === 'number') {
                fieldSchema = (fieldSchema as z.ZodNumber).min(Number(rule.value), rule.message)
              } else {
                fieldSchema = (fieldSchema as z.ZodString).min(Number(rule.value), rule.message)
              }
              break
            case 'max':
              if (field.type === 'number') {
                fieldSchema = (fieldSchema as z.ZodNumber).max(Number(rule.value), rule.message)
              } else {
                fieldSchema = (fieldSchema as z.ZodString).max(Number(rule.value), rule.message)
              }
              break
            case 'pattern':
              fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(String(rule.value)), rule.message)
              break
          }
        })
      }

      // 如果不是必填，设为可选
      if (!field.required) {
        fieldSchema = fieldSchema.optional()
      }

      schemaFields[field.name] = fieldSchema
    })
  })

  return z.object(schemaFields)
}

// 检查条件逻辑
function evaluateCondition(condition: ConditionalLogic, formData: Record<string, any>): boolean {
  const fieldValue = formData[condition.field]
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value
    case 'not-equals':
      return fieldValue !== condition.value
    case 'contains':
      return String(fieldValue).includes(String(condition.value))
    case 'not-contains':
      return !String(fieldValue).includes(String(condition.value))
    case 'greater-than':
      return Number(fieldValue) > Number(condition.value)
    case 'less-than':
      return Number(fieldValue) < Number(condition.value)
    default:
      return true
  }
}

export default function DynamicForm({
  template,
  initialData = {},
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  className = '',
  tenantId,
}: DynamicFormProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // 生成默认值
  const generateDefaultValues = () => {
    const defaults: Record<string, any> = {}
    
    template.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue
        } else {
          // 根据字段类型设置默认值
          switch (field.type) {
            case 'checkbox':
            case 'agreement':
              defaults[field.name] = false
              break
            case 'multi-select':
            case 'file-upload':
            case 'education-background':
            case 'work-experience':
              defaults[field.name] = []
              break
            default:
              defaults[field.name] = ''
          }
        }
      })
    })

    return { ...defaults, ...initialData }
  }

  const validationSchema = useMemo(
    () => generateValidationSchema(template),
    [template]
  )

  const form = useForm({
    resolver: zodResolver(validationSchema as any),
    defaultValues: generateDefaultValues(),
  })

  const watchedValues = form.watch()

  // 初始化折叠状态
  useEffect(() => {
    const initialCollapsed = new Set<string>()
    template.sections.forEach(section => {
      if (section.collapsed) {
        initialCollapsed.add(section.id)
      }
    })
    setCollapsedSections(initialCollapsed)
  }, [template])

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return
    
    try {
      const data = form.getValues()
      await onSaveDraft(data)
    } catch (error) {
      console.error('Save draft error:', error)
    }
  }

  // 过滤可见的字段
  const getVisibleFields = (fields: FormField[]) => {
    return fields.filter(field => {
      if (!field.conditional) return true
      return evaluateCondition(field.conditional, watchedValues)
    })
  }

  // 过滤可见的分组
  const getVisibleSections = () => {
    return template.sections
      .filter(section => {
        if (!section.conditional) return true
        return evaluateCondition(section.conditional, watchedValues)
      })
      .sort((a, b) => a.order - b.order)
  }

  const getFieldWidth = (width: string) => {
    switch (width) {
      case 'half':
        return 'md:w-1/2'
      case 'third':
        return 'md:w-1/3'
      case 'quarter':
        return 'md:w-1/4'
      default:
        return 'w-full'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Form {...form}>
          {getVisibleSections().map((section) => {
            const isCollapsed = collapsedSections.has(section.id)
            const visibleFields = getVisibleFields(section.fields).sort((a, b) => a.order - b.order)
            
            if (visibleFields.length === 0) return null

            return (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      )}
                    </div>
                    {section.collapsible && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSection(section.id)}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {!isCollapsed && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {visibleFields.map((field) => (
                        <div
                          key={field.id}
                          className={`${getFieldWidth(field.width)} ${
                            field.width === 'full' ? 'md:col-span-12' :
                            field.width === 'half' ? 'md:col-span-6' :
                            field.width === 'third' ? 'md:col-span-4' :
                            field.width === 'quarter' ? 'md:col-span-3' :
                            'md:col-span-12'
                          }`}
                        >
                          <DynamicField
                            field={field}
                            form={form}
                            template={template}
                            tenantId={tenantId}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}

          {/* 提交按钮 */}
          <div className="flex justify-between">
            {template.allowSaveDraft && onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                保存草稿
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {template.submitButtonText}
            </Button>
          </div>
        </Form>
      </form>
    </div>
  )
}
