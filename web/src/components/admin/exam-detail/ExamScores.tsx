'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
import { normalizePaginatedOrArray } from '@/lib/normalize-paginated-or-array'
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
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit
} from 'lucide-react'
import { useTenant } from '@/hooks/useTenant'
import { Checkbox } from '@/components/ui/checkbox'

interface Application {
  id: string
  applicationNumber: string
  candidateName: string
  positionTitle: string
  positionId: string
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
  remarks?: string
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
  const { tenant } = useTenant()

  // 获取考试的所有报名
  const { data: allApplications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['exam-applications', examId],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      const raw = await apiGetWithTenant<unknown>(
        `/exams/${examId}/applications?size=500`,
        tenant.id,
      )
      return normalizePaginatedOrArray<Application>(raw)
    },
    enabled: !!tenant?.id,
  })

  // 过滤：只显示已审核通过并参加考试的考生
  // 状态包括：APPROVED, PAID, TICKET_ISSUED, WRITTEN_EXAM_COMPLETED, INTERVIEW_ELIGIBLE, WRITTEN_EXAM_FAILED
  const applications = useMemo(() => {
    if (!allApplications) return []
    const eligibleStatuses = [
      'APPROVED',
      'PAID',
      'TICKET_ISSUED',
      'WRITTEN_EXAM_COMPLETED',
      'INTERVIEW_ELIGIBLE',
      'WRITTEN_EXAM_FAILED'
    ]
    return allApplications.filter(app => eligibleStatuses.includes(app.status))
  }, [allApplications])

  // 获取考试的所有成绩
  const { data: allScores, isLoading: scoresLoading } = useQuery<Score[]>({
    queryKey: ['exam-scores', examId],
    queryFn: () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      return apiGetWithTenant<Score[]>(`/scores/exam/${examId}`, tenant.id)
    },
    enabled: !!tenant?.id && !!examId,
  })

  // 构建成绩映射：applicationId -> subjectId -> Score
  const scoresMap = useMemo(() => {
    if (!allScores) return new Map<string, Map<string, Score>>()
    const map = new Map<string, Map<string, Score>>()
    allScores.forEach(score => {
      if (!map.has(score.applicationId)) {
        map.set(score.applicationId, new Map())
      }
      map.get(score.applicationId)!.set(score.subjectId, score)
    })
    return map
  }, [allScores])

  // 获取考试的所有岗位
  const { data: positions, isLoading: positionsLoading } = useQuery<any[]>({
    queryKey: ['exam-positions', examId, tenant?.id],
    queryFn: () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      return apiGetWithTenant<any[]>(`/exams/${examId}/positions`, tenant.id)
    },
    enabled: !!tenant?.id && !!examId,
  })

  // 获取所有岗位的科目（合并去重）
  const { data: allSubjectsFromPositions, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ['exam-all-subjects', examId, positions?.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!tenant?.id || !positions || positions.length === 0) {
        return []
      }
      
      // 从每个岗位获取科目
      const subjectsMap = new Map<string, Subject>()
      
      for (const position of positions) {
        try {
          const positionSubjects = await apiGetWithTenant<Subject[]>(
            `/exams/positions/${position.id}/subjects`,
            tenant.id
          )
          
          // 合并科目（去重，使用科目ID作为key）
          positionSubjects.forEach(subject => {
            if (!subjectsMap.has(subject.id)) {
              subjectsMap.set(subject.id, subject)
            }
          })
        } catch (error) {
          console.error(`Failed to fetch subjects for position ${position.id}:`, error)
          // 继续处理其他岗位
        }
      }
      
      return Array.from(subjectsMap.values())
    },
    enabled: !!tenant?.id && !!positions && positions.length > 0,
  })

  // 使用合并后的科目列表
  const subjects = allSubjectsFromPositions

  // 获取成绩统计
  const { data: statistics } = useQuery<ScoreStatistics>({
    queryKey: ['exam-score-statistics', examId],
    queryFn: () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      return apiGetWithTenant<ScoreStatistics>(`/exams/${examId}/scores/statistics`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // 录入成绩
  const recordScoreMutation = useMutation({
    mutationFn: (data: { applicationId: string; subjectId: string; score: number; remarks?: string }) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPostWithTenant('/scores/record', tenant.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-applications', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-scores', examId] })
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
    mutationFn: (data: { applicationId: string; subjectId: string; remarks?: string }) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPostWithTenant('/scores/record', tenant.id, {
        ...data,
        isAbsent: true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-applications', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-scores', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-score-statistics', examId] })
      toast.success('缺考标记成功')
      setScoreDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || '缺考标记失败')
    },
  })

  // 单个确认面试资格
  const updateInterviewEligibilityMutation = useMutation({
    mutationFn: (applicationId: string) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPostWithTenant(`/scores/application/${applicationId}/update-interview-eligibility`, tenant.id, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-applications', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-score-statistics', examId] })
      toast.success('面试资格确认成功')
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

  // 计算申请的总分
  const calculateTotalScore = (applicationId: string): number => {
    const appScores = scoresMap.get(applicationId)
    if (!appScores) return 0
    let total = 0
    appScores.forEach(score => {
      if (!score.isAbsent) {
        total += score.score
      }
    })
    return total
  }

  // 检查是否所有科目都有成绩
  const hasAllScores = (applicationId: string): boolean => {
    if (!subjects || subjects.length === 0) return false
    const appScores = scoresMap.get(applicationId)
    if (!appScores) return false
    return subjects.every(subject => appScores.has(subject.id))
  }

  const handleOpenScoreDialog = (application: Application, subject: Subject) => {
    setSelectedApplication(application)
    setSelectedSubject(subject)
    
    // 如果已有成绩，填充表单
    const appScores = scoresMap.get(application.id)
    const existingScore = appScores?.get(subject.id)
    
    if (existingScore) {
      setIsAbsent(existingScore.isAbsent)
      setScoreValue(existingScore.isAbsent ? '' : existingScore.score.toString())
      setRemarks(existingScore.remarks || '')
    } else {
      setIsAbsent(false)
      setScoreValue('')
      setRemarks('')
    }
    
    setScoreDialogOpen(true)
  }

  const handleInterviewEligibilityChange = (applicationId: string, checked: boolean) => {
    if (checked) {
      // 确认面试资格
      updateInterviewEligibilityMutation.mutate(applicationId)
    } else {
      // 取消面试资格 - 需要调用相应的API
      // 注意：根据业务逻辑，可能需要将状态改回 WRITTEN_EXAM_COMPLETED
      // 这里先提示用户，如果需要取消功能，需要后端提供相应API
      toast.info('如需取消面试资格，请联系系统管理员')
    }
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
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />可面试</Badge>
      case 'WRITTEN_EXAM_FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />笔试未通过</Badge>
      case 'WRITTEN_EXAM_COMPLETED':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />笔试完成</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-blue-50"><CheckCircle2 className="h-3 w-3 mr-1" />已审核通过</Badge>
      case 'PAID':
        return <Badge variant="outline" className="bg-blue-50"><CheckCircle2 className="h-3 w-3 mr-1" />已缴费</Badge>
      case 'TICKET_ISSUED':
        return <Badge variant="outline" className="bg-blue-50"><CheckCircle2 className="h-3 w-3 mr-1" />已发证</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (applicationsLoading || positionsLoading || subjectsLoading || scoresLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // 如果没有岗位，显示提示
  if (!positions || positions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>成绩管理</CardTitle>
            <CardDescription>录入和管理考生成绩</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-medium mb-2">请先配置考试岗位</p>
              <p className="text-sm">在"岗位与科目"标签页中创建岗位并配置科目</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果没有科目，显示提示
  if (!subjects || subjects.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>成绩管理</CardTitle>
            <CardDescription>录入和管理考生成绩</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-medium mb-2">请先为岗位配置科目</p>
              <p className="text-sm">在"岗位与科目"标签页中为各个岗位添加科目</p>
            </div>
          </CardContent>
        </Card>
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

      {/* Scores Table */}
      <Card>
        <CardHeader>
          <CardTitle>成绩管理</CardTitle>
          <CardDescription>录入和管理考生成绩（仅显示已审核通过并参加考试的考生）</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报名编号</TableHead>
                <TableHead>考生姓名</TableHead>
                <TableHead>报考岗位</TableHead>
                {subjects?.map((subject) => (
                  <TableHead key={subject.id} className="text-center">{subject.name}</TableHead>
                ))}
                <TableHead className="text-center">总分</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-center">是否参与面试</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications && applications.length > 0 ? (
                applications.map((application) => {
                  const appScores = scoresMap.get(application.id)
                  const totalScore = calculateTotalScore(application.id)
                  const allScoresEntered = hasAllScores(application.id)
                  
                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.applicationNumber || application.id.substring(0, 8)}</TableCell>
                      <TableCell>{application.candidateName || '未知考生'}</TableCell>
                      <TableCell>{application.positionTitle || '未知岗位'}</TableCell>
                      {subjects.map((subject) => {
                        const score = appScores?.get(subject.id)
                        return (
                          <TableCell key={subject.id} className="text-center">
                            {score ? (
                              <div className="flex flex-col items-center gap-1">
                                {score.isAbsent ? (
                                  <Badge variant="destructive" className="text-xs">缺考</Badge>
                                ) : (
                                  <span className="font-medium text-lg">{score.score}</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleOpenScoreDialog(application, subject)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  修改
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleOpenScoreDialog(application, subject)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                录入成绩
                              </Button>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center font-bold text-lg">
                        {allScoresEntered ? totalScore.toFixed(1) : '-'}
                      </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Checkbox
                          id={`interview-${application.id}`}
                          checked={application.status === 'INTERVIEW_ELIGIBLE'}
                          disabled={
                            updateInterviewEligibilityMutation.isPending ||
                            !allScoresEntered ||
                            application.status === 'WRITTEN_EXAM_FAILED' ||
                            application.status === 'INTERVIEW_COMPLETED' ||
                            application.status === 'FINAL_ACCEPTED' ||
                            application.status === 'FINAL_REJECTED'
                          }
                          onCheckedChange={(checked) => {
                            if (checked && application.status !== 'INTERVIEW_ELIGIBLE') {
                              handleInterviewEligibilityChange(application.id, true)
                            } else if (!checked && application.status === 'INTERVIEW_ELIGIBLE') {
                              handleInterviewEligibilityChange(application.id, false)
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`interview-${application.id}`}
                          className="text-sm cursor-pointer"
                          onClick={(e) => {
                            // 允许点击标签来切换复选框（如果复选框未禁用）
                            if (!updateInterviewEligibilityMutation.isPending &&
                                allScoresEntered &&
                                application.status !== 'WRITTEN_EXAM_FAILED' &&
                                application.status !== 'INTERVIEW_COMPLETED' &&
                                application.status !== 'FINAL_ACCEPTED' &&
                                application.status !== 'FINAL_REJECTED') {
                              e.preventDefault()
                              const checkbox = document.getElementById(`interview-${application.id}`) as HTMLInputElement
                              if (checkbox && !checkbox.disabled) {
                                checkbox.click()
                              }
                            }
                          }}
                        >
                          {!allScoresEntered ? (
                            <span className="text-muted-foreground">成绩未完整</span>
                          ) : application.status === 'INTERVIEW_ELIGIBLE' ? (
                            <span className="text-green-600 font-medium">已确认</span>
                          ) : application.status === 'WRITTEN_EXAM_FAILED' ? (
                            <span className="text-red-600">未通过</span>
                          ) : (
                            <span className="text-muted-foreground cursor-pointer hover:text-primary">待确认</span>
                          )}
                        </Label>
                      </div>
                    </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={(subjects?.length || 0) + 6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-8 w-8" />
                      <p className="font-medium">暂无符合条件的考生数据</p>
                      <p className="text-sm">请确保有考生已通过审核并参加考试</p>
                      <p className="text-xs">符合条件的状态：已审核通过、已缴费、已发放准考证、笔试完成等</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Score Dialog - 成绩录入/修改对话框 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedSubject && selectedApplication && scoresMap.get(selectedApplication.id)?.get(selectedSubject.id) 
                ? '修改成绩' 
                : '录入成绩'}
            </DialogTitle>
            <DialogDescription className="text-base">
              <div className="space-y-1 mt-2">
                <p><span className="font-medium">考生：</span>{selectedApplication?.candidateName || '未知'}</p>
                <p><span className="font-medium">科目：</span>{selectedSubject?.name || '未知'} 
                  {selectedSubject?.maxScore && <span className="text-muted-foreground"> (满分: {selectedSubject.maxScore})</span>}
                </p>
                <p><span className="font-medium">报名编号：</span>{selectedApplication?.applicationNumber || selectedApplication?.id?.substring(0, 8)}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 p-3 border rounded-md">
              <input
                type="checkbox"
                id="absent"
                checked={isAbsent}
                onChange={(e) => {
                  setIsAbsent(e.target.checked)
                  if (e.target.checked) {
                    setScoreValue('')
                  }
                }}
                className="h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="absent" className="cursor-pointer font-medium">
                标记为缺考
              </Label>
            </div>

            {!isAbsent && (
              <div className="space-y-2">
                <Label htmlFor="score" className="text-base font-medium">
                  成绩 <span className="text-muted-foreground text-sm">(满分: {selectedSubject?.maxScore || 100})</span>
                </Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedSubject?.maxScore || 100}
                  step="0.5"
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value)}
                  placeholder={`请输入成绩 (0-${selectedSubject?.maxScore || 100})`}
                  className="text-lg h-12"
                  autoFocus
                />
                {selectedSubject?.maxScore && (
                  <p className="text-xs text-muted-foreground">
                    有效范围：0 - {selectedSubject.maxScore}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-base font-medium">
                备注 <span className="text-muted-foreground text-sm font-normal">(可选)</span>
              </Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="输入备注信息，如：表现优秀、需要关注等"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setScoreDialogOpen(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitScore}
              disabled={recordScoreMutation.isPending || markAbsentMutation.isPending || (!isAbsent && (!scoreValue || isNaN(parseFloat(scoreValue))))}
              className="min-w-[100px]"
            >
              {recordScoreMutation.isPending || markAbsentMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  提交中...
                </>
              ) : (
                '提交'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


