'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviewRecord {
  id: string;
  candidateName: string;
  examName: string;
  positionName: string;
  reviewTime: string;
  reviewResult: string;
  reviewComments: string;
  registrationNo: string;
}

export default function ReviewHistoryPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    // 模拟加载审核历史
    const mockRecords: ReviewRecord[] = [
      {
        id: '1',
        candidateName: '张三',
        examName: '2025年春季招聘考试',
        positionName: 'Java开发工程师',
        reviewTime: '2025-10-25 14:30:00',
        reviewResult: '审核通过',
        reviewComments: '材料齐全，符合要求',
        registrationNo: '2025001',
      },
      {
        id: '2',
        candidateName: '李四',
        examName: '2025年春季招聘考试',
        positionName: 'Python开发工程师',
        reviewTime: '2025-10-25 15:00:00',
        reviewResult: '审核拒绝',
        reviewComments: '学历不符合要求',
        registrationNo: '2025002',
      },
    ];

    setTimeout(() => {
      setRecords(mockRecords);
      setFilteredRecords(mockRecords);
      setLoading(false);
    }, 500);
  }, [tenantSlug]);

  const handleFilter = () => {
    let filtered = [...records];

    // 按状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter((record) => record.reviewResult === filterStatus);
    }

    // 按时间范围筛选
    if (startDate) {
      filtered = filtered.filter((record) => record.reviewTime >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((record) => record.reviewTime <= endDate);
    }

    setFilteredRecords(filtered);
  };

  const handleExport = () => {
    console.log('导出审核报告');
    // TODO: 实现导出功能
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
        <h1 className="text-3xl font-bold">审核历史</h1>
        <p className="text-muted-foreground mt-2">
          查看已完成的审核记录
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
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                暂无审核记录
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {record.candidateName} - {record.positionName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      报名号: {record.registrationNo} | 考试: {record.examName}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      record.reviewResult === '审核通过'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {record.reviewResult}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">审核时间:</span>
                    <span>{record.reviewTime}</span>
                  </div>
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">审核意见:</span>
                    <span className="text-right max-w-md">
                      {record.reviewComments}
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

