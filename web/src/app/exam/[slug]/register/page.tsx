'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeftIcon, UserIcon, MailIcon, PhoneIcon } from 'lucide-react'
import Link from 'next/link'
import { apiGetPublic } from '@/lib/api'
import { ExamResponse, PositionResponse } from '@/lib/schemas'

type ExamResponseType = z.infer<typeof ExamResponse>
type PositionResponseType = z.infer<typeof PositionResponse>

// 报名表单schema
const registrationSchema = z.object({
  positionId: z.string().min(1, '请选择报考岗位'),
  fullName: z.string().min(1, '请输入姓名'),
  email: z.string().email('请输入有效的邮箱地址'),
  phoneNumber: z.string().min(1, '请输入手机号码'),
  idNumber: z.string().min(1, '请输入身份证号码'),
  education: z.string().min(1, '请选择学历'),
  workExperience: z.string().optional(),
  selfIntroduction: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, '请同意报名条款')
})

type RegistrationForm = z.infer<typeof registrationSchema>

export default function RegisterPage() {
  const params = useParams()
  const slug = params.slug as string
  const searchParams = useSearchParams()
  const router = useRouter()
  const preSelectedPosition = searchParams.get('position')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取考试信息
  const { data: exam, isLoading: examLoading, error: examError } = useQuery({
    queryKey: ['public-exam', slug],
    queryFn: () => apiGetPublic<ExamResponseType>(`/public/exams/slug/${slug}`),
    retry: false
  })

  // 获取岗位列表
  const { data: positions } = useQuery({
    queryKey: ['public-exam-positions', slug],
    queryFn: () => apiGetPublic<PositionResponseType[]>(`/public/exams/slug/${slug}/positions`),
    enabled: !!exam,
    retry: false
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
      agreeTerms: false
    }
  })

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true)
    try {
      // TODO: 实现报名提交逻辑
      console.log('Registration data:', data)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 跳转到成功页面
      router.push(`/exam/${slug}/register/success`)
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (examLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载报名信息中...</p>
        </div>
      </div>
    )
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">考试不存在</h1>
          <p className="text-gray-600 mb-8">抱歉，您访问的考试页面不存在或已被删除。</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isRegistrationOpen = () => {
    if (!exam.registrationStart || !exam.registrationEnd) return false
    const now = new Date()
    const start = new Date(exam.registrationStart)
    const end = new Date(exam.registrationEnd)
    return now >= start && now <= end
  }

  if (!isRegistrationOpen()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">报名已结束</h1>
          <p className="text-gray-600 mb-8">抱歉，该考试的报名时间已结束。</p>
          <Link href={`/exam/${slug}`}>
            <Button>返回考试详情</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link href={`/exam/${slug}`} className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 报名表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>报名信息</CardTitle>
                <CardDescription>
                  请如实填写以下信息，所有标记为必填的字段都需要完成。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 岗位选择 */}
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

                    {/* 基本信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>姓名 *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="请输入真实姓名"
                                {...field}
                              />
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
                              <Input
                                type="email"
                                placeholder="请输入邮箱地址"
                                {...field}
                              />
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
                              <Input
                                placeholder="请输入手机号码"
                                {...field}
                              />
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
                              <Input
                                placeholder="请输入身份证号码"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 学历 */}
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
                              <SelectItem value="高中">高中</SelectItem>
                              <SelectItem value="大专">大专</SelectItem>
                              <SelectItem value="本科">本科</SelectItem>
                              <SelectItem value="硕士">硕士</SelectItem>
                              <SelectItem value="博士">博士</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 工作经验 */}
                    <FormField
                      control={form.control}
                      name="workExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>工作经验</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="请简要描述您的工作经验（选填）"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 自我介绍 */}
                    <FormField
                      control={form.control}
                      name="selfIntroduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>自我介绍</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="请简要介绍自己（选填）"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 同意条款 */}
                    <FormField
                      control={form.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              我已阅读并同意 <Link href="#" className="text-blue-600 hover:underline">报名条款</Link> 和 <Link href="#" className="text-blue-600 hover:underline">隐私政策</Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? '提交中...' : '提交报名申请'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏信息 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>考试信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">考试名称</p>
                  <p className="text-sm text-gray-600">{exam.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">考试代码</p>
                  <p className="text-sm text-gray-600">{exam.code}</p>
                </div>
                {exam.feeRequired && exam.feeAmount && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">报名费用</p>
                    <p className="text-lg font-semibold text-green-600">¥{exam.feeAmount}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>注意事项</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 请确保所填信息真实有效</li>
                  <li>• 提交后将无法修改报名信息</li>
                  <li>• 审核结果将通过邮件和短信通知</li>
                  <li>• 如有疑问请及时联系考试组织方</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
