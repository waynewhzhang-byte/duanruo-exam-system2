// @ts-nocheck
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import FormFileUpload from '@/components/ui/formfileupload'
import { ApplicationForm, EDUCATION_LEVEL_LABELS, type ApplicationForm as ApplicationFormType } from '@/types/application'
import { ArrowLeft, Save, Send, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useSubmitApplication, useExam, usePosition, useExams, useExamPositions, useSaveDraft, useApplication, useUpdateDraft } from '@/lib/api-hooks'
import { useToast } from '@/components/ui/use-toast'

// 数据来源改为真实 API（exams、positions、application submit）
function NewApplicationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Get exam and position from URL parameters
  const examId = searchParams.get('examId') || ''
  const positionId = searchParams.get('positionId') || ''
  const draftId = searchParams.get('draftId') || ''

  // Load selected exam and position details via API
  const { data: selectedExam } = useExam(examId || '')
  const { data: selectedPosition } = usePosition(positionId || '')

  const form = useForm<ApplicationFormType>({
    resolver: zodResolver(ApplicationForm),
    defaultValues: {
      examId: examId,
      positionId: positionId,
      fullName: '',
      idNumber: '',
      phone: '',
      email: '',
      gender: undefined,
      birthDate: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      educationBackgrounds: [{
        school: '',
        major: '',
        level: 'BACHELOR',
        startDate: '',
        endDate: '',
        isCurrent: false,
        gpa: '',
      }],
      workExperiences: [],
      idCardFiles: [],
      educationCertificateFiles: [],
      workCertificateFiles: [],
      otherFiles: [],
      specialNeeds: '',
      selfIntroduction: '',
      agreeToTerms: false,
      agreeToPrivacy: false,
    },
  })

  const { toast } = useToast()
  const submit = useSubmitApplication()
  const saveDraft = useSaveDraft()
  const updateDraft = useUpdateDraft()

  // 如果有 draftId，拉取草稿详情用于回填
  const { data: draftDetail } = useApplication(draftId)

  const { data: examsPaged } = useExams({})
  const examsOptions = examsPaged?.content ?? []

  const watchedExamId = form.watch('examId')
  const { data: positionsData } = useExamPositions(watchedExamId || '')
  const availablePositions = positionsData ?? []

  /* FIX: quarantine corrupted block below

  // 

 


 draft 



  useEffect(() => {
    if (!draftDetail) return
    try {
      const p: any = (draftDetail as any).payload || {}
      // 
 exam/position 
      if (!form.getValues('examId') && (draftDetail as any).examId) form.setValue('examId', (draftDetail as any).examId)
      if (!form.getValues('positionId') && (draftDetail as any).positionId) form.setValue('positionId', (draftDetail as any).positionId)
      // 
      const fields = ['fullName','idNumber','phone','email','gender','birthDate','address','emergencyContactName','emergencyContactPhone','emergencyContactRelation','specialNeeds','selfIntroduction'] as const
      fields.forEach((k) => { if (p[k] !== undefined) form.setValue(k as any, p[k]) })
      if (Array.isArray(p.educationBackgrounds)) form.setValue('educationBackgrounds', p.educationBackgrounds)
      if (Array.isArray(p.workExperiences)) form.setValue('workExperiences', p.workExperiences)
    } catch (e) { console.warn('fill draft failed', e) }
  }, [draftDetail])

  // 

  useEffect(() => {
    if (!draftId) return
    let timer: any
    const subscription = form.watch(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          const data = form.getValues()
          if (!data.examId || !data.positionId) return
          const payload = {
            fullName: data.fullName,
            idNumber: data.idNumber,
            phone: data.phone,
            email: data.email,
            gender: data.gender,
            birthDate: data.birthDate,
            address: data.address,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelation: data.emergencyContactRelation,
            educationBackgrounds: data.educationBackgrounds,
            workExperiences: data.workExperiences,
            specialNeeds: data.specialNeeds,
            selfIntroduction: data.selfIntroduction,
          }
          updateDraft.mutate({ id: draftId, data: { examId: data.examId, positionId: data.positionId, formVersion: 1, payload } })
        } catch (e) { // ignore autosave errors }
      }, 1500)
    })
    return () => { if (timer) clearTimeout(timer); subscription.unsubscribe() }
  }, [draftId])

  */

  // Clean re-implementation of draft detail fill and autosave
  useEffect(() => {
    if (!draftDetail) return
    try {
      const d: any = draftDetail as any
      const p: any = d.payload || {}
      if (!form.getValues('examId') && d.examId) form.setValue('examId', d.examId)
      if (!form.getValues('positionId') && d.positionId) form.setValue('positionId', d.positionId)
      const fields = ['fullName','idNumber','phone','email','gender','birthDate','address','emergencyContactName','emergencyContactPhone','emergencyContactRelation','specialNeeds','selfIntroduction'] as const
      fields.forEach((k) => { if (p[k] !== undefined) form.setValue(k as any, p[k]) })
      if (Array.isArray(p.educationBackgrounds)) form.setValue('educationBackgrounds', p.educationBackgrounds)
      if (Array.isArray(p.workExperiences)) form.setValue('workExperiences', p.workExperiences)
    } catch (e) { console.warn('fill draft failed', e) }
  }, [draftDetail, form])

  useEffect(() => {
    if (!draftId) return
    let timer: any
    const subscription = form.watch(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          setIsSaving(true)
          const data = form.getValues()
          if (!data.examId || !data.positionId) return
          const payload = {
            fullName: data.fullName,
            idNumber: data.idNumber,
            phone: data.phone,
            email: data.email,
            gender: data.gender,
            birthDate: data.birthDate,
            address: data.address,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelation: data.emergencyContactRelation,
            educationBackgrounds: data.educationBackgrounds,
            workExperiences: data.workExperiences,
            specialNeeds: data.specialNeeds,
            selfIntroduction: data.selfIntroduction,
          }
          await updateDraft.mutateAsync({ id: draftId, data: { examId: data.examId, positionId: data.positionId, formVersion: 1, payload } })
          setLastSavedAt(new Date())
          setIsSaving(false)
        } catch (e) {
          setIsSaving(false)
          /* ignore autosave errors */
        }
      }, 1500)
    })
    return () => { if (timer) clearTimeout(timer); subscription.unsubscribe() }
  }, [draftId, form, updateDraft])

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    try {
      const data = form.getValues()
      if (!data.examId || !data.positionId) {
        toast({
          title: "提示",
          description: "请先选择考试和岗位后再保存草稿",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }
      const collect = (key: any) => (form.getValues(key) || []).map((f: any) => ({ fileId: f.id, fieldKey: String(key) }))
      const attachments = [
        ...collect('idCardFiles'),
        ...collect('educationCertificateFiles'),
        ...collect('workCertificateFiles'),
        ...collect('otherFiles'),
      ]
      const payload = {
        fullName: data.fullName,
        idNumber: data.idNumber,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        birthDate: data.birthDate,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        educationBackgrounds: data.educationBackgrounds,
        workExperiences: data.workExperiences,
        specialNeeds: data.specialNeeds,
        selfIntroduction: data.selfIntroduction,
      }
      await saveDraft.mutateAsync({
        examId: data.examId,
        positionId: data.positionId,
        formVersion: 1,
        payload,
        attachments,
      })
      toast({
        title: "成功",
        description: "草稿保存成功"
      })
    } catch (error) {
      console.error('Save draft error:', error)
      toast({
        title: "错误",
        description: "保存失败，请重试",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (data: ApplicationFormType) => {
    setIsSubmitting(true)
    try {
      if (!data.examId || !data.positionId) {
        toast({
          title: "提示",
          description: "请选择考试和岗位",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      const collect = (key: any) => (form.getValues(key) || []).map((f: any) => ({ fileId: f.id, fieldKey: String(key) }))
      const idCards = collect('idCardFiles')
      const eduCerts = collect('educationCertificateFiles')

      if (idCards.length === 0 || eduCerts.length === 0) {
        toast({
          title: "提示",
          description: "请上传必需的身份证与学历证书",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      const attachments = [
        ...idCards,
        ...collect('workCertificateFiles'),
        ...collect('otherFiles'),
      ]

      const payload = {
        fullName: data.fullName,
        idNumber: data.idNumber,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        birthDate: data.birthDate,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        educationBackgrounds: data.educationBackgrounds,
        workExperiences: data.workExperiences,
        specialNeeds: data.specialNeeds,
        selfIntroduction: data.selfIntroduction,
      }

      await submit.mutateAsync({
        examId: data.examId,
        positionId: data.positionId,
        formVersion: 1,
        payload,
        attachments,
      })

      toast({
        title: "成功",
        description: "报名提交成功"
      })
      router.push('/candidate/applications')
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "提交失败，请重试",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addEducationBackground = () => {
    const current = form.getValues('educationBackgrounds')
    form.setValue('educationBackgrounds', [
      ...current,
      {
        school: '',
        major: '',
        level: 'BACHELOR',
        startDate: '',
        endDate: '',
        isCurrent: false,
        gpa: '',
      }
    ])
  }

  const removeEducationBackground = (index: number) => {
    const current = form.getValues('educationBackgrounds')
    if (current.length > 1) {
      form.setValue('educationBackgrounds', current.filter((_, i) => i !== index))
    }
  }

  const addWorkExperience = () => {
    const current = form.getValues('workExperiences') || []
    form.setValue('workExperiences', [
      ...current,
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      }
    ])
  }

  const removeWorkExperience = (index: number) => {
    const current = form.getValues('workExperiences') || []
    form.setValue('workExperiences', current.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">新建报名</h1>
              {draftId && (
                <div className="flex items-center gap-2 text-sm">
                  {isSaving ? (
                    <span className="text-muted-foreground">保存中...</span>
                  ) : lastSavedAt ? (
                    <span className="text-green-600">
                      已保存 {lastSavedAt.toLocaleTimeString('zh-CN')}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            {selectedExam && selectedPosition ? (
              <p className="text-muted-foreground mt-2">
                {selectedExam.title} - {selectedPosition.title}
              </p>
            ) : (
              <p className="text-muted-foreground mt-2">请填写完整的报名信息</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
        </div>
      </div>

        {/* Selected Exam and Position Info */}
        {selectedExam && selectedPosition && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">考试信息</h3>
                  <p className="text-sm text-gray-600">{selectedExam.title}</p>
                  <p className="text-xs text-gray-500">{selectedExam.description}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">报考岗位</h3>
                  <p className="text-sm text-gray-600">{selectedPosition.title}</p>
                  <p className="text-xs text-gray-500">{String((selectedPosition as any).department ?? '')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Form {...form}>
            {/* Exam Selection - Only show if not pre-selected */}
            {!selectedExam || !selectedPosition ? (
              <Card>
                <CardHeader>
                  <CardTitle>考试选择</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <FormField form={form} name="examId">
                  {({ value, onChange, error }) => (
                    <FormItem>
                      <FormLabel required>选择考试</FormLabel>
                      <FormControl>
                        <Select value={value} onChange={(e) => {
                          onChange(e.target.value)
                          form.setValue('positionId', '') // Reset position when exam changes
                        }} error={!!error}>
                          <option value="">请选择考试</option>
                          {examsOptions.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.title}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>

                <FormField form={form} name="positionId">
                  {({ value, onChange, error }) => (
                    <FormItem>
                      <FormLabel required>选择岗位</FormLabel>
                      <FormControl>
                        <Select value={value} onChange={(e) => onChange(e.target.value)} error={!!error} disabled={!watchedExamId}>
                          <option value="">请选择岗位</option>
                          {availablePositions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {(position.title || position.name || position.code || position.id)}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>
                </CardContent>
              </Card>
            ) : null}

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>个人信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField form={form} name="fullName">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>姓名</FormLabel>
                        <FormControl>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="请输入真实姓名"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="idNumber">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>身份证号码</FormLabel>
                        <FormControl>
                          <Input
                            id="idNumber"
                            name="idNumber"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="请输入18位身份证号码"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="phone">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>手机号码</FormLabel>
                        <FormControl>
                          <Input
                            id="phone"
                            name="phone"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="请输入11位手机号码"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="email">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>邮箱</FormLabel>
                        <FormControl>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="请输入邮箱地址"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="gender">
                    {({ value, onChange, error }) => (
                      <FormItem>
                        <FormLabel required>性别</FormLabel>
                        <FormControl>
                          <RadioGroup value={value} onValueChange={onChange} className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="MALE" id="male" />
                              <Label htmlFor="male">男</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="FEMALE" id="female" />
                              <Label htmlFor="female">女</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="birthDate">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>出生日期</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>
                </div>

                <FormField form={form} name="address">
                  {({ value, onChange, onBlur, error }) => (
                    <FormItem>
                      <FormLabel required>地址</FormLabel>
                      <FormControl>
                        <Textarea
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          onBlur={onBlur}
                          error={!!error}
                          placeholder="请输入详细地址"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>紧急联系人</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField form={form} name="emergencyContactName">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>姓名</FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="紧急联系人姓名"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="emergencyContactPhone">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>手机号码</FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="紧急联系人手机号"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>

                  <FormField form={form} name="emergencyContactRelation">
                    {({ value, onChange, onBlur, error }) => (
                      <FormItem>
                        <FormLabel required>关系</FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            error={!!error}
                            placeholder="如：父亲、母亲、配偶"
                          />
                        </FormControl>
                        <FormMessage>{error}</FormMessage>
                      </FormItem>
                    )}
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Education Background */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>教育背景</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEducationBackground}
                  >
                    添加教育经历
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.watch('educationBackgrounds').map((_, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">教育经历 {index + 1}</h4>
                      {form.watch('educationBackgrounds').length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEducationBackground(index)}
                        >
                          删除
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField form={form} name={`educationBackgrounds.${index}.school`}>
                        {({ value, onChange, onBlur, error }) => (
                          <FormItem>
                            <FormLabel required>学校名称</FormLabel>
                            <FormControl>
                              <Input
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                error={!!error}
                                placeholder="请输入学校名称"
                              />
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>

                      <FormField form={form} name={`educationBackgrounds.${index}.major`}>
                        {({ value, onChange, onBlur, error }) => (
                          <FormItem>
                            <FormLabel required>专业</FormLabel>
                            <FormControl>
                              <Input
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                error={!!error}
                                placeholder="请输入专业名称"
                              />
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>

                      <FormField form={form} name={`educationBackgrounds.${index}.level`}>
                        {({ value, onChange, error }) => (
                          <FormItem>
                            <FormLabel required>学历层次</FormLabel>
                            <FormControl>
                              <Select value={value} onChange={(e) => onChange(e.target.value)} error={!!error}>
                                {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>
                                    {label}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>

                      <FormField form={form} name={`educationBackgrounds.${index}.gpa`}>
                        {({ value, onChange, onBlur, error }) => (
                          <FormItem>
                            <FormLabel>GPA/成绩</FormLabel>
                            <FormControl>
                              <Input
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                error={!!error}
                                placeholder="如：3.8/4.0 或 85/100"
                              />
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>

                      <FormField form={form} name={`educationBackgrounds.${index}.startDate`}>
                        {({ value, onChange, onBlur, error }) => (
                          <FormItem>
                            <FormLabel required>开始时间</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                error={!!error}
                              />
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>

                      <FormField form={form} name={`educationBackgrounds.${index}.endDate`}>
                        {({ value, onChange, onBlur, error }) => (
                          <FormItem>
                            <FormLabel>结束时间</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                error={!!error}
                                disabled={form.watch(`educationBackgrounds.${index}.isCurrent`)}
                              />
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>
                    </div>

                    <FormField form={form} name={`educationBackgrounds.${index}.isCurrent`}>
                      {({ value, onChange }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox
                              id={`current-education-${index}`}
                              checked={value}
                              onChange={(e) => onChange(e.target.checked)}
                              label="目前在读"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    </FormField>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>工作经历</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addWorkExperience}
                  >
                    添加工作经历
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {(form.watch('workExperiences') || []).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    暂无工作经历，点击上方按钮添加
                  </p>
                ) : (
                  (form.watch('workExperiences') || []).map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">工作经历 {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorkExperience(index)}
                        >
                          删除
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField form={form} name={`workExperiences.${index}.company`}>
                          {({ value, onChange, onBlur, error }) => (
                            <FormItem>
                              <FormLabel required>公司名称</FormLabel>
                              <FormControl>
                                <Input
                                  value={value}
                                  onChange={(e) => onChange(e.target.value)}
                                  onBlur={onBlur}
                                  error={!!error}
                                  placeholder="请输入公司名称"
                                />
                              </FormControl>
                              <FormMessage>{error}</FormMessage>
                            </FormItem>
                          )}
                        </FormField>

                        <FormField form={form} name={`workExperiences.${index}.position`}>
                          {({ value, onChange, onBlur, error }) => (
                            <FormItem>
                              <FormLabel required>职位</FormLabel>
                              <FormControl>
                                <Input
                                  value={value}
                                  onChange={(e) => onChange(e.target.value)}
                                  onBlur={onBlur}
                                  error={!!error}
                                  placeholder="请输入职位名称"
                                />
                              </FormControl>
                              <FormMessage>{error}</FormMessage>
                            </FormItem>
                          )}
                        </FormField>

                        <FormField form={form} name={`workExperiences.${index}.startDate`}>
                          {({ value, onChange, onBlur, error }) => (
                            <FormItem>
                              <FormLabel required>开始时间</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={value}
                                  onChange={(e) => onChange(e.target.value)}
                                  onBlur={onBlur}
                                  error={!!error}
                                />
                              </FormControl>
                              <FormMessage>{error}</FormMessage>
                            </FormItem>
                          )}
                        </FormField>

                        <FormField form={form} name={`workExperiences.${index}.endDate`}>
                          {({ value, onChange, onBlur, error }) => (
                            <FormItem>
                              <FormLabel>结束时间</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={value}
                                  onChange={(e) => onChange(e.target.value)}
                                  onBlur={onBlur}
                                  error={!!error}
                                  disabled={form.watch(`workExperiences.${index}.isCurrent`)}
                                />
                              </FormControl>
                              <FormMessage>{error}</FormMessage>
                            </FormItem>
                          )}
                        </FormField>
                      </div>

                      <FormField form={form} name={`workExperiences.${index}.isCurrent`}>
                        {({ value, onChange }) => (
                          <FormItem>
                            <FormControl>
                              <Checkbox
                                id={`current-work-${index}`}
                                checked={value}
                                onChange={(e) => onChange(e.target.checked)}
                                label="目前在职"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      </FormField>

                      <FormField form={form} name={`workExperiences.${index}.description`}>
                        {({ value, onChange, onBlur, error }) => (
                          <FormItem>
                            <FormLabel>工作描述</FormLabel>
                            <FormControl>
                              <Textarea
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                error={!!error}
                                placeholder="请描述主要工作内容和职责"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage>{error}</FormMessage>
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>附件上传</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormFileUpload
                  form={form}
                  name="idCardFiles"
                  label="身份证照片"
                  description="请上传身份证正反面照片，确保信息清晰可见"
                  accept=".jpg,.jpeg,.png"
                  maxSize={5}
                  multiple={true}
                  required={true}
                  category="identity"
                />

                <FormFileUpload
                  form={form}
                  name="educationCertificateFiles"
                  label="学历证书"
                  description="请上传最高学历的毕业证书或学位证书"
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxSize={10}
                  multiple={true}
                  required={true}
                  category="education"
                />

                <FormFileUpload
                  form={form}
                  name="workCertificateFiles"
                  label="工作证明"
                  description="请上传工作证明、劳动合同或在职证明（可选）"
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxSize={10}
                  multiple={true}
                  required={false}
                  category="work"
                />

                <FormFileUpload
                  form={form}
                  name="otherFiles"
                  label="其他附件"
                  description="其他相关证明材料（可选）"
                  accept="*/*"
                  maxSize={10}
                  multiple={true}
                  required={false}
                  category="other"
                />
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>补充信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField form={form} name="specialNeeds">
                  {({ value, onChange, onBlur, error }) => (
                    <FormItem>
                      <FormLabel>特殊需求</FormLabel>
                      <FormControl>
                        <Textarea
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          onBlur={onBlur}
                          error={!!error}
                          placeholder="如有特殊考试需求（如无障碍设施等），请在此说明"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>

                <FormField form={form} name="selfIntroduction">
                  {({ value, onChange, onBlur, error }) => (
                    <FormItem>
                      <FormLabel>自我介绍</FormLabel>
                      <FormControl>
                        <Textarea
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          onBlur={onBlur}
                          error={!!error}
                          placeholder="请简要介绍您的个人情况、技能特长等（最多1000字）"
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>
              </CardContent>
            </Card>

            {/* Agreements */}
            <Card>
              <CardHeader>
                <CardTitle>协议确认</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField form={form} name="agreeToTerms">
                  {({ value, onChange, error }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          id="agreeToTerms"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          label="我已阅读并同意《服务条款》"
                        />
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>

                <FormField form={form} name="agreeToPrivacy">
                  {({ value, onChange, error }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          id="agreeToPrivacy"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          label="我已阅读并同意《隐私政策》"
                        />
                      </FormControl>
                      <FormMessage>{error}</FormMessage>
                    </FormItem>
                  )}
                </FormField>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? '提交中...' : '提交报名'}
              </Button>
            </div>
          </Form>
        </form>
      </div>
  )
}

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewApplicationForm />
    </Suspense>
  )
}

