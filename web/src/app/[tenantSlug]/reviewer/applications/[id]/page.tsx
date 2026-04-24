'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Spinner } from '@/components/ui/loading';
import { useTenant } from '@/hooks/useTenant';
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Eye, CheckCircle, XCircle, AlertCircle, RotateCcw, Check, X, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ApplicationDetailResponse {
  id: string;
  examId: string;
  positionId: string;
  candidateId: string;
  // 候选人信息（从用户表获取）
  candidateName?: string;
  candidateIdCardNumber?: string;
  candidatePhone?: string;
  candidateEmail?: string;
  formVersion: number;
  payload: Record<string, any>;
  status: string;
  autoCheckResult: Record<string, any> | null;
  finalDecision: Record<string, any> | null;
  submittedAt: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: Array<{
    fileId: string;
    fieldKey: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    virusScanStatus: string | null;
    uploadedAt: string;
  }>;
  examTitle?: string;
  positionTitle?: string;
}

interface FormTemplateField {
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  options?: string[];
}

interface FormTemplateResponse {
  examId: string;
  fields: FormTemplateField[];
}

// 单项审核状态类型
type FieldReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';

// 单项审核结果
interface FieldReviewResult {
  status: FieldReviewStatus;
  comment?: string;
}

// 默认字段标签映射
const defaultFieldLabels: Record<string, string> = {
  fullName: '姓名',
  name: '姓名',
  idCardNumber: '身份证号',
  idCard: '身份证号',
  gender: '性别',
  birthDate: '出生日期',
  phone: '手机号码',
  phoneNumber: '手机号码',
  email: '邮箱',
  education: '学历',
  major: '专业',
  graduationSchool: '毕业院校',
  workExperience: '工作经历',
  idCardFiles: '身份证附件',
  diplomaFiles: '毕业证附件',
  degreeFiles: '学位证附件',
  photoFiles: '证件照',
  resumeFiles: '简历附件',
  certificateFiles: '资格证书附件',
  otherFiles: '其他附件',
};

function ReviewDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tenantSlug = params.tenantSlug as string;
  const applicationId = params.id as string;
  const reviewTaskId = searchParams.get('taskId') ?? '';
  const { tenant } = useTenant();

  const [reviewComments, setReviewComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 逐项审核状态: { fieldKey: { status, comment } }
  const [fieldReviews, setFieldReviews] = useState<Record<string, FieldReviewResult>>({});

  // 获取申请详情
  const { data: application, isLoading, error } = useQuery<ApplicationDetailResponse>({
    queryKey: ['application-detail', applicationId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded');
      return apiGetWithTenant<ApplicationDetailResponse>(`/applications/${applicationId}`, tenant.id);
    },
    enabled: !!tenant?.id && !!applicationId,
  });

  // 获取表单模板（用于字段标签映射）
  const { data: formTemplate } = useQuery<FormTemplateResponse>({
    queryKey: ['form-template', application?.examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id || !application?.examId) throw new Error('Missing data');
      return apiGetWithTenant<FormTemplateResponse>(`/exams/${application.examId}/form-template`, tenant.id);
    },
    enabled: !!tenant?.id && !!application?.examId,
  });

  // 审核通过 mutation - uses /reviews/decide endpoint（taskId 由队列「查看详情」URL 携带）
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded');
      if (!reviewTaskId.trim()) {
        throw new Error('缺少审核任务：请先在「审核队列」领取任务，再通过「查看详情」进入本页');
      }
      await apiPostWithTenant('/reviews/decide', tenant.id, {
        taskId: reviewTaskId,
        approve: true,
        reason: reviewComments.trim() || '审核通过',
      });
    },
    onSuccess: () => {
      toast.success('审核通过');
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      router.push(`/${tenantSlug}/reviewer/queue`);
    },
    onError: (err: any) => {
      toast.error(err?.message || '审核操作失败');
    },
  });

  // 审核拒绝 mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded');
      if (!reviewTaskId.trim()) {
        throw new Error('缺少审核任务：请先在「审核队列」领取任务，再通过「查看详情」进入本页');
      }
      await apiPostWithTenant('/reviews/decide', tenant.id, {
        taskId: reviewTaskId,
        approve: false,
        reason: rejectReason.trim(),
      });
    },
    onSuccess: () => {
      toast.success('已拒绝该申请');
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      router.push(`/${tenantSlug}/reviewer/queue`);
    },
    onError: (err: any) => {
      toast.error(err?.message || '审核操作失败');
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('请输入拒绝原因');
      return;
    }
    rejectMutation.mutate();
  };

  // 预览附件
  const handlePreviewAttachment = async (fileId: string) => {
    if (!tenant?.id) return;
    try {
      const response = await apiGetWithTenant<{ url: string }>(`/files/${fileId}/download-url`, tenant.id);
      setPreviewUrl(response.url);
    } catch (err: any) {
      toast.error(err?.message || '获取预览链接失败');
    }
  };

  // 获取字段标签
  const getFieldLabel = (fieldKey: string): string => {
    const field = formTemplate?.fields?.find(f => f.fieldKey === fieldKey);
    if (field?.label) return field.label;
    if (defaultFieldLabels[fieldKey]) return defaultFieldLabels[fieldKey];
    // 转换 camelCase 为可读格式
    return fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  // 更新单项审核状态
  const updateFieldReview = (fieldKey: string, status: FieldReviewStatus, comment?: string) => {
    setFieldReviews(prev => ({
      ...prev,
      [fieldKey]: { status, comment: comment || prev[fieldKey]?.comment }
    }));
  };

  // 更新单项审核备注
  const updateFieldComment = (fieldKey: string, comment: string) => {
    setFieldReviews(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], status: prev[fieldKey]?.status || 'PENDING', comment }
    }));
  };

  // 获取审核统计
  const reviewStats = useMemo(() => {
    const allFieldKeys: string[] = [];
    // 收集所有字段
    if (application?.payload) {
      allFieldKeys.push(...Object.keys(application.payload));
    }
    if (application?.attachments) {
      allFieldKeys.push(...application.attachments.map(a => a.fieldKey));
    }

    const total = allFieldKeys.length;
    const reviewed = allFieldKeys.filter(k => fieldReviews[k]?.status && fieldReviews[k].status !== 'PENDING').length;
    const approved = allFieldKeys.filter(k => fieldReviews[k]?.status === 'APPROVED').length;
    const rejected = allFieldKeys.filter(k => fieldReviews[k]?.status === 'REJECTED').length;
    const returned = allFieldKeys.filter(k => fieldReviews[k]?.status === 'RETURNED').length;

    return { total, reviewed, approved, rejected, returned, pending: total - reviewed };
  }, [application, fieldReviews]);

  // 一键全部通过
  const approveAllFields = () => {
    const newReviews: Record<string, FieldReviewResult> = {};
    if (application?.payload) {
      Object.keys(application.payload).forEach(key => {
        newReviews[key] = { status: 'APPROVED' };
      });
    }
    if (application?.attachments) {
      application.attachments.forEach(a => {
        newReviews[a.fieldKey] = { status: 'APPROVED' };
      });
    }
    setFieldReviews(newReviews);
    toast.success('已标记所有项目为通过');
  };

  // 重置所有审核状态
  const resetAllFields = () => {
    setFieldReviews({});
    toast.info('已重置所有审核状态');
  };

  // 获取状态显示样式
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'PENDING_PRIMARY_REVIEW': { label: '待一级审核', variant: 'outline' },
      'PENDING_SECONDARY_REVIEW': { label: '待二级审核', variant: 'outline' },
      'PRIMARY_PASSED': { label: '一级审核通过', variant: 'default' },
      'PRIMARY_REJECTED': { label: '一级审核拒绝', variant: 'destructive' },
      'SECONDARY_REJECTED': { label: '二级审核拒绝', variant: 'destructive' },
      'APPROVED': { label: '审核通过', variant: 'default' },
      'AUTO_PASSED': { label: '自动审核通过', variant: 'default' },
      'AUTO_REJECTED': { label: '自动审核拒绝', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : '未找到申请信息'}
          </p>
          <Link href={`/${tenantSlug}/reviewer/queue`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回审核队列
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canSubmitReview = Boolean(reviewTaskId.trim());

  return (
    <div className="container mx-auto p-6">
      {/* 头部导航 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${tenantSlug}/reviewer/queue`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
        </div>
        {!canSubmitReview && (
          <div
            className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            当前为只读查看。要提交通过或拒绝，请打开「审核队列」→ 选择考试 →「领取下一任务」或从列表进入带审核任务的详情（链接会携带任务 ID）。
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">审核详情</h1>
            <p className="text-muted-foreground mt-2">
              {application.examTitle} - {application.positionTitle}
            </p>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：考生信息和附件 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 考生基本信息（从用户表获取） */}
          <Card className="candidate-basic-info">
            <CardHeader>
              <CardTitle>考生基本信息</CardTitle>
              <CardDescription>考生账户注册信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">姓名</Label>
                  <p className="mt-1 font-medium">{application.candidateName || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">身份证号</Label>
                  <p className="mt-1 font-medium">{application.candidateIdCardNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">手机号码</Label>
                  <p className="mt-1 font-medium">{application.candidatePhone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">邮箱</Label>
                  <p className="mt-1 font-medium">{application.candidateEmail || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 表单内容 */}
          <Card className="candidate-info" data-testid="candidate-info">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>报名表单内容</CardTitle>
                  <CardDescription>
                    考生提交的报名信息（版本 {application.formVersion}）
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={approveAllFields}>
                    <Check className="h-4 w-4 mr-1" />
                    全部通过
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetAllFields}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    重置
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.payload && Object.entries(application.payload).map(([key, value]) => {
                  const fieldStatus = fieldReviews[key]?.status || 'PENDING';
                  // 如果 payload 中的值为空，尝试从候选人基本信息获取
                  let displayValue = value;
                  if (!value || (typeof value === 'string' && value.trim() === '')) {
                    if (key === 'fullName' || key === 'name') {
                      displayValue = application.candidateName || '';
                    } else if (key === 'idNumber' || key === 'idCardNumber') {
                      displayValue = application.candidateIdCardNumber || '';
                    } else if (key === 'phone' || key === 'phoneNumber') {
                      displayValue = application.candidatePhone || '';
                    } else if (key === 'email') {
                      displayValue = application.candidateEmail || '';
                    }
                  }
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-4 border rounded-lg transition-colors",
                        fieldStatus === 'APPROVED' && "border-green-200 bg-green-50",
                        fieldStatus === 'REJECTED' && "border-red-200 bg-red-50",
                        fieldStatus === 'RETURNED' && "border-yellow-200 bg-yellow-50",
                        fieldStatus === 'PENDING' && "border-gray-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium text-muted-foreground">{getFieldLabel(key)}</Label>
                          <p className="mt-1 text-base">{String(displayValue || '-')}</p>
                        </div>

                        {/* 审核按钮组 */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant={fieldStatus === 'APPROVED' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "h-8 px-2",
                              fieldStatus === 'APPROVED' && "bg-green-600 hover:bg-green-700"
                            )}
                            onClick={() => updateFieldReview(key, 'APPROVED')}
                            title="通过"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={fieldStatus === 'REJECTED' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "h-8 px-2",
                              fieldStatus === 'REJECTED' && "bg-red-600 hover:bg-red-700"
                            )}
                            onClick={() => updateFieldReview(key, 'REJECTED')}
                            title="拒绝"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={fieldStatus === 'RETURNED' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "h-8 px-2",
                              fieldStatus === 'RETURNED' && "bg-yellow-600 hover:bg-yellow-700"
                            )}
                            onClick={() => updateFieldReview(key, 'RETURNED')}
                            title="驳回修改"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 备注输入（仅在拒绝或驳回时显示） */}
                      {(fieldStatus === 'REJECTED' || fieldStatus === 'RETURNED') && (
                        <div className="mt-3">
                          <Input
                            placeholder={fieldStatus === 'REJECTED' ? '请输入拒绝原因...' : '请输入驳回修改说明...'}
                            value={fieldReviews[key]?.comment || ''}
                            onChange={(e) => updateFieldComment(key, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!application.payload || Object.keys(application.payload).length === 0) && (
                  <p className="text-muted-foreground">暂无表单数据</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 附件材料 */}
          <Card className="attachments" data-testid="attachments">
            <CardHeader>
              <CardTitle>附件材料</CardTitle>
              <CardDescription>考生上传的证明材料（共 {application.attachments?.length || 0} 个）</CardDescription>
            </CardHeader>
            <CardContent>
              {application.attachments && application.attachments.length > 0 ? (
                <div className="space-y-4">
                  {application.attachments.map((attachment) => {
                    const fieldStatus = fieldReviews[attachment.fieldKey]?.status || 'PENDING';
                    return (
                      <div
                        key={attachment.fileId}
                        className={cn(
                          "p-4 border rounded-lg transition-colors",
                          fieldStatus === 'APPROVED' && "border-green-200 bg-green-50",
                          fieldStatus === 'REJECTED' && "border-red-200 bg-red-50",
                          fieldStatus === 'RETURNED' && "border-yellow-200 bg-yellow-50",
                          fieldStatus === 'PENDING' && "border-gray-200"
                        )}
                      >
                        {/* 字段标签 */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="text-sm font-medium">
                            {getFieldLabel(attachment.fieldKey)}
                          </Badge>

                          {/* 审核状态指示 */}
                          {fieldStatus !== 'PENDING' && (
                            <Badge
                              variant={
                                fieldStatus === 'APPROVED' ? 'default' :
                                fieldStatus === 'REJECTED' ? 'destructive' : 'outline'
                              }
                              className={cn(
                                fieldStatus === 'APPROVED' && "bg-green-600",
                                fieldStatus === 'RETURNED' && "bg-yellow-600 text-white"
                              )}
                            >
                              {fieldStatus === 'APPROVED' ? '已通过' :
                               fieldStatus === 'REJECTED' ? '已拒绝' : '待修改'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{attachment.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.contentType} · {(attachment.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewAttachment(attachment.fileId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                        </div>

                        {/* 审核按钮组 */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                          <span className="text-sm text-muted-foreground mr-2">审核操作：</span>
                          <Button
                            variant={fieldStatus === 'APPROVED' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              fieldStatus === 'APPROVED' && "bg-green-600 hover:bg-green-700"
                            )}
                            onClick={() => updateFieldReview(attachment.fieldKey, 'APPROVED')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            通过
                          </Button>
                          <Button
                            variant={fieldStatus === 'REJECTED' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              fieldStatus === 'REJECTED' && "bg-red-600 hover:bg-red-700"
                            )}
                            onClick={() => updateFieldReview(attachment.fieldKey, 'REJECTED')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </Button>
                          <Button
                            variant={fieldStatus === 'RETURNED' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              fieldStatus === 'RETURNED' && "bg-yellow-600 hover:bg-yellow-700"
                            )}
                            onClick={() => updateFieldReview(attachment.fieldKey, 'RETURNED')}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            驳回修改
                          </Button>
                        </div>

                        {/* 备注输入 */}
                        {(fieldStatus === 'REJECTED' || fieldStatus === 'RETURNED') && (
                          <div className="mt-3">
                            <Input
                              placeholder={fieldStatus === 'REJECTED' ? '请输入拒绝原因...' : '请输入驳回修改说明...'}
                              value={fieldReviews[attachment.fieldKey]?.comment || ''}
                              onChange={(e) => updateFieldComment(attachment.fieldKey, e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">暂无附件</p>
              )}
            </CardContent>
          </Card>

          {/* 自动审核结果 */}
          {application.autoCheckResult && Object.keys(application.autoCheckResult).length > 0 && (
            <Card className="auto-review-result">
              <CardHeader>
                <CardTitle>自动审核结果</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-3 bg-muted rounded-lg text-sm overflow-auto">
                  {JSON.stringify(application.autoCheckResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：审核操作 */}
        <div className="space-y-6">
          {/* 审核进度统计 */}
          <Card>
            <CardHeader>
              <CardTitle>审核进度</CardTitle>
              <CardDescription>逐项审核完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">总项目数</span>
                  <span className="font-medium">{reviewStats.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    已通过
                  </span>
                  <span className="font-medium text-green-600">{reviewStats.approved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    已拒绝
                  </span>
                  <span className="font-medium text-red-600">{reviewStats.rejected}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    待修改
                  </span>
                  <span className="font-medium text-yellow-600">{reviewStats.returned}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    待审核
                  </span>
                  <span className="font-medium text-gray-500">{reviewStats.pending}</span>
                </div>

                {/* 进度条 */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(reviewStats.approved / reviewStats.total) * 100}%` }}
                      />
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${(reviewStats.rejected / reviewStats.total) * 100}%` }}
                      />
                      <div
                        className="bg-yellow-500 transition-all"
                        style={{ width: `${(reviewStats.returned / reviewStats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    已审核 {reviewStats.reviewed} / {reviewStats.total} 项
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 审核通过 */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                审核通过
              </CardTitle>
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
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={
                  approveMutation.isPending ||
                  !canSubmitReview ||
                  reviewStats.rejected > 0 ||
                  reviewStats.returned > 0
                }
                data-testid="btn-approve"
              >
                {approveMutation.isPending ? '处理中...' : '提交审核通过'}
              </Button>
              {!canSubmitReview && (
                <p className="text-xs text-muted-foreground text-center">未关联审核任务，无法提交</p>
              )}
              {(reviewStats.rejected > 0 || reviewStats.returned > 0) && (
                <p className="text-xs text-muted-foreground text-center">
                  存在拒绝或驳回项目，无法通过审核
                </p>
              )}
            </CardContent>
          </Card>

          {/* 审核拒绝 */}
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                审核拒绝
              </CardTitle>
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
                  rows={3}
                />
              </div>
              {/* 汇总拒绝/驳回项 */}
              {(reviewStats.rejected > 0 || reviewStats.returned > 0) && (
                <div className="text-sm bg-red-50 p-3 rounded-lg">
                  <p className="font-medium text-red-700 mb-2">问题项目汇总：</p>
                  <ul className="space-y-1 text-red-600">
                    {Object.entries(fieldReviews)
                      .filter(([_, v]) => v.status === 'REJECTED' || v.status === 'RETURNED')
                      .map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2">
                          <span className={cn(
                            "inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            value.status === 'REJECTED' ? "bg-red-500" : "bg-yellow-500"
                          )} />
                          <span>
                            <strong>{getFieldLabel(key)}</strong>
                            {value.status === 'REJECTED' ? '（拒绝）' : '（驳回）'}
                            {value.comment && `：${value.comment}`}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !canSubmitReview}
                data-testid="btn-reject"
              >
                {rejectMutation.isPending ? '处理中...' : '提交审核拒绝'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 附件预览弹窗 */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreviewUrl(null); } }} aria-label="关闭预览">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] w-full mx-4 overflow-auto" onClick={e => e.stopPropagation()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} aria-label="预览内容">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">附件预览</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>关闭</Button>
            </div>
            <iframe src={previewUrl} className="w-full h-[70vh] border rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewDetailPage() {
  return (
    <RouteGuard roles={['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'TENANT_ADMIN']}>
      <Suspense
        fallback={
          <div className="container mx-auto flex min-h-[40vh] items-center justify-center p-6">
            <Spinner size="lg" />
          </div>
        }
      >
        <ReviewDetailContent />
      </Suspense>
    </RouteGuard>
  );
}

