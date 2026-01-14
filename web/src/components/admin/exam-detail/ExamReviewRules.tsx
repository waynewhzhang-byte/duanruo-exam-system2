'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Save, Plus, X, Loader2 } from 'lucide-react'
import { useExamRules, useUpdateExamRules } from '@/lib/api-hooks'
import { toast } from 'sonner'
import { useTenant } from '@/hooks/useTenant'

interface ExamReviewRulesProps {
  examId: string
}

export default function ExamReviewRules({ examId }: Readonly<ExamReviewRulesProps>) {
  const { tenant } = useTenant()
  const { data: rulesData, isLoading } = useExamRules(examId, tenant?.id)
  const updateRulesMutation = useUpdateExamRules()

  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [requiredAttachments, setRequiredAttachments] = useState<string[]>([])
  const [autoReviewEducation, setAutoReviewEducation] = useState<string[]>([])
  const [newField, setNewField] = useState('')
  const [newAttachment, setNewAttachment] = useState('')
  const [newEducation, setNewEducation] = useState('')

  // Load rules data
  useEffect(() => {
    if (rulesData) {
      setRequiredFields((rulesData as any).requiredFields || [])
      setRequiredAttachments((rulesData as any).requiredAttachments || [])
      setAutoReviewEducation((rulesData as any).autoReview?.passIfEducationIn || [])
    }
  }, [rulesData])

  const handleAddField = () => {
    if (newField.trim() && !requiredFields.includes(newField.trim())) {
      setRequiredFields([...requiredFields, newField.trim()])
      setNewField('')
    }
  }

  const handleRemoveField = (field: string) => {
    setRequiredFields(requiredFields.filter(f => f !== field))
  }

  const handleAddAttachment = () => {
    if (newAttachment.trim() && !requiredAttachments.includes(newAttachment.trim())) {
      setRequiredAttachments([...requiredAttachments, newAttachment.trim()])
      setNewAttachment('')
    }
  }

  const handleRemoveAttachment = (attachment: string) => {
    setRequiredAttachments(requiredAttachments.filter(a => a !== attachment))
  }

  const handleAddEducation = () => {
    if (newEducation.trim() && !autoReviewEducation.includes(newEducation.trim())) {
      setAutoReviewEducation([...autoReviewEducation, newEducation.trim()])
      setNewEducation('')
    }
  }

  const handleRemoveEducation = (education: string) => {
    setAutoReviewEducation(autoReviewEducation.filter(e => e !== education))
  }

  const handleSave = async () => {
    const rules = {
      requiredFields,
      requiredAttachments,
      autoReview: {
        passIfEducationIn: autoReviewEducation,
      },
    }

    try {
      await updateRulesMutation.mutateAsync({ examId, rules })
      toast.success('审核规则保存成功')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>审核规则配置</CardTitle>
          <CardDescription>配置报名申请的自动审核规则和人工审核流程</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>审核规则配置</CardTitle>
            <CardDescription>配置报名申请的自动审核规则和人工审核流程</CardDescription>
          </div>
          <Button onClick={handleSave} disabled={updateRulesMutation.isPending}>
            {updateRulesMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存配置
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Fields */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">必填字段</Label>
            <p className="text-sm text-muted-foreground mt-1">
              配置报名表单中必须填写的字段（字段名需与表单字段的 name 属性一致）
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="例如：fullName, idNumber, phone"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
            />
            <Button onClick={handleAddField} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {requiredFields.map((field) => (
              <Badge key={field} variant="secondary" className="px-3 py-1">
                {field}
                <button
                  onClick={() => handleRemoveField(field)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {requiredFields.length === 0 && (
              <p className="text-sm text-muted-foreground">暂无必填字段</p>
            )}
          </div>
        </div>

        {/* Required Attachments */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">必需附件</Label>
            <p className="text-sm text-muted-foreground mt-1">
              配置报名时必须上传的附件类型（附件字段的 fieldKey）
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="例如：idCardFiles, educationCertificateFiles"
              value={newAttachment}
              onChange={(e) => setNewAttachment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAttachment()}
            />
            <Button onClick={handleAddAttachment} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {requiredAttachments.map((attachment) => (
              <Badge key={attachment} variant="secondary" className="px-3 py-1">
                {attachment}
                <button
                  onClick={() => handleRemoveAttachment(attachment)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {requiredAttachments.length === 0 && (
              <p className="text-sm text-muted-foreground">暂无必需附件</p>
            )}
          </div>
        </div>

        {/* Auto Review Rules */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">自动审核规则 - 学历自动通过</Label>
            <p className="text-sm text-muted-foreground mt-1">
              配置满足学历要求的申请自动通过初审（例如：本科、硕士、博士）
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="例如：本科、硕士、博士"
              value={newEducation}
              onChange={(e) => setNewEducation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEducation()}
            />
            <Button onClick={handleAddEducation} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {autoReviewEducation.map((education) => (
              <Badge key={education} variant="secondary" className="px-3 py-1">
                {education}
                <button
                  onClick={() => handleRemoveEducation(education)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {autoReviewEducation.length === 0 && (
              <p className="text-sm text-muted-foreground">暂无自动通过学历规则</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

