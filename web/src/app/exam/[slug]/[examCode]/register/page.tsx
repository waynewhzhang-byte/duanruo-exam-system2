'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeftIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiGetPublic, apiPost } from '@/lib/api'
import { buildPublicExamPath } from '@/lib/public-exams'
import { ApplicationResponse, PositionResponse, PublishedExamResponse } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const registrationSchema = z.object({
  positionId: z.string().min(1, '请选择报考岗位'),
  fullName: z.string().min(1, '请输入姓名'),
  email: z.string().email('请输入有效的邮箱地址'),
  phoneNumber: z.string().min(1, '请输入手机号码'),
  idNumber: z.string().min(1, '请输入身份证号码'),
  education: z.string().min(1, '请选择学历'),
  workExperience: z.string().optional(),
  selfIntroduction: z.string().optional(),
  agreeTerms: z.boolean().refine((value) => value === true, '请同意报名条款'),
})

type RegistrationForm = z.infer<typeof registrationSchema>
type PublicExam = z.infer<typeof PublishedExamResponse>
type PublicPosition = z.infer<typeof PositionResponse>
type ApplicationResult = z.infer<typeof ApplicationResponse>

export default function PublicExamRegisterPage() {
  const params = useParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const tenantCode = params.slug as string
  const examCode = params.examCode as string
  const preSelectedPosition = searchParams.get('position')
  const examPath = useMemo(
    () => buildPublicExamPath(tenantCode, examCode),
    [tenantCode, examCode],
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading || isAuthenticated) return
    const redirectTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`)
  }, [authLoading, isAuthenticated, pathname, router, searchParams])

  const { data: exam, isLoading: examLoading, error: examError } = useQuery({
    queryKey: ['public-exam', tenantCode, examCode],
    queryFn: () =>
      apiGetPublic<PublicExam>(
        `/public/exams/tenant/${tenantCode}/code/${examCode}`,
        { schema: PublishedExamResponse },
      ),
    retry: false,
  })

  const { data: positions } = useQuery({
    queryKey: ['public-exam-positions', tenantCode, examCode],
    queryFn: () =>
      apiGetPublic<PublicPosition[]>(
        `/public/exams/tenant/${tenantCode}/code/${examCode}/positions`,
        { schema: z.array(PositionResponse) },
      ),
    enabled: !!exam,
    retry: false,
  })

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      positionId: preSelectedPosition || '',
      fullName: '',
      email: '',
      phoneNumber: '',
      idNumber: '',
      education: '',
      workExperience: '',
      selfIntroduction: '',
      agreeTerms: false,
    },
  })

  const isRegistrationOpen = useMemo(() => {
    if (!exam?.registrationStart || !exam?.registrationEnd) return false
    const now = new Date()
    return (
      now >= new Date(exam.registrationStart) &&
      now <= new Date(exam.registrationEnd)
    )
  }, [exam])

  const onSubmit = async (data: RegistrationForm) => {
    if (!exam?.tenantId || !exam.examId) return

    setIsSubmitting(true)
    try {
      const application = await apiPost<ApplicationResult>(
        '/applications',
        {
          examId: exam.examId,
          positionId: data.positionId,
          formVersion: 1,
          payload: {
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            idNumber: data.idNumber,
            education: data.education,
            workExperience: data.workExperience,
            selfIntroduction: data.selfIntroduction,
          },
        },
        {
          schema: ApplicationResponse,
          headers: {
            'X-Tenant-ID': exam.tenantId,
            'X-Tenant-Slug': exam.tenantCode || tenantCode,
          },
        },
      )

      router.push(`/${tenantCode}/candidate/applications/${application.id}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '报名提交失败，请稍后重试'
      form.setError('root', { message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">正在跳转登录...</p>
        </div>
      </div>
    )
  }

  if (examLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">加载报名信息中...</p>
        </div>
      </div>
    )
  }

  if (examError || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">考试不存在</h1>
          <p className="mb-8 text-gray-600">抱歉，您访问的考试页面不存在或已下线。</p>
          <Link href="/exams">
            <Button>返回考试列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!isRegistrationOpen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">报名未开放</h1>
          <p className="mb-8 text-gray-600">当前考试不在报名时间窗口内。</p>
          <Link href={examPath}>
            <Button>返回考试详情</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href={examPath} className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                返回考试详情
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">报名申请</h1>
              <p className="text-gray-600">{exam.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>报名信息</CardTitle>
            <CardDescription>请填写本次考试的基本报名信息。</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.root?.message && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="positionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>报考岗位 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择报考岗位" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions?.map((position) => (
                            <SelectItem key={position.id} value={position.id || ''}>
                              {position.name || position.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>姓名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入真实姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>邮箱地址 *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="请输入邮箱地址" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>手机号码 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入手机号码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>身份证号码 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入身份证号码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学历 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择学历" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HIGH_SCHOOL">高中</SelectItem>
                          <SelectItem value="COLLEGE">大专</SelectItem>
                          <SelectItem value="BACHELOR">本科</SelectItem>
                          <SelectItem value="MASTER">硕士</SelectItem>
                          <SelectItem value="DOCTOR">博士</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>工作经历</FormLabel>
                      <FormControl>
                        <Textarea placeholder="请输入工作经历" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selfIntroduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>自我介绍</FormLabel>
                      <FormControl>
                        <Textarea placeholder="请输入自我介绍" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreeTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>我已阅读并同意报名条款 *</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : '提交报名'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
