'use client'

import { use } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePosition, usePositionApplications } from '@/lib/api-hooks'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, CheckCircle, XCircle, TrendingUp, Award, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PositionAnalyticsPageProps {
  params: Promise<{
    tenantSlug: string
    positionId: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function PositionAnalyticsPage({ params }: PositionAnalyticsPageProps) {
  const { positionId } = use(params)
  
  const { data: position, isLoading: positionLoading } = usePosition(positionId)
  const { data: applicationsData, isLoading: applicationsLoading } = usePositionApplications(positionId, {
    page: 0,
    size: 1000,
  })

  const applications = (applicationsData as any)?.content || []

  if (positionLoading || applicationsLoading) {
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

  // 统计数据
  const totalApplications = applications.length
  const approvedApplications = applications.filter((a: any) => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length
  const rejectedApplications = applications.filter((a: any) => a.status === 'REJECTED' || a.status === 'AUTO_REJECTED').length
  const pendingApplications = applications.filter((a: any) => a.status === 'SUBMITTED' || a.status === 'PENDING_PRIMARY_REVIEW' || a.status === 'PENDING_SECONDARY_REVIEW').length

  const maxApplicants = (position as any)?.maxApplicants || 0
  const competitionRatio = maxApplicants > 0 ? (totalApplications / maxApplicants).toFixed(2) : '0'
  const approvalRate = totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(1) : '0'
  const rejectionRate = totalApplications > 0 ? ((rejectedApplications / totalApplications) * 100).toFixed(1) : '0'

  // 审核状态分布
  const statusDistribution = [
    { name: '已通过', value: approvedApplications, color: '#00C49F' },
    { name: '已拒绝', value: rejectedApplications, color: '#FF8042' },
    { name: '待审核', value: pendingApplications, color: '#FFBB28' },
    { name: '草稿', value: applications.filter((a: any) => a.status === 'DRAFT').length, color: '#8884D8' },
  ].filter(item => item.value > 0)

  // 性别分布
  const genderDistribution = applications.reduce((acc: any, app: any) => {
    const gender = (app as any).gender || '未知'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {})

  const genderData = Object.entries(genderDistribution).map(([name, value]) => ({ name, value }))

  // 学历分布
  const educationDistribution = applications.reduce((acc: any, app: any) => {
    const education = (app as any).educationLevel || '未知'
    acc[education] = (acc[education] || 0) + 1
    return acc
  }, {})

  const educationData = Object.entries(educationDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)

  // 年龄分布
  const ageDistribution = applications.reduce((acc: any, app: any) => {
    const birthDate = (app as any).birthDate
    if (birthDate) {
      const age = new Date().getFullYear() - new Date(birthDate).getFullYear()
      const ageGroup = age < 25 ? '25岁以下' : age < 30 ? '25-30岁' : age < 35 ? '30-35岁' : age < 40 ? '35-40岁' : '40岁以上'
      acc[ageGroup] = (acc[ageGroup] || 0) + 1
    }
    return acc
  }, {})

  const ageData = Object.entries(ageDistribution).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">岗位数据分析</h1>
        <p className="text-muted-foreground mt-2">
          {(position as any)?.title || (position as any)?.name} - 报名情况分析
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总报名数</p>
                <p className="text-2xl font-bold">{totalApplications}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  招录人数: {maxApplicants || '不限'}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">竞争比例</p>
                <p className="text-2xl font-bold">{competitionRatio}:1</p>
                <Badge variant={parseFloat(competitionRatio) > 10 ? 'destructive' : 'default'} className="mt-1">
                  {parseFloat(competitionRatio) > 10 ? '竞争激烈' : '竞争适中'}
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">审核通过率</p>
                <p className="text-2xl font-bold text-green-600">{approvalRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {approvedApplications} / {totalApplications}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">审核拒绝率</p>
                <p className="text-2xl font-bold text-red-600">{rejectionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rejectedApplications} / {totalApplications}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据可视化 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 审核状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle>审核状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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

        {/* 性别分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              性别分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
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

        {/* 学历分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              学历分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {educationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={educationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="人数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 年龄分布 */}
        <Card>
          <CardHeader>
            <CardTitle>年龄分布</CardTitle>
          </CardHeader>
          <CardContent>
            {ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="人数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

