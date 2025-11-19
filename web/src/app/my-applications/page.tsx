'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 我的报名页面
 * 显示考生的所有报名记录
 */
export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载报名列表
    const loadApplications = async () => {
      try {
        // TODO: 调用 API 获取报名列表
        // const response = await fetch('/api/v1/applications/my');
        // const data = await response.json();
        
        // 模拟数据
        const mockApplications = [
          {
            id: '1',
            registrationNo: 'REG-2025-001',
            examName: '2025年春季招聘考试',
            positionName: 'Java开发工程师',
            status: '待审核',
            reviewStatus: 'PENDING_PRIMARY_REVIEW',
            paymentStatus: 'UNPAID',
            submittedAt: '2025-10-28 10:30:00',
            fee: 100.00
          },
          {
            id: '2',
            registrationNo: 'REG-2025-002',
            examName: '2024年秋季招聘考试',
            positionName: '前端开发工程师',
            status: '已缴费',
            reviewStatus: 'APPROVED',
            paymentStatus: 'PAID',
            submittedAt: '2025-09-15 14:20:00',
            fee: 100.00,
            hasTicket: true
          }
        ];
        
        setApplications(mockApplications);
      } catch (error) {
        console.error('加载报名列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '待审核': 'bg-yellow-100 text-yellow-800',
      '审核通过': 'bg-green-100 text-green-800',
      '审核拒绝': 'bg-red-100 text-red-800',
      '待支付': 'bg-orange-100 text-orange-800',
      '已缴费': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">我的报名</h1>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">您还没有报名记录</p>
            <button
              onClick={() => router.push('/exams')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              浏览考试
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">{app.examName}</h2>
                      <p className="text-gray-600">{app.positionName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        报名号: {app.registrationNo}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">提交时间</p>
                      <p className="font-semibold">{app.submittedAt}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">审核状态</p>
                      <p className="font-semibold">
                        {app.reviewStatus === 'PENDING_PRIMARY_REVIEW' && '待一级审核'}
                        {app.reviewStatus === 'PENDING_SECONDARY_REVIEW' && '待二级审核'}
                        {app.reviewStatus === 'APPROVED' && '审核通过'}
                        {app.reviewStatus === 'REJECTED' && '审核拒绝'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">支付状态</p>
                      <p className="font-semibold">
                        {app.paymentStatus === 'UNPAID' && '未支付'}
                        {app.paymentStatus === 'PAID' && '已支付'}
                        {app.paymentStatus === 'REFUNDED' && '已退款'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/applications/${app.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      查看详情
                    </button>
                    
                    {app.reviewStatus === 'APPROVED' && app.paymentStatus === 'UNPAID' && (
                      <button
                        onClick={() => {
                          // 需要获取tenantSlug，这里先尝试从context或params获取
                          const tenantSlug = window.location.pathname.split('/')[1] || 'default'
                          router.push(`/${tenantSlug}/candidate/applications/${app.id}/payment`)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        立即支付
                      </button>
                    )}
                    
                    {app.hasTicket && (
                      <button
                        onClick={() => router.push(`/applications/${app.id}/ticket`)}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                      >
                        下载准考证
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

