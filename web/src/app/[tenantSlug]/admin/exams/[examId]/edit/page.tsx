'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGetWithTenant, apiPutWithTenant } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/loading'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Exam {
  id: string
  code: string
  title: string
  description: string
  registrationStart?: string
  registrationEnd?: string
  examStart?: string
  examEnd?: string
  announcement: string
  status: string
}

interface ExamFormData {
  code: string
  title: string
  description: string
  registrationStart: string
  registrationEnd: string
  examStart: string
  examEnd: string
  announcement: string
}

export default function EditExamPage() {
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()

  const [formData, setFormData] = useState<ExamFormData>({
    code: '',
    title: '',
    description: '',
    registrationStart: '',
    registrationEnd: '',
    examStart: '',
    examEnd: '',
    announcement: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch exam data
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!tenant?.id && !!examId,
  })

  // Update form data when exam is loaded
  useEffect(() => {
    if (exam) {
      setFormData({
        code: exam.code,
        title: exam.title,
        description: exam.description || '',
        registrationStart: exam.registrationStart?.replace(' ', 'T').substring(0, 16) || '',
        registrationEnd: exam.registrationEnd?.replace(' ', 'T').substring(0, 16) || '',
        examStart: exam.examStart?.replace(' ', 'T').substring(0, 16) || '',
        examEnd: exam.examEnd?.replace(' ', 'T').substring(0, 16) || '',
        announcement: exam.announcement || '',
      })
    }
  }, [exam])

  const updateExamMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiPutWithTenant(`/exams/${examId}`, tenant.id, data)
    },
    onSuccess: () => {
      router.push(`/${tenantSlug}/admin/exams/${examId}/detail`)
    },
    onError: (error: any) => {
      setErrors({ general: error.message || '更新考试失败' })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.code) newErrors.code = '考试代码不能为空'
    if (!formData.title) newErrors.title = '考试名称不能为空'
    if (!formData.registrationStart) newErrors.registrationStart = '报名开始时间不能为空'
    if (!formData.registrationEnd) newErrors.registrationEnd = '报名结束时间不能为空'
    if (!formData.examStart) newErrors.examStart = '考试开始时间不能为空'
    if (!formData.examEnd) newErrors.examEnd = '考试结束时间不能为空'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    updateExamMutation.mutate(formData)
  }

  const handleChange = (field: keyof ExamFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isLoading = tenantLoading || examLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">考试不存在</p>
        <Button onClick={() => router.push(`/${tenantSlug}/admin/exams`)}>返回考试列表</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/detail`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回详情
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">编辑考试</h1>
            <p className="text-muted-foreground mt-1">租户: {tenant?.name}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>考试基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 考试代码 */}
              <div className="space-y-2">
                <Label htmlFor="code">考试代码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={handleChange('code')}
                  placeholder="例如：EXAM2025001"
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>

              {/* 考试名称 */}
              <div className="space-y-2">
                <Label htmlFor="title">考试名称 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleChange('title')}
                  placeholder="例如：2025年春季公务员招聘考试"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* 报名开始时间 */}
              <div className="space-y-2">
                <Label htmlFor="registrationStart">报名开始时间 *</Label>
                <Input
                  id="registrationStart"
                  type="datetime-local"
                  value={formData.registrationStart}
                  onChange={handleChange('registrationStart')}
                  className={errors.registrationStart ? 'border-red-500' : ''}
                />
                {errors.registrationStart && (
                  <p className="text-sm text-red-500">{errors.registrationStart}</p>
                )}
              </div>

              {/* 报名结束时间 */}
              <div className="space-y-2">
                <Label htmlFor="registrationEnd">报名结束时间 *</Label>
                <Input
                  id="registrationEnd"
                  type="datetime-local"
                  value={formData.registrationEnd}
                  onChange={handleChange('registrationEnd')}
                  className={errors.registrationEnd ? 'border-red-500' : ''}
                />
                {errors.registrationEnd && (
                  <p className="text-sm text-red-500">{errors.registrationEnd}</p>
                )}
              </div>

              {/* 考试开始时间 */}
              <div className="space-y-2">
                <Label htmlFor="examStart">考试开始时间 *</Label>
                <Input
                  id="examStart"
                  type="datetime-local"
                  value={formData.examStart}
                  onChange={handleChange('examStart')}
                  className={errors.examStart ? 'border-red-500' : ''}
                />
                {errors.examStart && (
                  <p className="text-sm text-red-500">{errors.examStart}</p>
                )}
              </div>

              {/* 考试结束时间 */}
              <div className="space-y-2">
                <Label htmlFor="examEnd">考试结束时间 *</Label>
                <Input
                  id="examEnd"
                  type="datetime-local"
                  value={formData.examEnd}
                  onChange={handleChange('examEnd')}
                  className={errors.examEnd ? 'border-red-500' : ''}
                />
                {errors.examEnd && (
                  <p className="text-sm text-red-500">{errors.examEnd}</p>
                )}
              </div>
            </div>

            {/* 考试描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">考试描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="请输入考试描述"
                rows={3}
              />
            </div>

            {/* 考试公告 */}
            <div className="space-y-2">
              <Label htmlFor="announcement">考试公告</Label>
              <Textarea
                id="announcement"
                value={formData.announcement}
                onChange={handleChange('announcement')}
                placeholder="请输入考试公告"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/detail`)}
              >
                取消
              </Button>
              <Button type="submit" disabled={updateExamMutation.isPending}>
                {updateExamMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存修改
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

