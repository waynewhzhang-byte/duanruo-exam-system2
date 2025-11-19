'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ApplicationDetail {
  id: string;
  candidateName: string;
  examName: string;
  positionName: string;
  registrationNo: string;
  status: string;
  candidateInfo: {
    name: string;
    idCard: string;
    phone: string;
    email: string;
    education: string;
    major: string;
    school: string;
  };
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  firstLevelReview?: {
    reviewer: string;
    reviewTime: string;
    result: string;
    comments: string;
  };
}

export default function ReviewDetailPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const applicationId = params.id as string;
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    // 模拟加载申请详情
    const mockApplication: ApplicationDetail = {
      id: applicationId,
      candidateName: '张三',
      examName: '2025年春季招聘考试',
      positionName: 'Java开发工程师',
      registrationNo: '2025001',
      status: '一级审核通过',
      candidateInfo: {
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        education: '本科',
        major: '计算机科学与技术',
        school: '北京大学',
      },
      attachments: [
        {
          id: '1',
          name: '身份证扫描件.pdf',
          type: 'ID_CARD',
          url: '/files/id-card.pdf',
        },
        {
          id: '2',
          name: '学历证明.pdf',
          type: 'EDUCATION',
          url: '/files/education.pdf',
        },
      ],
      firstLevelReview: {
        reviewer: '审核员A',
        reviewTime: '2025-10-25 14:30:00',
        result: '通过',
        comments: '材料齐全，符合基本要求',
      },
    };

    setTimeout(() => {
      setApplication(mockApplication);
      setLoading(false);
    }, 500);
  }, [applicationId, tenantSlug]);

  const handleApprove = () => {
    console.log('审核通过:', { applicationId, comments: reviewComments });
    // TODO: 实现审核通过逻辑
    alert('审核通过');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }
    console.log('审核拒绝:', { applicationId, reason: rejectReason });
    // TODO: 实现审核拒绝逻辑
    alert('审核拒绝');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">未找到申请信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">审核详情</h1>
            <p className="text-muted-foreground mt-2">
              报名号: {application.registrationNo}
            </p>
          </div>
          <Badge variant="secondary">{application.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：考生信息和附件 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 考生信息 */}
          <Card className="candidate-info" data-testid="candidate-info">
            <CardHeader>
              <CardTitle>考生信息</CardTitle>
              <CardDescription>
                {application.examName} - {application.positionName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">姓名</Label>
                  <p className="mt-1">{application.candidateInfo.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">身份证号</Label>
                  <p className="mt-1">{application.candidateInfo.idCard}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">手机号</Label>
                  <p className="mt-1">{application.candidateInfo.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">邮箱</Label>
                  <p className="mt-1">{application.candidateInfo.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">学历</Label>
                  <p className="mt-1">{application.candidateInfo.education}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">专业</Label>
                  <p className="mt-1">{application.candidateInfo.major}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">毕业院校</Label>
                  <p className="mt-1">{application.candidateInfo.school}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 附件材料 */}
          <Card className="attachments" data-testid="attachments">
            <CardHeader>
              <CardTitle>附件材料</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {application.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <span className="text-xs font-medium">PDF</span>
                      </div>
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.type}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      查看
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 一级审核意见 */}
          {application.firstLevelReview && (
            <Card className="first-level-review" data-testid="first-level-review">
              <CardHeader>
                <CardTitle>一级审核意见</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">审核员:</span>
                    <span>{application.firstLevelReview.reviewer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">审核时间:</span>
                    <span>{application.firstLevelReview.reviewTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">审核结果:</span>
                    <Badge variant="default">
                      {application.firstLevelReview.result}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">审核意见</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">
                      {application.firstLevelReview.comments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：审核操作 */}
        <div className="space-y-6">
          {/* 审核通过 */}
          <Card>
            <CardHeader>
              <CardTitle>审核通过</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reviewComments">审核意见</Label>
                <Textarea
                  id="reviewComments"
                  name="reason"
                  placeholder="请输入审核意见（选填）"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleApprove}
                data-testid="btn-approve"
              >
                审核通过
              </Button>
            </CardContent>
          </Card>

          {/* 审核拒绝 */}
          <Card>
            <CardHeader>
              <CardTitle>审核拒绝</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejectReason">拒绝原因 *</Label>
                <Textarea
                  id="rejectReason"
                  name="reason"
                  placeholder="请输入拒绝原因（必填）"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleReject}
                data-testid="btn-reject"
              >
                审核拒绝
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

