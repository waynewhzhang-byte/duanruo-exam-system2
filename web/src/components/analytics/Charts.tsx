/**
 * Chart components for analytics dashboard - Medium-term implementation
 * Using Recharts for data visualization
 */

'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/loading'

// Color palette for charts
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  pink: '#EC4899',
  gray: '#6B7280'
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.purple,
  COLORS.indigo,
  COLORS.pink,
  COLORS.gray
]

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Application trends line chart
interface ApplicationTrendsChartProps {
  data: Array<{
    date: string
    applications: number
    approvals: number
    rejections: number
    payments: number
  }>
  loading?: boolean
  height?: number
}

export function ApplicationTrendsChart({ data, loading, height = 300 }: ApplicationTrendsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>申请趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center" style={{ height }}>
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>申请趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="applications" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              name="申请数"
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="approvals" 
              stroke={COLORS.success} 
              strokeWidth={2}
              name="通过数"
              dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="rejections" 
              stroke={COLORS.danger} 
              strokeWidth={2}
              name="拒绝数"
              dot={{ fill: COLORS.danger, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="payments" 
              stroke={COLORS.warning} 
              strokeWidth={2}
              name="支付数"
              dot={{ fill: COLORS.warning, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Revenue area chart
interface RevenueChartProps {
  data: Array<{
    date: string
    amount: number
  }>
  loading?: boolean
  height?: number
}

export function RevenueChart({ data, loading, height = 300 }: RevenueChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>收入趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center" style={{ height }}>
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>收入趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              content={<CustomTooltip />}
              formatter={(value: number) => [`¥${value.toLocaleString()}`, '收入']}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke={COLORS.success} 
              fill={COLORS.success}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Exam performance bar chart
interface ExamPerformanceChartProps {
  data: Array<{
    examTitle: string
    totalApplications: number
    approvedApplications: number
    rejectedApplications: number
  }>
  loading?: boolean
  height?: number
}

export function ExamPerformanceChart({ data, loading, height = 300 }: ExamPerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>考试表现对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center" style={{ height }}>
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>考试表现对比</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="examTitle" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="totalApplications" fill={COLORS.primary} name="总申请" />
            <Bar dataKey="approvedApplications" fill={COLORS.success} name="已通过" />
            <Bar dataKey="rejectedApplications" fill={COLORS.danger} name="已拒绝" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Payment methods pie chart
interface PaymentMethodsChartProps {
  data: Array<{
    method: string
    count: number
    amount: number
  }>
  loading?: boolean
  height?: number
}

export function PaymentMethodsChart({ data, loading, height = 300 }: PaymentMethodsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>支付方式分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center" style={{ height }}>
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const pieData = data.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>支付方式分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.method} ${(entry.percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [value.toLocaleString(), '数量']}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Candidate demographics chart
interface CandidateDemographicsChartProps {
  educationData: Array<{
    education: string
    count: number
  }>
  ageData: Array<{
    ageRange: string
    count: number
  }>
  loading?: boolean
  height?: number
}

export function CandidateDemographicsChart({ 
  educationData, 
  ageData, 
  loading, 
  height = 300 
}: CandidateDemographicsChartProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>学历分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center" style={{ height }}>
              <Spinner size="lg" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>年龄分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center" style={{ height }}>
              <Spinner size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>学历分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={educationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="education" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>年龄分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="ageRange" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

