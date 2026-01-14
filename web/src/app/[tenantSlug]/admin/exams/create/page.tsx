'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiPostWithTenant } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/loading'
import { ArrowLeft, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ExamFormData {
    code: string
    slug: string
    title: string
    description: string
    announcement: string
    registrationStart: string
    registrationEnd: string
    examStart: string
    examEnd: string
    feeRequired: boolean
    feeAmount: string
}

export default function NewExamPage() {
    const params = useParams()
    const tenantSlug = params.tenantSlug as string
    const router = useRouter()
    const { tenant, isLoading: tenantLoading } = useTenant()

    const [formData, setFormData] = useState<ExamFormData>({
        code: '',
        slug: '',
        title: '',
        description: '',
        announcement: '',
        registrationStart: '',
        registrationEnd: '',
        examStart: '',
        examEnd: '',
        feeRequired: false,
        feeAmount: '0',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const createExamMutation = useMutation({
        mutationFn: async (data: ExamFormData) => {
            if (!tenant?.id) throw new Error('No tenant selected')

            // 准备请求数据，匹配后端API
            const requestData: any = {
                code: data.code.trim(),
                title: data.title.trim(),
                description: data.description.trim() || undefined,
                announcement: data.announcement.trim() || undefined,
                slug: data.slug.trim() || undefined,
                feeRequired: data.feeRequired,
            }

            // 添加报名时间（转换为后端格式 yyyy-MM-dd HH:mm:ss）
            if (data.registrationStart) {
                requestData.registrationStart = data.registrationStart.replace('T', ' ') + ':00'
            }
            if (data.registrationEnd) {
                requestData.registrationEnd = data.registrationEnd.replace('T', ' ') + ':00'
            }

            // 添加考试时间（转换为后端格式 yyyy-MM-dd HH:mm:ss）
            if (data.examStart) {
                requestData.examStart = data.examStart.replace('T', ' ') + ':00'
            }
            if (data.examEnd) {
                requestData.examEnd = data.examEnd.replace('T', ' ') + ':00'
            }

            // 添加费用金额
            if (data.feeRequired && data.feeAmount) {
                requestData.feeAmount = parseFloat(data.feeAmount)
            }
            return apiPostWithTenant('/exams', tenant.id, requestData)
        },
        onSuccess: (data: any) => {
            router.push(`/${tenantSlug}/admin/exams/${data.id}`)
        },
        onError: (error: any) => {
            setErrors({ general: error.message || '创建考试失败' })
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        // Basic validation
        const newErrors: Record<string, string> = {}
        if (!formData.code.trim()) newErrors.code = '考试代码不能为空'
        if (!formData.title.trim()) newErrors.title = '考试标题不能为空'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        createExamMutation.mutate(formData)
    }

    const handleSwitchChange = (field: keyof ExamFormData) => (checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }))
    }

    const handleChange = (field: keyof ExamFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    if (tenantLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/admin/exams`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回列表
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">创建新考试</h1>
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
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange('code')}
                                    placeholder="例如：EXAM2025001"
                                    className={errors.code ? 'border-red-500' : ''}
                                />
                                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                            </div>

                            {/* URL后缀 */}
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL后缀</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange('slug')}
                                    placeholder="例如：spring-2025-recruitment"
                                />
                                <p className="text-xs text-muted-foreground">留空则自动生成</p>
                            </div>

                            {/* 考试标题 */}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="title">考试标题 *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange('title')}
                                    placeholder="例如：2025年春季校园招聘考试"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* 报名开始时间 */}
                            <div className="space-y-2">
                                <Label htmlFor="registrationStart">报名开始时间</Label>
                                <Input
                                    id="registrationStart"
                                    name="registrationStart"
                                    type="datetime-local"
                                    value={formData.registrationStart}
                                    onChange={handleChange('registrationStart')}
                                />
                            </div>

                            {/* 报名结束时间 */}
                            <div className="space-y-2">
                                <Label htmlFor="registrationEnd">报名结束时间</Label>
                                <Input
                                    id="registrationEnd"
                                    name="registrationEnd"
                                    type="datetime-local"
                                    value={formData.registrationEnd}
                                    onChange={handleChange('registrationEnd')}
                                />
                            </div>

                            {/* 考试开始时间 */}
                            <div className="space-y-2">
                                <Label htmlFor="examStart">考试开始时间</Label>
                                <Input
                                    id="examStart"
                                    name="examStart"
                                    type="datetime-local"
                                    value={formData.examStart}
                                    onChange={handleChange('examStart')}
                                />
                            </div>

                            {/* 考试结束时间 */}
                            <div className="space-y-2">
                                <Label htmlFor="examEnd">考试结束时间</Label>
                                <Input
                                    id="examEnd"
                                    name="examEnd"
                                    type="datetime-local"
                                    value={formData.examEnd}
                                    onChange={handleChange('examEnd')}
                                />
                            </div>
                        </div>

                        {/* 考试描述 */}
                        <div className="space-y-2">
                            <Label htmlFor="description">考试描述</Label>
                            <Textarea
                                id="description"
                                name="description"
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
                                name="announcement"
                                value={formData.announcement}
                                onChange={handleChange('announcement')}
                                placeholder="请输入考试公告"
                                rows={4}
                            />
                        </div>

                        {/* 费用设置 */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">费用设置</h3>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="feeRequired"
                                    checked={formData.feeRequired}
                                    onCheckedChange={handleSwitchChange('feeRequired')}
                                />
                                <Label htmlFor="feeRequired">需要缴纳报名费</Label>
                            </div>

                            {formData.feeRequired && (
                                <div className="space-y-2">
                                    <Label htmlFor="feeAmount">报名费金额（元）</Label>
                                    <Input
                                        id="feeAmount"
                                        name="feeAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.feeAmount}
                                        onChange={handleChange('feeAmount')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/${tenantSlug}/admin/exams`)}
                            >
                                取消
                            </Button>
                            <Button type="submit" disabled={createExamMutation.isPending}>
                                {createExamMutation.isPending ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        创建中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        创建考试
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
