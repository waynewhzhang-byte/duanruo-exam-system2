'use client';

import { useRouter } from 'next/navigation';
import { useExams } from '@/lib/api-hooks';

export default function ExamsPage() {
  const router = useRouter();
  
  // 使用 React Query 获取考试列表
  const { data, isLoading, error } = useExams({
    status: 'OPEN',
  });

  const exams = data?.content || [];

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
          <p className="text-red-600">加载考试列表失败，请稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">浏览考试</h1>

        {exams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无开放报名的考试</p>
          </div>
        ) : (
          <div className="space-y-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">{exam.title}</h2>
                      <p className="text-gray-600">{exam.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {exam.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">考试类型</p>
                      <p className="font-semibold">招聘考试</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">报名时间</p>
                      <p className="font-semibold text-sm">
                        {exam.registrationStart ? new Date(exam.registrationStart).toLocaleDateString('zh-CN') : '待定'} 至<br />
                        {exam.registrationEnd ? new Date(exam.registrationEnd).toLocaleDateString('zh-CN') : '待定'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">考试费用</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {exam.feeRequired ? `¥${exam.feeAmount}` : '免费'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/exams/${exam.id}`)}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => router.push(`/exams/${exam.id}/register`)}
                      className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                    >
                      立即报名
                    </button>
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

