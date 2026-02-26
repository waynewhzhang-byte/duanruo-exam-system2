'use client';

import { useParams, useRouter } from 'next/navigation';
import { useScoresByApplication } from '@/lib/api-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { ArrowLeft } from 'lucide-react';

/**
 * 成绩详情页面
 * 显示考生的详细成绩信息和统计图表
 */
export default function ScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const { data: scores, isLoading, error } = useScoresByApplication(applicationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !scores || scores.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">成绩记录不存在</p>
          <Button
            onClick={() => router.push('/my-scores')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回我的成绩
          </Button>
        </div>
      </div>
    );
  }

  // Calculate total score and other stats
  const totalScore = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);
  const avgScore = totalScore / scores.length;
  const hasPassed = scores.every(s => !s.isAbsent);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/my-scores')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回我的成绩
          </Button>
        </div>

        <Card className="mb-6">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold mb-2">成绩详情</h1>
            <p className="text-sm text-gray-500">
              报名编号: {applicationId}
            </p>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">总分</p>
                <p className="text-3xl font-bold text-blue-600">{totalScore}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">平均分</p>
                <p className="text-3xl font-bold text-green-600">{avgScore.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">科目数</p>
                <p className="text-3xl font-bold text-purple-600">{scores.length}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">状态</p>
                <p className="text-3xl font-bold text-orange-600">
                  {hasPassed ? '已完成' : '有缺考'}
                </p>
              </div>
            </div>

            {hasPassed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold">
                  ✓ 您的成绩已全部记录
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">科目成绩</h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {scores.map((score) => (
                <div key={score.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">{score.subjectName || '科目成绩'}</h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {score.isAbsent ? '缺考' : `${score.score}`}
                      </p>
                      {score.remarks && (
                        <p className="text-sm text-gray-600">备注: {score.remarks}</p>
                      )}
                    </div>
                  </div>
                  
                  {score.isAbsent ? (
                    <div className="bg-red-50 p-3 rounded text-red-800">
                      该科目缺考
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>得分进度</span>
                        <span>{score.score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            打印成绩单
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/my-scores')}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            返回列表
          </Button>
        </div>
      </div>
    </div>
  );
}

