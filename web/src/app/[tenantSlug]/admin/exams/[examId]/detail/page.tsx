'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGetWithTenant, apiPost } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { ArrowLeft, FileText, Users, ClipboardList, Building2, Settings, Send, MapPin, Award, UserCheck, ListChecks, Ticket } from 'lucide-react'
import ExamBasicInfo from '@/components/admin/exam-detail/ExamBasicInfo'
import ExamPositionsAndSubjects from '@/components/admin/exam-detail/ExamPositionsAndSubjects'
import ExamApplicationForm from '@/components/admin/exam-detail/ExamApplicationForm'
import ExamVenues from '@/components/admin/exam-detail/ExamVenues'
import ExamReviewRules from '@/components/admin/exam-detail/ExamReviewRules'
import ExamSeating from '@/components/admin/exam-detail/ExamSeating'
import ExamScores from '@/components/admin/exam-detail/ExamScores'
import ExamApplications from '@/components/admin/exam-detail/ExamApplications'
import ExamReviewers from '@/components/admin/exam-detail/ExamReviewers'
import ExamTickets from '@/components/admin/exam-detail/ExamTickets'
import ExamPublishDialog from '@/components/admin/exam-detail/ExamPublishDialog'
import { toast } from 'sonner'
import ExamStatusActions from '@/components/admin/exam-detail/ExamStatusActions'
import ExamStatusEditor from '@/components/admin/exam-detail/ExamStatusEditor'

interface Exam {
  id: string
  code: string
  title: string
  description: string
  status: string
  registrationStart?: string
  registrationEnd?: string
  examStart?: string
  examEnd?: string
}

export default function TenantExamDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const { tenant, isLoading: tenantLoading } = useTenant()

  // Support URL parameter ?tab=form to open specific tab
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Fetch exam with tenant context
  const { data: exam, isLoading: examLoading, error, refetch } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!tenant?.id && !!examId,
  })

  const isLoading = tenantLoading || examLoading

  const handlePublish = async () => {
    try {
      if (!tenant?.id) throw new Error('No tenant selected')
      await apiPost(`/exams/${examId}/open`, {}, { tenantId: tenant.id })
      await refetch()
      toast.success('考试发布成功！')
    } catch (error: any) {
      toast.error(error?.message || '发布失败')
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">加载考试信息失败</p>
        <Button onClick={() => router.push(`/${tenantSlug}/admin/exams`)}>返回考试列表</Button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">草稿</Badge>
      case 'OPEN':
        return <Badge variant="default" className="bg-green-600">开放报名</Badge>
      case 'CLOSED':
        return <Badge variant="secondary">报名关闭</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-blue-600">考试进行中</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary">已完成</Badge>
      default:
        return <Badge>{status}</Badge>
    }
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
              {getStatusBadge(exam.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              考试代码: {exam.code} | 租户: {tenant?.name}
            </p>
          </div>
        </div>


        <div className="flex items-center gap-2">
          {/* 主要的状态编辑器 - 更直观的按钮 */}
          {tenant?.id && (
            <ExamStatusEditor
              examId={examId}
              currentStatus={exam.status}
              tenantId={tenant.id}
              onStatusChange={refetch}
            />
          )}

          {/* 保留原有的下拉菜单作为快捷操作 */}
          {tenant?.id && (
            <ExamStatusActions
              examId={examId}
              currentStatus={exam.status}
              tenantId={tenant.id}
              onStatusChange={refetch}
            />
          )}

          {exam.status === 'DRAFT' && (
            <Button onClick={() => setPublishDialogOpen(true)} disabled={!tenant?.id}>
              <Send className="h-4 w-4 mr-2" />
              发布考试
            </Button>
          )}
          {exam.status === 'OPEN' && (
            <Button variant="outline" onClick={() => setPublishDialogOpen(true)} disabled={!tenant?.id}>
              <Send className="h-4 w-4 mr-2" />
              重新发布
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            岗位与科目
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            报名表单
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            报名考生
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            审核员
          </TabsTrigger>
          <TabsTrigger value="venues" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            考场管理
          </TabsTrigger>
          <TabsTrigger value="seating" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            座位分配
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            准考证
          </TabsTrigger>
          <TabsTrigger value="scores" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            成绩管理
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            审核规则
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <ExamBasicInfo exam={exam} examId={examId} />
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <ExamPositionsAndSubjects examId={examId} />
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <ExamApplicationForm examId={examId} />
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <ExamApplications examId={examId} />
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-6">
          <ExamReviewers examId={examId} />
        </TabsContent>

        <TabsContent value="venues" className="space-y-6">
          <ExamVenues examId={examId} />
        </TabsContent>

        <TabsContent value="seating" className="space-y-6">
          <ExamSeating examId={examId} />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <ExamTickets examId={examId} />
        </TabsContent>

        <TabsContent value="scores" className="space-y-6">
          <ExamScores examId={examId} />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <ExamReviewRules examId={examId} />
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <ExamPublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        examId={examId}
        examTitle={exam.title}
        examStatus={exam.status}
        onPublish={handlePublish}
      />
    </div>
  )
}

