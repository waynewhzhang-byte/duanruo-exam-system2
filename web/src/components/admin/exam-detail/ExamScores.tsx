'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import {
  FileText,
  UserCheck,
  UserX,
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Application {
  id: string
  applicationNo: string
  candidateName: string
  positionName: string
  status: string
}

interface Subject {
  id: string
  name: string
  type: string
  maxScore: number
}

interface Score {
  id: string
  applicationId: string
  subjectId: string
  score: number
  isAbsent: boolean
  gradedBy: string
  gradedAt: string
  remarks: string
}

interface ScoreStatistics {
  totalApplications: number
  gradedApplications: number
  absentApplications: number
  averageScore: number
  passRate: number
  interviewEligibleCount: number
}

interface ExamScoresProps {
  examId: string
}

export default function ExamScores({ examId }: ExamScoresProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [scoreValue, setScoreValue] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isAbsent, setIsAbsent] = useState(false)
  const queryClient = useQueryClient()

  // 获取考试的所有报名
  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['exam-applications', examId],
    queryFn: () => apiGet<Application[]>(`/exams/${examId}/applications`),
  })

  // 获取考试科目
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ['exam-subjects', examId],
    queryFn: () => apiGet<Subject[]>(`/exams/${examId}/subjects`),
  })

  // 获取成绩统计
  const { data: statistics } = useQuery<ScoreStatistics>({
    queryKey: ['exam-score-statistics', examId],
    queryFn: () => apiGet<ScoreStatistics>(`/exams/${examId}/scores/statistics`),
  })

  // 录入成绩
  const recordScoreMutation = useMutation({
    mutationFn: (data: { applicationId: string; subjectId: string; score: number; remarks: string }) =>
      apiPost('/scores/record', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-applications', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-score-statistics', examId] })
      toast.success('成绩录入成功')
      setScoreDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || '成绩录入失败')
    },
  })

  // 标记缺考
  const markAbsentMutation = useMutation({
    mutationFn: (data: { applicationId: string; subjectId: string; remarks: string }) =>
      apiPost('/scores/mark-absent', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-applications', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-score-statistics', examId] })
      toast.success('缺考标记成功')
      setScoreDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || '缺考标记失败')
    },
  })

  // 批量确认面试资格
  const confirmInterviewMutation = useMutation({
    mutationFn: () => apiPost(`/exams/${examId}/interview-eligibility/batch-update`, {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['exam-applications', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-score-statistics', examId] })
      toast.success(`已更新 ${data.updatedCount || 0} 个申请的面试资格`)
    },
    onError: (error: any) => {
      toast.error(error?.message || '面试资格确认失败')
    },
  })

  const resetForm = () => {
    setScoreValue('')
    setRemarks('')
    setIsAbsent(false)
    setSelectedSubject(null)
  }

  const handleOpenScoreDialog = (application: Application, subject: Subject) => {
    setSelectedApplication(application)
    setSelectedSubject(subject)
    setScoreDialogOpen(true)
  }

  const handleSubmitScore = () => {
    if (!selectedApplication || !selectedSubject) return

    if (isAbsent) {
      markAbsentMutation.mutate({
        applicationId: selectedApplication.id,
        subjectId: selectedSubject.id,
        remarks,
      })
    } else {
      const score = parseFloat(scoreValue)
      if (isNaN(score) || score < 0 || score > selectedSubject.maxScore) {
        toast.error(`成绩必须在 0-${selectedSubject.maxScore} 之间`)
        return
      }
      recordScoreMutation.mutate({
        applicationId: selectedApplication.id,
        subjectId: selectedSubject.id,
        score,
        remarks,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INTERVIEW_ELIGIBLE':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />有面试资格</Badge>
      case 'WRITTEN_EXAM_FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />笔试未通过</Badge>
      case 'WRITTEN_EXAM_COMPLETED':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />待确认</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (applicationsLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总报名人数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalApplications || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已录入成绩</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.gradedApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalApplications ? 
                `${((statistics.gradedApplications / statistics.totalApplications) * 100).toFixed(1)}%` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缺考人数</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.absentApplications || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面试资格人数</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.interviewEligibleCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              通过率: {statistics?.passRate ? `${statistics.passRate.toFixed(1)}%` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>批量操作</CardTitle>
          <CardDescription>对所有笔试完成的申请进行批量处理</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => confirmInterviewMutation.mutate()}
            disabled={confirmInterviewMutation.isPending}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            批量确认面试资格
          </Button>
        </CardContent>
      </Card>

      {/* Scores Table */}
      <Card>
        <CardHeader>
          <CardTitle>成绩管理</CardTitle>
          <CardDescription>录入和管理考生成绩</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报名编号</TableHead>
                <TableHead>考生姓名</TableHead>
                <TableHead>报考岗位</TableHead>
                {subjects?.map((subject) => (
                  <TableHead key={subject.id}>{subject.name}</TableHead>
                ))}
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.applicationNo}</TableCell>
                  <TableCell>{application.candidateName}</TableCell>
                  <TableCell>{application.positionName}</TableCell>
                  {subjects?.map((subject) => (
                    <TableCell key={subject.id}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenScoreDialog(application, subject)}
                      >
                        录入成绩
                      </Button>
                    </TableCell>
                  ))}
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                </TableRow>
              ))}
              {!applications?.length && (
                <TableRow>
                  <TableCell colSpan={(subjects?.length || 0) + 4} className="text-center text-muted-foreground">
                    暂无报名数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Score Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>录入成绩</DialogTitle>
            <DialogDescription>
              考生: {selectedApplication?.candidateName} | 科目: {selectedSubject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="absent"
                checked={isAbsent}
                onChange={(e) => setIsAbsent(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="absent">标记为缺考</Label>
            </div>

            {!isAbsent && (
              <div className="space-y-2">
                <Label htmlFor="score">成绩 (满分: {selectedSubject?.maxScore})</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedSubject?.maxScore}
                  step="0.5"
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value)}
                  placeholder="请输入成绩"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="remarks">备注（可选）</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="输入备注信息"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitScore}
              disabled={recordScoreMutation.isPending || markAbsentMutation.isPending}
            >
              {recordScoreMutation.isPending || markAbsentMutation.isPending ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


