'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApplication } from '@/lib/api-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { ArrowLeft } from 'lucide-react';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const { data: application, isLoading, error } = useApplication(applicationId);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SUBMITTED': 'bg-yellow-100 text-yellow-800',
      'PENDING_PRIMARY_REVIEW': 'bg-yellow-100 text-yellow-800',
      'PRIMARY_PASSED': 'bg-blue-100 text-blue-800',
      'PENDING_SECONDARY_REVIEW': 'bg-orange-100 text-orange-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PAID': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'TICKET_ISSUED': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'DRAFT': '草稿',
      'SUBMITTED': '已提交',
      'PENDING_PRIMARY_REVIEW': '待审核',
      'PRIMARY_PASSED': '一审通过',
      'PENDING_SECONDARY_REVIEW': '待复审',
      'APPROVED': '审核通过',
      'PAID': '已缴费',
      'REJECTED': '审核拒绝',
      'TICKET_ISSUED': '已发放准考证',
    };
    return texts[status] || status;
  };

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

  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">报名记录不存在</p>
          <Button
            onClick={() => router.push('/my-applications')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回我的报名
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/my-applications')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回我的报名
          </Button>
        </div>

        <Card>
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">报名详情</h1>
                <p className="text-sm text-gray-500 mt-1">
                  报名号: {application.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-500">
                  考试ID: {application.examId.slice(0, 8)} | 岗位ID: {application.positionId.slice(0, 8)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}>
                {getStatusText(application.status)}
              </span>
            </div>
          </div>

          {application.payload && (
            <CardContent className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-4">报名信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(application.payload as Record<string, unknown>).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-600">{key}</p>
                    <p className="font-semibold">{String(value ?? '-')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">提交时间</p>
                <p className="font-semibold">
                  {application.submittedAt ? new Date(application.submittedAt).toLocaleString() : '-'}
                </p>
              </div>
              {application.status === 'APPROVED' && (
                <Button
                  onClick={() => {
                    router.push(`/candidate/applications/${applicationId}/payment`)
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
                >
                  立即支付
                </Button>
              )}
              {application.status === 'PAID' && (
                <span className="px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                  已支付
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

