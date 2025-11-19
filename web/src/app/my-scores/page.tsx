'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 我的成绩页面
 * 考生查看自己的考试成绩
 */
export default function MyScoresPage() {
  const router = useRouter();
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载成绩数据
    const loadScores = async () => {
      try {
        // TODO: 调用 API 获取成绩数据
        // const response = await fetch('/api/v1/scores/my-scores');
        // const data = await response.json();
        
        // 模拟数据
        const mockScores = [
          {
            id: '1',
            examName: '2024年春季招聘考试',
            positionName: 'Java开发工程师',
            examDate: '2024-03-15',
            totalScore: 263,
            avgScore: 87.67,
            positionRank: 5,
            totalRank: 12,
            status: '已发布',
            subjects: [
              { name: 'Java基础', score: 85, totalScore: 100 },
              { name: '数据库', score: 90, totalScore: 100 },
              { name: '算法', score: 88, totalScore: 100 }
            ]
          }
        ];
        
        setScores(mockScores);
      } catch (error) {
        console.error('加载成绩失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScores();
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
        <h1 className="text-3xl font-bold mb-8">我的成绩</h1>

        {scores.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无成绩记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {scores.map((score) => (
              <div key={score.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{score.examName}</h2>
                    <p className="text-gray-600 mt-1">{score.positionName}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {score.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">考试时间</p>
                    <p className="text-lg font-semibold mt-1">{score.examDate}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">总分</p>
                    <p className="text-lg font-semibold mt-1">{score.totalScore}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">岗位排名</p>
                    <p className="text-lg font-semibold mt-1">第{score.positionRank}名</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">总排名</p>
                    <p className="text-lg font-semibold mt-1">第{score.totalRank}名</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">各科成绩</h3>
                  <div className="space-y-2">
                    {score.subjects.map((subject: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700">{subject.name}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(subject.score / subject.totalScore) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold w-20 text-right">
                            {subject.score}/{subject.totalScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/scores/${score.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    打印成绩单
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

