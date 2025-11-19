'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * 报名详情页面
 * 显示报名的详细信息
 */
export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载报名详情
    const loadApplication = async () => {
      try {
        // TODO: 调用 API 获取报名详情
        // const response = await fetch(`/api/v1/applications/${applicationId}`);
        // const data = await response.json();
        
        // 模拟数据
        const mockApplication = {
          id: applicationId,
          registrationNo: 'REG-2025-001',
          examName: '2025年春季招聘考试',
          positionName: 'Java开发工程师',
          status: '待支付',
          reviewStatus: 'APPROVED',
          paymentStatus: 'UNPAID',
          submittedAt: '2025-10-28 10:30:00',
          fee: 100.00,
          formData: {
            name: '张三',
            idCard: '110101199001011234',
            phone: '13800138000',
            email: 'zhangsan@example.com',
            education: '本科',
            major: '计算机科学与技术',
            graduationSchool: '北京大学',
            graduationYear: '2015'
          },
          attachments: [
            { id: '1', name: '身份证扫描件.pdf', type: 'ID_CARD', uploadedAt: '2025-10-28 10:25:00' },
            { id: '2', name: '学历证明.pdf', type: 'DIPLOMA', uploadedAt: '2025-10-28 10:26:00' }
          ],
          reviewHistory: [
            {
              id: '1',
              level: '一级审核',
              reviewer: '审核员A',
              result: '通过',
              comments: '材料齐全，符合要求',
              reviewedAt: '2025-10-28 15:30:00'
            }
          ]
        };
        
        setApplication(mockApplication);
      } catch (error) {
        console.error('加载报名详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId]);

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

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">报名记录不存在</p>
          <button
            onClick={() => router.push('/my-applications')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回我的报名
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => router.push('/my-applications')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← 返回我的报名
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">{application.examName}</h1>
                <p className="text-gray-600">{application.positionName}</p>
                <p className="text-sm text-gray-500 mt-1">
                  报名号: {application.registrationNo}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>
          </div>

          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">姓名</p>
                <p className="font-semibold">{application.formData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">身份证号</p>
                <p className="font-semibold">{application.formData.idCard}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">手机号</p>
                <p className="font-semibold">{application.formData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">邮箱</p>
                <p className="font-semibold">{application.formData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">学历</p>
                <p className="font-semibold">{application.formData.education}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">专业</p>
                <p className="font-semibold">{application.formData.major}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">毕业学校</p>
                <p className="font-semibold">{application.formData.graduationSchool}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">毕业年份</p>
                <p className="font-semibold">{application.formData.graduationYear}</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">附件材料</h2>
            <div className="space-y-2">
              {application.attachments.map((attachment: any) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{attachment.name}</p>
                    <p className="text-sm text-gray-600">上传时间: {attachment.uploadedAt}</p>
                  </div>
                  <button className="px-4 py-2 text-blue-600 hover:text-blue-700">
                    下载
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">审核记录</h2>
            <div className="space-y-3">
              {application.reviewHistory.map((review: any) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{review.level}</p>
                      <p className="text-sm text-gray-600">审核员: {review.reviewer}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      review.result === '通过' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {review.result}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.comments}</p>
                  <p className="text-xs text-gray-500 mt-2">{review.reviewedAt}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">考试费用</p>
                <p className="text-2xl font-bold text-blue-600">¥{application.fee}</p>
              </div>
              {application.paymentStatus === 'UNPAID' && application.reviewStatus === 'APPROVED' && (
                <button
                  onClick={() => {
                    // 需要获取tenantSlug，这里先尝试从context或params获取
                    const tenantSlug = window.location.pathname.split('/')[1] || 'default'
                    router.push(`/${tenantSlug}/candidate/applications/${applicationId}/payment`)
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
                >
                  立即支付
                </button>
              )}
              {application.paymentStatus === 'PAID' && (
                <span className="px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                  已支付
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

