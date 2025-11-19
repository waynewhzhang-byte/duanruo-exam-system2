'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * 成绩详情页面
 * 显示考生的详细成绩信息和统计图表
 */
export default function ScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scoreId = params.id as string;
  
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载成绩详情
    const loadScore = async () => {
      try {
        // TODO: 调用 API 获取成绩详情
        // const response = await fetch(`/api/v1/scores/${scoreId}`);
        // const data = await response.json();
        
        // 模拟数据
        const mockScore = {
          id: scoreId,
          examName: '2024年秋季招聘考试',
          positionName: 'Java开发工程师',
          totalScore: 263,
          avgScore: 87.67,
          positionRank: 5,
          totalRank: 12,
          totalCandidates: 150,
          positionCandidates: 50,
          isQualified: true,
          interviewEligible: true,
          subjects: [
            { 
              id: '1', 
              name: 'Java基础', 
              score: 85, 
              totalScore: 100,
              percentage: 85,
              avgScore: 78,
              rank: 8
            },
            { 
              id: '2', 
              name: '数据库', 
              score: 90, 
              totalScore: 100,
              percentage: 90,
              avgScore: 82,
              rank: 3
            },
            { 
              id: '3', 
              name: '算法', 
              score: 88, 
              totalScore: 100,
              percentage: 88,
              avgScore: 75,
              rank: 5
            }
          ],
          publishedAt: '2025-01-15 10:00:00'
        };
        
        setScore(mockScore);
      } catch (error) {
        console.error('加载成绩详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [scoreId]);

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

  if (!score) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">成绩记录不存在</p>
          <button
            onClick={() => router.push('/my-scores')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回我的成绩
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => router.push('/my-scores')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← 返回我的成绩
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold mb-2">{score.examName}</h1>
            <p className="text-gray-600">{score.positionName}</p>
            <p className="text-sm text-gray-500 mt-1">
              发布时间: {score.publishedAt}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">总分</p>
                <p className="text-3xl font-bold text-blue-600">{score.totalScore}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">平均分</p>
                <p className="text-3xl font-bold text-green-600">{score.avgScore}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">岗位排名</p>
                <p className="text-3xl font-bold text-purple-600">
                  {score.positionRank}/{score.positionCandidates}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">总排名</p>
                <p className="text-3xl font-bold text-orange-600">
                  {score.totalRank}/{score.totalCandidates}
                </p>
              </div>
            </div>

            {score.isQualified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold">
                  🎉 恭喜！您的成绩已达到合格线
                  {score.interviewEligible && '，并获得面试资格'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">科目成绩</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {score.subjects.map((subject: any) => (
                <div key={subject.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">{subject.name}</h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {subject.score}/{subject.totalScore}
                      </p>
                      <p className="text-sm text-gray-600">得分率: {subject.percentage}%</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>得分进度</span>
                      <span>{subject.score}/{subject.totalScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">平均分</p>
                      <p className="font-semibold">{subject.avgScore}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">排名</p>
                      <p className="font-semibold">第 {subject.rank} 名</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">成绩统计图表</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">成绩雷达图</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">雷达图占位符</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">各科目得分对比图</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">柱状图占位符</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">与平均分对比图</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">折线图占位符</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">排名分布图</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">饼图占位符</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            打印成绩单
          </button>
          <button
            onClick={() => router.push('/my-scores')}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            返回列表
          </button>
        </div>
      </div>
    </div>
  );
}

