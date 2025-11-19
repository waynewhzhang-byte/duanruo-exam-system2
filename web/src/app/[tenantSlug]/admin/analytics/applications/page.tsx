'use client'

import { use, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyApplications } from '@/lib/api-hooks'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, FileText, Clock, TrendingUp } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ApplicationsAnalyticsPageProps {
  params: Promise<{
    tenantSlug: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ApplicationsAnalyticsPage({ params }: ApplicationsAnalyticsPageProps) {
  use(params)
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  
  const { data: applicationsData, isLoading } = useMyApplications({
    page: 0,
    size: 1000,
  })

  const applications = applicationsData?.content || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // 根据时间范围过滤数据
  const filterByTimeRange = (apps: any[]) => {
    if (timeRange === 'all') return apps
    
    const now = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    return apps.filter((app: any) => {
      const appDate = new Date(app.submittedAt || app.createdAt)
      return appDate >= cutoffDate
    })
  }

  const filteredApplications = filterByTimeRange(applications)

  // 统计数据
  const totalApplications = filteredApplications.length
  const draftApplications = filteredApplications.filter((a: any) => a.status === 'DRAFT').length
  const submittedApplications = filteredApplications.filter((a: any) => a.status !== 'DRAFT').length
  const approvedApplications = filteredApplications.filter((a: any) => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length

  // 时间分布数据（按日期分组）
  const applicationsByDate = filteredApplications.reduce((acc: any, app: any) => {
    const date = new Date(app.submittedAt || app.createdAt).toLocaleDateString('zh-CN')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const timeDistributionData = Object.entries(applicationsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // 状态分布数据
  const statusDistribution = filteredApplications.reduce((acc: any, app: any) => {
    const status = app.status
    const statusName = getStatusName(status)
    acc[statusName] = (acc[statusName] || 0) + 1
    return acc
  }, {})

  const statusData = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }))

  // 按小时分布（提交时间）
  const hourDistribution = filteredApplications.reduce((acc: any, app: any) => {
    const hour = new Date(app.submittedAt || app.createdAt).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {})

  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    count: hourDistribution[i] || 0,
  }))

  // 按星期分布
  const weekdayDistribution = filteredApplications.reduce((acc: any, app: any) => {
    const weekday = new Date(app.submittedAt || app.createdAt).getDay()
    const weekdayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekday]
    acc[weekdayName] = (acc[weekdayName] || 0) + 1
    return acc
  }, {})

  const weekdayData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
    day,
    count: weekdayDistribution[day] || 0,
  }))

  function getStatusName(status: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: '草稿',
      SUBMITTED: '已提交',
      PENDING_PRIMARY_REVIEW: '待初审',
      PENDING_SECONDARY_REVIEW: '待复审',
      APPROVED: '已通过',
      REJECTED: '已拒绝',
      PAID: '已缴费',
      TICKET_ISSUED: '已发证',
      AUTO_PASSED: '自动通过',
      AUTO_REJECTED: '自动拒绝',
    }
    return statusMap[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">报名数据分析</h1>
          <p className="text-muted-foreground mt-2">
            全局报名数据统计与分析
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">最近7天</SelectItem>
            <SelectItem value="30d">最近30天</SelectItem>
            <SelectItem value="90d">最近90天</SelectItem>
            <SelectItem value="all">全部时间</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总报名数</p>
                <p className="text-2xl font-bold">{totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">草稿数</p>
                <p className="text-2xl font-bold text-gray-600">{draftApplications}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已提交</p>
                <p className="text-2xl font-bold text-blue-600">{submittedApplications}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已通过</p>
                <p className="text-2xl font-bold text-green-600">{approvedApplications}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据可视化 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 时间趋势 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>报名时间趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {timeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="报名数" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle>状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 按小时分布 */}
        <Card>
          <CardHeader>
            <CardTitle>按小时分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="报名数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 按星期分布 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>按星期分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="报名数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

