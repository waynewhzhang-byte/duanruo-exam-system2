'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useExams } from '@/lib/api-hooks'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Settings
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  trend?: string
  color: 'blue' | 'green' | 'yellow' | 'purple'
}

function StatCard({ title, value, description, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    yellow: 'bg-yellow-500/10 text-yellow-600',
    purple: 'bg-purple-500/10 text-purple-600',
  }

  return (
    <Card className="exam-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {trend && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data: examsData, isLoading, error } = useExams({ page: 0, size: 1000 })
  const err = useErrorHandler()

  // Avoid triggering state updates during render
  useEffect(() => {
    if (error) err.handleError(error)
  }, [error, err])

  const total = examsData?.totalElements || 0
  const registrationOpen = examsData?.content?.filter(e => ['REGISTRATION_OPEN','OPEN'].includes((e as any).status)).length || 0
  const active = examsData?.content?.filter(e => !['COMPLETED','CANCELLED','REGISTRATION_CLOSED','CLOSED'].includes((e as any).status)).length || 0
  const drafts = examsData?.content?.filter(e => (e as any).status === 'DRAFT').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统管理后台</h1>
          <p className="text-muted-foreground mt-2">
            欢迎使用端若考试报名管理系统，这里是系统概览和快速操作入口
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/tenants">
              <Settings className="h-4 w-4 mr-2" />
              租户管理
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              数据分析
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="总考试数"
            value={total}
            description="系统中的所有考试"
            icon={<FileText className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="报名中"
            value={registrationOpen}
            description="正在接受报名的考试"
            icon={<Clock className="h-6 w-6" />}
            color="green"
            trend="+12%"
          />
          <StatCard
            title="活跃考试"
            value={active}
            description="进行中的考试"
            icon={<CheckCircle className="h-6 w-6" />}
            color="yellow"
          />
          <StatCard
            title="草稿"
            value={drafts}
            description="待发布的考试"
            icon={<FileText className="h-6 w-6" />}
            color="purple"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/tenants">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  租户管理
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/users">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  用户管理
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/reviewer/queue">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  审核队列
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/settings">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  系统设置
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>系统最新动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">新考试创建</p>
                  <p className="text-xs text-muted-foreground">2024年公务员考试已创建</p>
                  <p className="text-xs text-muted-foreground mt-1">2分钟前</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">审核完成</p>
                  <p className="text-xs text-muted-foreground">15份申请已通过审核</p>
                  <p className="text-xs text-muted-foreground mt-1">10分钟前</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">系统更新</p>
                  <p className="text-xs text-muted-foreground">系统已更新到v1.2.0</p>
                  <p className="text-xs text-muted-foreground mt-1">1小时前</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
