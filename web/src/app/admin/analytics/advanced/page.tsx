/**
 * Advanced Analytics Dashboard - Medium-term implementation
 * Charts, trends, and detailed analysis
 */

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import {
  ApplicationTrendsChart,
  RevenueChart,
  ExamPerformanceChart,
  PaymentMethodsChart,
  CandidateDemographicsChart
} from '@/components/analytics/Charts'
import {
  useApplicationTrends,
  usePaymentAnalytics,
  useExamStats,
  useCandidateAnalytics,
  DateRange
} from '@/lib/analytics-hooks'
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  Download,
  Filter,
  RefreshCw,
  Settings
} from 'lucide-react'

export default function AdvancedAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customStart, setCustomStart] = useState<string>()
  const [customEnd, setCustomEnd] = useState<string>()
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')

  // API hooks
  const {
    data: applicationTrends,
    isLoading: trendsLoading,
    refetch: refetchTrends
  } = useApplicationTrends({
    dateRange,
    granularity
  })

  const {
    data: paymentAnalytics,
    isLoading: paymentLoading,
    refetch: refetchPayment
  } = usePaymentAnalytics({ dateRange })

  const {
    data: examStats,
    isLoading: examLoading,
    refetch: refetchExam
  } = useExamStats({ dateRange })

  const {
    data: candidateAnalytics,
    isLoading: candidateLoading,
    refetch: refetchCandidate
  } = useCandidateAnalytics({ dateRange })

  const handleDateRangeChange = (range: DateRange, start?: string, end?: string) => {
    setDateRange(range)
    setCustomStart(start)
    setCustomEnd(end)
  }

  const handleRefreshAll = () => {
    refetchTrends()
    refetchPayment()
    refetchExam()
    refetchCandidate()
  }

  const handleExportData = () => {
    // TODO: Implement comprehensive data export
    console.log('Export advanced analytics data')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">高级数据分析</h1>
            <p className="text-gray-600">深度数据洞察与趋势分析</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">粒度:</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="day">按天</option>
                <option value="week">按周</option>
                <option value="month">按月</option>
              </select>
            </div>
            
            <Button variant="outline" onClick={handleRefreshAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </div>

        {/* Application Trends */}
        <ApplicationTrendsChart
          data={applicationTrends || []}
          loading={trendsLoading}
          height={400}
        />

        {/* Revenue and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart
            data={paymentAnalytics?.dailyRevenue || []}
            loading={paymentLoading}
            height={350}
          />
          
          <ExamPerformanceChart
            data={examStats || []}
            loading={examLoading}
            height={350}
          />
        </div>

        {/* Payment Methods and Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentMethodsChart
            data={paymentAnalytics?.paymentMethodStats || []}
            loading={paymentLoading}
            height={350}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                支付统计概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : paymentAnalytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ¥{paymentAnalytics.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">总收入</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        ¥{paymentAnalytics.averagePaymentAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-700">平均金额</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {paymentAnalytics.paymentMethodStats.map((method) => (
                      <div key={method.method} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{method.method}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">¥{method.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{method.count} 笔</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无支付数据</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Candidate Demographics */}
        <CandidateDemographicsChart
          educationData={candidateAnalytics?.candidatesByEducation || []}
          ageData={candidateAnalytics?.candidatesByAge || []}
          loading={candidateLoading}
          height={300}
        />

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                热门城市
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidateLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : candidateAnalytics?.topCities ? (
                <div className="space-y-3">
                  {candidateAnalytics.topCities.map((city, index) => (
                    <div key={city.city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{city.city}</span>
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        {city.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无城市数据</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                分析工具
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  自定义报表
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  趋势预测
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Filter className="h-4 w-4 mr-2" />
                  高级筛选
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  数据导出
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  用户分析
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>数据概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {candidateAnalytics?.totalCandidates.toLocaleString() || 0}
                </div>
                <div className="text-sm text-blue-700">总候选人</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {candidateAnalytics?.newCandidatesThisMonth.toLocaleString() || 0}
                </div>
                <div className="text-sm text-green-700">本月新增</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {examStats?.length || 0}
                </div>
                <div className="text-sm text-yellow-700">活跃考试</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {paymentAnalytics?.paymentMethodStats.reduce((sum, method) => sum + method.count, 0) || 0}
                </div>
                <div className="text-sm text-purple-700">总支付笔数</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
