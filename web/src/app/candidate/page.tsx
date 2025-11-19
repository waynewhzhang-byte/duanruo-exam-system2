'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyApplications } from '@/lib/api-hooks'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  Upload,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

export default function CandidateDashboard() {
  const router = useRouter()
  const { user } = useAuth()

  const quickActions = [
    {
      icon: FileText,
      title: '新建报名',
      description: '开始新的考试报名',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      href: '/candidate/exams'
    },
    {
      icon: Upload,
      title: '上传文件',
      description: '上传证明材料',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      href: '/candidate/files'
    },
    {
      icon: Ticket,
      title: '准考证',
      description: '查看和下载准考证',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      href: '/candidate/tickets'
    },
    {
      icon: TrendingUp,
      title: '进度查询',
      description: '查看审核进度',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      href: '/candidate/applications'
    }
  ]

  return (
    <div data-testid="candidate-dashboard" className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">欢迎回来，{user?.fullName || '考生'}</h1>
        <p className="text-muted-foreground mt-2">
          管理您的考试报名和进度
        </p>
      </div>

      {/* Quick Stats */}
      <CandidateQuickStats />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>选择您要执行的操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className="group p-4 text-left border rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <CandidateRecentApplications />
    </div>
  )
}


function CandidateQuickStats() {
  const { data, isLoading } = useMyApplications({ page: 0, size: 100 })
  const list = data?.content || []
  const inProgress = list.filter(a => a.status === 'DRAFT' || a.status === 'SUBMITTED').length
  const approved = list.filter(a => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length
  const pending = list.filter(a => a.status === 'PENDING_PRIMARY_REVIEW' || a.status === 'PENDING_SECONDARY_REVIEW').length

  const stats = [
    {
      icon: Clock,
      title: '进行中的报名',
      value: inProgress,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: CheckCircle2,
      title: '已通过审核',
      value: approved,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: AlertCircle,
      title: '待审核',
      value: pending,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CandidateRecentApplications() {
  const router = useRouter()
  const { data, isLoading } = useMyApplications({ page: 0, size: 5 })
  const list = data?.content || []

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      SUBMITTED: { label: '已提交', variant: 'default' },
      PENDING_PRIMARY_REVIEW: { label: '待初审', variant: 'outline' },
      PENDING_SECONDARY_REVIEW: { label: '待复审', variant: 'outline' },
      APPROVED: { label: '已通过', variant: 'default' },
      REJECTED: { label: '已拒绝', variant: 'destructive' },
      PAID: { label: '已缴费', variant: 'default' },
      TICKET_ISSUED: { label: '已发证', variant: 'default' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近的报名</CardTitle>
          <CardDescription>查看您最近的报名记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近的报名</CardTitle>
          <CardDescription>查看您最近的报名记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无报名记录</h3>
            <p className="text-sm text-muted-foreground mb-4">开始您的第一次考试报名吧</p>
            <Button onClick={() => router.push('/candidate/exams')}>
              浏览考试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>最近的报名</CardTitle>
            <CardDescription>查看您最近的报名记录</CardDescription>
          </div>
          <Button variant="ghost" onClick={() => router.push('/candidate/applications')}>
            查看全部
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {list.map((application) => (
            <div
              key={application.id}
              onClick={() => router.push(`/candidate/applications/${application.id}`)}
              className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {application.examTitle || application.examId} - {application.positionTitle || application.positionId}
                </h3>
                <p className="text-sm text-muted-foreground">
                  提交时间：{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('zh-CN') : '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(application.status)}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
