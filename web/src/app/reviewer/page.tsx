'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/loading'
import { useMyReviewStats } from '@/lib/api-hooks'

function ReviewerQuickStats2() {
  // Note: useReviewQueue requires examId and stage, so we'll use mock data for now
  const loadingPending = false
  const pendingData = { totalElements: 0 }
  const { data: stats, isLoading: loadingStats } = useMyReviewStats()
  if (loadingPending || loadingStats) return <div className="py-4"><Spinner /></div>
  const pending = (pendingData as any)?.totalElements ?? 0
  const myAssigned = (stats as any)?.myAssigned ?? 0
  const todayDone = (stats as any)?.todayDone ?? 0
  const weekDone = (stats as any)?.weekDone ?? 0
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader><CardTitle>待审核</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{pending}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>我的占用</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{myAssigned}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>今日完成</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{todayDone}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>本周完成</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{weekDone}</div></CardContent>
      </Card>
    </div>
  )
}

export default function ReviewerDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审核工作台</h1>
          <p className="text-gray-600">管理您的审核任务和队列</p>
        </div>

        {/* Quick Stats */}
        <ReviewerQuickStats2 />

        {/* Current Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>我的当前任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">张三 - 软件工程师初级</h3>
                  <p className="text-sm text-gray-500">占用时间：2024-01-15 14:30 | 剩余：25分钟</p>
                  <p className="text-sm text-yellow-700">初审阶段 - 需要审核学历证明</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                    继续审核
                  </button>
                  <button className="text-gray-600 hover:text-gray-500 text-sm font-medium">
                    释放任务
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">李四 - 数据分析师中级</h3>
                  <p className="text-sm text-gray-500">占用时间：2024-01-15 15:00 | 剩余：55分钟</p>
                  <p className="text-sm text-blue-700">复审阶段 - 等待补充材料</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                    继续审核
                  </button>
                  <button className="text-gray-600 hover:text-gray-500 text-sm font-medium">
                    释放任务
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Queue */}
        <Card>
          <CardHeader>
            <CardTitle>待审核队列</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">王五 - 产品经理高级</h3>
                  <p className="text-sm text-gray-500">提交时间：2024-01-15 16:20</p>
                  <p className="text-sm text-gray-600">初审阶段 - 优先级：高</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    高优先级
                  </span>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                    开始审核
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">赵六 - UI设计师中级</h3>
                  <p className="text-sm text-gray-500">提交时间：2024-01-15 15:45</p>
                  <p className="text-sm text-gray-600">初审阶段 - 优先级：中</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    中优先级
                  </span>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                    开始审核
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">孙七 - 测试工程师初级</h3>
                  <p className="text-sm text-gray-500">提交时间：2024-01-15 14:30</p>
                  <p className="text-sm text-gray-600">复审阶段 - 优先级：低</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    低优先级
                  </span>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                    开始审核
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">🔄</span>
                </div>
                <h3 className="font-medium text-gray-900">刷新队列</h3>
                <p className="text-sm text-gray-500 mt-1">获取最新的审核任务</p>
              </button>

              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">📊</span>
                </div>
                <h3 className="font-medium text-gray-900">审核统计</h3>
                <p className="text-sm text-gray-500 mt-1">查看我的审核数据</p>
              </button>

              <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 text-lg">⚙️</span>
                </div>
                <h3 className="font-medium text-gray-900">审核设置</h3>
                <p className="text-sm text-gray-500 mt-1">配置审核偏好</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


