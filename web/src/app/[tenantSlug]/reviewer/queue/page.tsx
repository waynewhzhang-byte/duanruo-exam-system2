'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/loading';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, RefreshCw, User, FileText } from 'lucide-react';
import Link from 'next/link';

// 后端 /applications/pending-review 返回的申请结构
interface ApplicationItem {
  id: string;
  applicationNumber?: string;
  examId: string;
  examTitle?: string;
  positionId: string;
  positionTitle?: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  formVersion: number;
  status: string;
  submittedAt?: string;
}

interface ApplicationPageResponse {
  content: ApplicationItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const statusLabels: Record<string, string> = {
  PENDING_PRIMARY_REVIEW: '待初审',
  PENDING_SECONDARY_REVIEW: '待复审',
  PRIMARY_PASSED: '初审通过',
  PRIMARY_REJECTED: '初审拒绝',
  SECONDARY_PASSED: '复审通过',
  APPROVED: '审核通过',
  REJECTED: '已拒绝',
};

function ReviewQueueContent() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 确定审核级别
  const isPrimaryReviewer = user?.roles?.includes('PRIMARY_REVIEWER');
  const reviewLevel = isPrimaryReviewer ? 'PRIMARY' : 'SECONDARY';

  // 使用新的 /applications/pending-review API 获取待审核申请列表
  const { data, isLoading, error, refetch } = useQuery<ApplicationPageResponse>({
    queryKey: ['pending-review-applications', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded');
      // 调用审核员专用的待审核申请列表 API
      return apiGetWithTenant<ApplicationPageResponse>(
        `/applications/pending-review?page=0&size=50`,
        tenant.id
      );
    },
    enabled: !!tenant?.id,
  });

  const applications = data?.content || [];

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const handleBatchApprove = async () => {
    if (!tenant?.id) return;
    // TODO: 实现批量审核逻辑
    toast.info('批量审核功能开发中');
  };

  const handleApprove = async (applicationId: string) => {
    if (!tenant?.id) return;
    try {
      await apiPostWithTenant(`/reviews/${applicationId}/approve`, tenant.id, {
        decision: 'APPROVE',
        comment: '审核通过',
        evidence: []
      });
      toast.success('审核通过');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || '审核失败');
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!tenant?.id) return;
    const reason = window.prompt('请输入拒绝原因：');
    if (!reason) return;
    try {
      await apiPostWithTenant(`/reviews/${applicationId}/reject`, tenant.id, {
        decision: 'REJECT',
        comment: reason,
        evidence: []
      });
      toast.success('已拒绝');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  };

  if (tenantLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">加载失败，请刷新重试</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/${tenantSlug}/reviewer`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-green-600" />
            审核队列
          </h1>
          <p className="text-muted-foreground mt-2">
            {isPrimaryReviewer ? '初审' : '复审'}待处理的报名申请（共 {applications.length} 条）
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                已选择 {selectedIds.length} 个申请
              </p>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleBatchApprove}
                  data-testid="btn-batch-approve"
                >
                  批量审核通过
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                >
                  取消选择
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 审核申请列表 */}
      <div className="space-y-4 review-task-list">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 py-12">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  暂无待审核申请
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  所有申请都已处理完成
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="review-task-item hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.includes(app.id)}
                      onCheckedChange={() => handleSelect(app.id)}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {app.candidateName || app.candidateEmail || '考生'}
                        <span className="text-muted-foreground">-</span>
                        <FileText className="h-4 w-4" />
                        {app.positionTitle || '未知岗位'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        报名号: {app.applicationNumber || app.id.substring(0, 8).toUpperCase()} |
                        考试: {app.examTitle || '未知考试'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {statusLabels[app.status] || app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground task-timestamp">
                    提交时间: {app.submittedAt ? new Date(app.submittedAt).toLocaleString('zh-CN') : '-'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${tenantSlug}/reviewer/applications/${app.id}`)}
                    >
                      查看详情
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      data-testid="btn-approve"
                      onClick={() => handleApprove(app.id)}
                    >
                      审核通过
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      data-testid="btn-reject"
                      onClick={() => handleReject(app.id)}
                    >
                      审核拒绝
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function ReviewQueuePage() {
  return (
    <RouteGuard roles={['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'TENANT_ADMIN']}>
      <ReviewQueueContent />
    </RouteGuard>
  );
}
