'use client';

import { useRouter } from 'next/navigation';
import { useMyApplications } from '@/lib/api-hooks';

interface ScoreData {
  examTitle: string;
  positionTitle: string;
  totalWrittenScore: number | null;
  writtenPassStatus: string | null;
  interviewEligibility: string | null;
  finalResult: string | null;
}

export default function MyScoresPage() {
  const router = useRouter();
  
  const { data: appsData, isLoading, error } = useMyApplications({});
  
  const applications = appsData?.content || [];
  
  // 从报名数据中提取成绩相关信息
  const scores: ScoreData[] = applications
    .filter(app => app.status === 'APPROVED' || app.status === 'TICKET_ISSUED')
    .map(app => {
      const appAny = app as unknown as Record<string, unknown>
      return {
        examTitle: app.examTitle || '未知考试',
        positionTitle: app.positionTitle || '未知岗位',
        totalWrittenScore: appAny.totalWrittenScore as number | null || null,
        writtenPassStatus: appAny.writtenPassStatus as string | null || null,
        interviewEligibility: appAny.interviewEligibility as string | null || null,
        finalResult: appAny.finalResult as string | null || null,
      }
    });

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
          <p className="text-red-600">加载成绩失败，请稍后重试</p>
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
            {scores.map((score, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{score.examTitle}</h2>
                    <p className="text-gray-600 mt-1">{score.positionTitle}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    score.interviewEligibility === 'ELIGIBLE' ? 'bg-green-100 text-green-800' :
                    score.interviewEligibility === 'INELIGIBLE' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {score.finalResult || '待判定'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">笔试成绩</p>
                    <p className="text-lg font-semibold mt-1">
                      {score.totalWrittenScore !== null ? score.totalWrittenScore : '未公布'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">笔试结果</p>
                    <p className={`text-lg font-semibold mt-1 ${
                      score.writtenPassStatus === 'PASS' ? 'text-green-600' :
                      score.writtenPassStatus === 'FAIL' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {score.writtenPassStatus === 'PASS' ? '通过' :
                       score.writtenPassStatus === 'FAIL' ? '未通过' : '待判定'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">面试资格</p>
                    <p className={`text-lg font-semibold mt-1 ${
                      score.interviewEligibility === 'ELIGIBLE' ? 'text-green-600' :
                      score.interviewEligibility === 'INELIGIBLE' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {score.interviewEligibility === 'ELIGIBLE' ? '进入面试' :
                       score.interviewEligibility === 'INELIGIBLE' ? '不具备资格' :
                       score.interviewEligibility === 'EXEMPT' ? '免试' : '待判定'}
                    </p>
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

