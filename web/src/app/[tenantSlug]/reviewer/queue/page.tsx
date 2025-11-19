'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ReviewTask {
  id: string;
  candidateName: string;
  examName: string;
  positionName: string;
  submitTime: string;
  status: string;
  registrationNo: string;
}

export default function ReviewQueuePage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载审核任务
    const mockTasks: ReviewTask[] = [
      {
        id: '1',
        candidateName: '张三',
        examName: '2025年春季招聘考试',
        positionName: 'Java开发工程师',
        submitTime: '2025-10-26 10:30:00',
        status: '待一级审核',
        registrationNo: '2025001',
      },
      {
        id: '2',
        candidateName: '李四',
        examName: '2025年春季招聘考试',
        positionName: 'Python开发工程师',
        submitTime: '2025-10-26 11:00:00',
        status: '待一级审核',
        registrationNo: '2025002',
      },
    ];

    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 500);
  }, [tenantSlug]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleBatchApprove = () => {
    console.log('批量审核通过:', selectedTasks);
    // TODO: 实现批量审核逻辑
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">审核队列</h1>
        <p className="text-muted-foreground mt-2">
          查看和处理待审核的报名申请
        </p>
      </div>

      {/* 批量操作栏 */}
      {selectedTasks.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                已选择 {selectedTasks.length} 个任务
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
                  onClick={() => setSelectedTasks([])}
                >
                  取消选择
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 审核任务列表 */}
      <div className="space-y-4 review-task-list">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                暂无待审核任务
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="review-task-item">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => handleSelectTask(task.id)}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className="text-lg">
                        {task.candidateName} - {task.positionName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        报名号: {task.registrationNo} | 考试: {task.examName}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground task-timestamp">
                    提交时间: {task.submitTime}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/${tenantSlug}/reviewer/applications/${task.id}`;
                      }}
                    >
                      查看详情
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      data-testid="btn-approve"
                    >
                      审核通过
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      data-testid="btn-reject"
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

