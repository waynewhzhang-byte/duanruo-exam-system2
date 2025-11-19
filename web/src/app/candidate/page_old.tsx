'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/loading'
import { useMyApplications } from '@/lib/api-hooks'

export default function CandidateDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来</h1>
          <p className="text-gray-600">管理您的考试报名和进度</p>
        </div>

        {/* Quick Stats */}
        <CandidateQuickStats />

        {/* Recent Applications */}
        <CandidateRecentApplications />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">➕</span>
                </div>
                <h3 className="font-medium text-gray-900">新建报名</h3>
                <p className="text-sm text-gray-500 mt-1">开始新的考试报名</p>
              </button>

              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">📁</span>
                </div>
                <h3 className="font-medium text-gray-900">上传文件</h3>
                <p className="text-sm text-gray-500 mt-1">上传证明材料</p>
              </button>

              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">🎫</span>
                </div>
                <h3 className="font-medium text-gray-900">准考证</h3>
                <p className="text-sm text-gray-500 mt-1">查看和下载准考证</p>
              </button>

              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">📊</span>
                </div>
                <h3 className="font-medium text-gray-900">进度查询</h3>
                <p className="text-sm text-gray-500 mt-1">查看审核进度</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


function CandidateQuickStats() {
  const { data, isLoading } = useMyApplications({ page: 0, size: 100 })
  const list = data?.content || []
  const inProgress = list.filter(a => a.status === 'DRAFT' || a.status === 'SUBMITTED').length
  const approved = list.filter(a => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length
  const pending = list.filter(a => a.status === 'PENDING_PRIMARY_REVIEW' || a.status === 'PENDING_SECONDARY_REVIEW').length

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary-600 text-lg">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">进行中的报名</p>
              <p className="text-2xl font-semibold text-gray-900">{inProgress}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
              <span className="text-success-600 text-lg">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已通过审核</p>
              <p className="text-2xl font-semibold text-gray-900">{approved}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
              <span className="text-warning-600 text-lg">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">待审核</p>
              <p className="text-2xl font-semibold text-gray-900">{pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CandidateRecentApplications() {
  const { data, isLoading } = useMyApplications({ page: 0, size: 5 })
  const list = data?.content || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近的报名</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="p-6 text-center text-gray-500">暂无报名</div>
        ) : (
          <div className="space-y-4">
            {list.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{a.examTitle || a.examId} - {a.positionTitle || a.positionId}</h3>
                  <p className="text-sm text-gray-500">提交时间：{a.submittedAt || '-'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

