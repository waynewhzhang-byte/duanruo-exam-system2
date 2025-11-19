'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 考试列表页面
 * 显示所有开放报名的考试
 */
export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载考试列表
    const loadExams = async () => {
      try {
        // TODO: 调用 API 获取考试列表
        // const response = await fetch('/api/v1/exams/public');
        // const data = await response.json();
        
        // 模拟数据
        const mockExams = [
          {
            id: '1',
            name: '2025年春季招聘考试',
            code: 'EXAM-2025-SPRING',
            type: '招聘考试',
            registrationStart: '2025-11-01 09:00:00',
            registrationEnd: '2025-11-30 18:00:00',
            examStart: '2025-12-15 09:00:00',
            examEnd: '2025-12-15 11:00:00',
            fee: 100.00,
            status: '报名中',
            description: '面向社会公开招聘优秀人才',
            positions: [
              { id: '1', name: 'Java开发工程师', count: 10 },
              { id: '2', name: '前端开发工程师', count: 5 }
            ]
          }
        ];
        
        setExams(mockExams);
      } catch (error) {
        console.error('加载考试列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

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
                      <h2 className="text-2xl font-semibold mb-2">{exam.name}</h2>
                      <p className="text-gray-600">{exam.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {exam.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">考试类型</p>
                      <p className="font-semibold">{exam.type}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">报名时间</p>
                      <p className="font-semibold text-sm">
                        {exam.registrationStart} 至<br />
                        {exam.registrationEnd}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">考试费用</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {exam.fee > 0 ? `¥${exam.fee}` : '免费'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">招聘岗位</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {exam.positions.map((position: any) => (
                        <span
                          key={position.id}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {position.name} ({position.count}人)
                        </span>
                      ))}
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

