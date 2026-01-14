'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/loading';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useTenant } from '@/hooks/useTenant';
import { apiGetWithTenant } from '@/lib/api';
import { ArrowLeft, History } from 'lucide-react';
import Link from 'next/link';

interface ReviewRecord {
  id: string;
  applicationId: string;
  candidateName?: string;
  examTitle?: string;
  positionTitle?: string;
  reviewedAt: string;
  decision: string;
  comment: string;
  reviewerName?: string;
}

interface ReviewHistoryResponse {
  content: ReviewRecord[];
  totalElements: number;
  totalPages: number;
}

function ReviewHistoryContent() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 获取审核历史
  const { data, isLoading, refetch } = useQuery<ReviewHistoryResponse>({
    queryKey: ['review-history', tenant?.id, filterStatus, startDate, endDate],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded');
      const params = new URLSearchParams();
      params.append('page', '0');
      params.append('size', '50');
      if (filterStatus !== 'all') {
        params.append('decision', filterStatus);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      try {
        return await apiGetWithTenant<ReviewHistoryResponse>(`/reviews/history?${params.toString()}`, tenant.id);
      } catch {
        // 如果API不存在，返回空数据
        return { content: [], totalElements: 0, totalPages: 0 };
      }
    },
    enabled: !!tenant?.id,
  });

  const records = data?.content || [];

  const handleFilter = () => {
    refetch();
  };

  const handleExport = () => {
    console.log('导出审核报告');
    // TODO: 实现导出功能
  };

  const getDecisionLabel = (decision: string) => {
    const labels: Record<string, string> = {
      'APPROVE': '审核通过',
      'REJECT': '审核拒绝',
      'RETURN': '退回修改',
    };
    return labels[decision] || decision;
  };

  const getDecisionVariant = (decision: string): 'default' | 'destructive' | 'secondary' => {
    if (decision === 'APPROVE') return 'default';
    if (decision === 'REJECT') return 'destructive';
    return 'secondary';
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${tenantSlug}/reviewer`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8 text-blue-600" />
          审核历史
        </h1>
        <p className="text-muted-foreground mt-2">
          查看已完成的审核记录（共 {data?.totalElements || 0} 条）
        </p>
      </div>

      {/* 筛选栏 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                审核结果
              </label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
                name="reviewStatus"
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择审核结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="审核通过">审核通过</SelectItem>
                  <SelectItem value="审核拒绝">审核拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                开始时间
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                name="startDate"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                结束时间
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                name="endDate"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                查询
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="btn-export"
              >
                导出报告
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 审核记录列表 */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <Card>
            <CardContent className="pt-6 py-12">
              <div className="text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  暂无审核记录
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {record.candidateName || '考生'} - {record.positionTitle || '未知岗位'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      申请ID: {record.applicationId?.substring(0, 8).toUpperCase()} | 考试: {record.examTitle || '未知考试'}
                    </CardDescription>
                  </div>
                  <Badge variant={getDecisionVariant(record.decision)}>
                    {getDecisionLabel(record.decision)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">审核时间:</span>
                    <span>{record.reviewedAt ? new Date(record.reviewedAt).toLocaleString('zh-CN') : '-'}</span>
                  </div>
                  {record.reviewerName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">审核员:</span>
                      <span>{record.reviewerName}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">审核意见:</span>
                    <span className="text-right max-w-md">
                      {record.comment || '-'}
                    </span>
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

export default function ReviewHistoryPage() {
  return (
    <RouteGuard roles={['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'TENANT_ADMIN']}>
      <ReviewHistoryContent />
    </RouteGuard>
  );
}
