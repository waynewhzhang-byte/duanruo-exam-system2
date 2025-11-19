/**
 * Admin Analytics Dashboard - Short-term implementation
 * Basic statistics and overview metrics
 */

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  StatCard,
  TotalExamsCard,
  TotalApplicationsCard,
  PendingReviewsCard,
  TotalRevenueCard,
  ActiveUsersCard,
  SystemUptimeCard
} from '@/components/analytics/StatCard'
import { DateRangePicker, QuickDateRange } from '@/components/analytics/DateRangePicker'
import { 
  useOverviewStats,
  useExamStats,
  useApplicationTrends,
  useReviewerPerformance,
  DateRange
} from '@/lib/analytics-hooks'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  DollarSign,
  Download,
  RefreshCw,
  Filter,
  Activity,
  PieChart,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/loading'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customStart, setCustomStart] = useState<string>()
  const [customEnd, setCustomEnd] = useState<string>()

  // API hooks
  const { data: overviewStats, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useOverviewStats()
  const { data: examStats, isLoading: examStatsLoading } = useExamStats({ dateRange })
  const { data: applicationTrends, isLoading: trendsLoading } = useApplicationTrends({ dateRange })
  const { data: reviewerPerformance, isLoading: reviewerLoading } = useReviewerPerformance({ dateRange })

  const handleDateRangeChange = (range: DateRange, start?: string, end?: string) => {
    setDateRange(range)
    setCustomStart(start)
    setCustomEnd(end)
  }

  const handleRefresh = () => {
    refetchOverview()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export analytics data')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
            <p className="text-gray-600">系统运营数据概览与分析</p>
          </div>

          <div className="flex items-center space-x-3">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </div>

        {/* 分析模块导航 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/analytics" className="block">
            <Card className="border-2 border-primary-200 bg-primary-50 hover:border-primary-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-6 h-6 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">基础分析</h3>
                    </div>
                    <p className="text-sm text-gray-600">核心指标统计和概览</p>
                  </div>
                  <div className="text-primary-600 font-medium">当前页面</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics/advanced" className="block">
            <Card className="hover:border-gray-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <PieChart className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">高级分析</h3>
                    </div>
                    <p className="text-sm text-gray-600">图表分析和趋势洞察</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics/realtime" className="block">
            <Card className="hover:border-gray-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-6 h-6 text-green-600" />
                      <h3 className="font-semibold text-gray-900">实时监控</h3>
                    </div>
                    <p className="text-sm text-gray-600">实时数据和系统监控</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <TotalExamsCard
            value={overviewStats?.totalExams}
            loading={overviewLoading}
            error={!!overviewError}
            trend={{
              value: 12,
              label: '较上月',
              direction: 'up'
            }}
          />
          
          <TotalApplicationsCard
            value={overviewStats?.totalApplications}
            loading={overviewLoading}
            error={!!overviewError}
            trend={{
              value: 8,
              label: '较上月',
              direction: 'up'
            }}
          />
          
          <PendingReviewsCard
            value={overviewStats?.pendingReviews}
            loading={overviewLoading}
            error={!!overviewError}
            trend={{
              value: -5,
              label: '较昨日',
              direction: 'down'
            }}
          />
          
          <TotalRevenueCard
            value={overviewStats?.totalRevenue}
            loading={overviewLoading}
            error={!!overviewError}
            trend={{
              value: 15,
              label: '较上月',
              direction: 'up'
            }}
          />
          
          <ActiveUsersCard
            value={overviewStats?.totalCandidates}
            loading={overviewLoading}
            error={!!overviewError}
            trend={{
              value: 3,
              label: '较上周',
              direction: 'up'
            }}
          />
          
          <SystemUptimeCard
            value={99.95}
            loading={false}
            error={false}
            trend={{
              value: 0.1,
              label: '较上月',
              direction: 'up'
            }}
          />
        </div>

        {/* Quick Date Range Selector */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                时间范围筛选
              </CardTitle>
              <QuickDateRange
                value={dateRange}
                onChange={(range) => handleDateRangeChange(range)}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Exam Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              考试表现统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examStatsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : examStats && examStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">考试名称</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">总申请</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">已通过</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">已拒绝</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">待审核</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">转化率</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">收入</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examStats.map((exam) => (
                      <tr key={exam.examId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{exam.examTitle}</div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900">
                          {exam.totalApplications.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-green-600">
                          {exam.approvedApplications.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-red-600">
                          {exam.rejectedApplications.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-yellow-600">
                          {exam.pendingApplications.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            exam.conversionRate >= 70 
                              ? 'bg-green-100 text-green-800'
                              : exam.conversionRate >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {exam.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900">
                          ¥{exam.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无考试数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviewer Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              审核员表现
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewerLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : reviewerPerformance && reviewerPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewerPerformance.map((reviewer) => (
                  <Card key={reviewer.reviewerId} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{reviewer.reviewerName}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          reviewer.workload <= 5 
                            ? 'bg-green-100 text-green-800'
                            : reviewer.workload <= 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reviewer.workload} 待审核
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">总审核数:</span>
                          <span className="font-medium">{reviewer.totalReviews}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">平均用时:</span>
                          <span className="font-medium">{reviewer.averageReviewTime.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">通过率:</span>
                          <span className="font-medium">{reviewer.approvalRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无审核员数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                关键指标趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">日均申请量</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {overviewStats ? Math.round(overviewStats.totalApplications / 30) : 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">日均收入</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    ¥{overviewStats ? Math.round(overviewStats.totalRevenue / 30).toLocaleString() : 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-900">平均处理时间</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">2.3h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  查看详细报表
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  审核员管理
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  考试管理
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

