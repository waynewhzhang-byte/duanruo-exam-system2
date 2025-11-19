'use client'

import { useTenant } from '@/contexts/TenantContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Award,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function CandidateDashboard() {
  const { tenant, isLoading, error } = useTenant()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">考试不存在</h2>
          <p className="text-gray-600 mb-4">您访问的考试不存在或已被删除</p>
          <Link href="/tenants" className="btn btn-primary">
            返回考试列表
          </Link>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: '考试报名',
      description: '查看可报名的考试和岗位',
      icon: <BookOpen className="h-6 w-6" />,
      href: `/${tenant.slug}/candidate/exams`,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: '我的报名',
      description: '查看报名记录和审核状态',
      icon: <FileText className="h-6 w-6" />,
      href: `/${tenant.slug}/candidate/applications`,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: '准考证',
      description: '下载和打印准考证',
      icon: <Award className="h-6 w-6" />,
      href: `/${tenant.slug}/candidate/tickets`,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: '成绩查询',
      description: '查看考试成绩和排名',
      icon: <CheckCircle className="h-6 w-6" />,
      href: `/${tenant.slug}/candidate/scores`,
      color: 'bg-orange-100 text-orange-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">端</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
                  <p className="text-sm text-gray-600">候选人工作台</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/tenants" className="text-sm text-gray-600 hover:text-gray-900">
                切换考试
              </Link>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                退出登录
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tenant Info */}
        {tenant.description && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">考试说明</h3>
                <p className="text-sm text-blue-800">{tenant.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近动态</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900">欢迎来到 {tenant.name}</p>
                <p className="text-xs text-gray-600 mt-1">请选择上方的快捷操作开始使用</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">需要帮助？</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">报名流程</h3>
              <p className="text-xs text-gray-600">了解如何完成报名</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">常见问题</h3>
              <p className="text-xs text-gray-600">查看常见问题解答</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">联系我们</h3>
              <p className="text-xs text-gray-600">获取技术支持</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

