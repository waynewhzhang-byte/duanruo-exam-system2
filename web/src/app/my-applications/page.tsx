'use client';

import { useRouter } from 'next/navigation';
import { useMyApplications } from '@/lib/api-hooks';

export default function MyApplicationsPage() {
  const router = useRouter();
  
  const { data, isLoading, error } = useMyApplications({});

  const applications = data?.content || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">加载报名列表失败，请稍后重试</p>
        </div>
      </div>
    );
  }

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

  if (isLoading) {
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
                      <h2 className="text-xl font-semibold mb-1">{app.examTitle || '考试详情'}</h2>
                      <p className="text-gray-600">{app.positionTitle || '岗位详情'}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        报名ID: {app.id.slice(0, 8)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">提交时间</p>
                      <p className="font-semibold">{app.submittedAt || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">费用</p>
                      <p className="font-semibold">
                        {app.feeRequired ? `¥${app.feeAmount || 0}` : '免费'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">状态</p>
                      <p className="font-semibold">{app.status}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/applications/${app.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      查看详情
                    </button>
                    
                    {app.feeRequired && (
                      <button
                        onClick={() => {
                          const tenantSlug = window.location.pathname.split('/')[1] || 'default'
                          router.push(`/${tenantSlug}/candidate/applications/${app.id}/payment`)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        立即支付
                      </button>
                    )}
                    
                    {app.status === 'TICKET_ISSUED' && (
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

