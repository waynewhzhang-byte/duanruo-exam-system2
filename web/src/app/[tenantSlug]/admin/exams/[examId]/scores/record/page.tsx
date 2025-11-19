'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useRecordScore, useMarkAbsent } from '@/lib/api-hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, UserX, Search, CheckCircle2, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'

interface RecordPageProps {
  params: Promise<{
    tenantSlug: string
    examId: string
  }>
}

interface Exam {
  id: string
  title: string
  status: string
}

interface Position {
  id: string
  title: string
  code: string
}

interface Subject {
  id: string
  name: string
  code: string
  totalScore: number
}

interface Application {
  id: string
  applicationNo: string
  candidateName: string
  candidateIdCard: string
  positionId: string
  positionTitle: string
  ticketNo?: string
}

interface ScoreEntry {
  subjectId: string
  score: string
  isAbsent: boolean
}

export default function ScoreRecordPage({ params }: RecordPageProps) {
  const { tenantSlug, examId } = use(params)
  const router = useRouter()

  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [scoreEntries, setScoreEntries] = useState<Record<string, ScoreEntry>>({})
  const [remarks, setRemarks] = useState('')

  const recordScoreMutation = useRecordScore()
  const markAbsentMutation = useMarkAbsent()

  // Fetch exam details
  const { data: exam } = useQuery<Exam>({
    queryKey: ['exam', examId],
    queryFn: async () => {
      return apiGet<Exam>(`/exams/${examId}`)
    },
  })

  // Fetch positions
  const { data: positions } = useQuery<Position[]>({
    queryKey: ['positions', examId],
    queryFn: async () => {
      return apiGet<Position[]>(`/exams/${examId}/positions`)
    },
  })

  // Fetch subjects for selected position
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects', 'position', selectedPosition],
    queryFn: async () => {
      if (!selectedPosition) return []
      return apiGet<Subject[]>(`/positions/${selectedPosition}/subjects`)
    },
    enabled: !!selectedPosition,
  })

  // Fetch applications for selected position
  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['applications', 'position', selectedPosition],
    queryFn: async () => {
      if (!selectedPosition) return []
      return apiGet<Application[]>(`/positions/${selectedPosition}/applications`)
    },
    enabled: !!selectedPosition,
  })

  // Initialize score entries when subjects change
  useState(() => {
    if (subjects && subjects.length > 0) {
      const entries: Record<string, ScoreEntry> = {}
      subjects.forEach((subject) => {
        entries[subject.id] = {
          subjectId: subject.id,
          score: '',
          isAbsent: false,
        }
      })
      setScoreEntries(entries)
    }
  })

  const handleScoreChange = (subjectId: string, value: string) => {
    setScoreEntries((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        score: value,
        isAbsent: false,
      },
    }))
  }

  const handleAbsentToggle = (subjectId: string) => {
    setScoreEntries((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        score: prev[subjectId].isAbsent ? '' : '0',
        isAbsent: !prev[subjectId].isAbsent,
      },
    }))
  }

  const handleSaveScores = async () => {
    if (!selectedApplication) {
      toast.error('请选择考生')
      return
    }

    const entriesToSave = Object.values(scoreEntries).filter(
      (entry) => entry.score !== '' || entry.isAbsent
    )

    if (entriesToSave.length === 0) {
      toast.error('请至少录入一个科目的成绩')
      return
    }

    try {
      // Save each score entry
      for (const entry of entriesToSave) {
        if (entry.isAbsent) {
          await markAbsentMutation.mutateAsync({
            applicationId: selectedApplication,
            subjectId: entry.subjectId,
            remarks: remarks || undefined,
          })
        } else {
          const score = parseFloat(entry.score)
          if (isNaN(score) || score < 0) {
            toast.error(`科目 ${entry.subjectId} 的分数无效`)
            continue
          }

          await recordScoreMutation.mutateAsync({
            applicationId: selectedApplication,
            subjectId: entry.subjectId,
            score,
            remarks: remarks || undefined,
          })
        }
      }

      toast.success('成绩录入成功')
      
      // Reset form
      setSelectedApplication('')
      setScoreEntries({})
      setRemarks('')
      
      // Reinitialize score entries
      if (subjects) {
        const entries: Record<string, ScoreEntry> = {}
        subjects.forEach((subject) => {
          entries[subject.id] = {
            subjectId: subject.id,
            score: '',
            isAbsent: false,
          }
        })
        setScoreEntries(entries)
      }
    } catch (error: any) {
      toast.error(error?.message || '成绩录入失败')
    }
  }

  // Filter applications
  const filteredApplications = applications?.filter((app) => {
    const matchesSearch =
      app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidateIdCard.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const selectedApp = applications?.find((app) => app.id === selectedApplication)

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/scores`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回成绩管理
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">成绩录入</h1>
          <p className="text-muted-foreground">{exam?.title}</p>
        </div>
      </div>

      {/* Position Selection */}
      <Card>
        <CardHeader>
          <CardTitle>选择岗位</CardTitle>
          <CardDescription>请先选择要录入成绩的岗位</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="请选择岗位" />
            </SelectTrigger>
            <SelectContent>
              {positions?.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.title} ({position.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Candidate Selection */}
      {selectedPosition && (
        <Card>
          <CardHeader>
            <CardTitle>选择考生</CardTitle>
            <CardDescription>
              {filteredApplications?.length || 0} 名考生
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索考生姓名、报名编号、身份证号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Candidate List */}
            {applicationsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : filteredApplications && filteredApplications.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>考生姓名</TableHead>
                      <TableHead>报名编号</TableHead>
                      <TableHead>身份证号</TableHead>
                      <TableHead>准考证号</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow
                        key={app.id}
                        className={`cursor-pointer ${
                          selectedApplication === app.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedApplication(app.id)}
                      >
                        <TableCell>
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              selectedApplication === app.id
                                ? 'bg-primary border-primary'
                                : 'border-gray-300'
                            }`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{app.candidateName}</TableCell>
                        <TableCell className="font-mono text-sm">{app.applicationNo}</TableCell>
                        <TableCell className="font-mono text-sm">{app.candidateIdCard}</TableCell>
                        <TableCell className="font-mono text-sm">{app.ticketNo || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无考生数据
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Score Entry Form */}
      {selectedApplication && selectedApp && subjects && subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>录入成绩</CardTitle>
            <CardDescription>
              考生: {selectedApp.candidateName} ({selectedApp.applicationNo})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subjects */}
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">{subject.name}</Label>
                    <p className="text-sm text-muted-foreground">
                      科目代码: {subject.code} | 满分: {subject.totalScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="分数"
                      value={scoreEntries[subject.id]?.score || ''}
                      onChange={(e) => handleScoreChange(subject.id, e.target.value)}
                      disabled={scoreEntries[subject.id]?.isAbsent}
                      className="w-24"
                      min="0"
                      max={subject.totalScore}
                      step="0.5"
                    />
                    <Button
                      variant={scoreEntries[subject.id]?.isAbsent ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleAbsentToggle(subject.id)}
                    >
                      {scoreEntries[subject.id]?.isAbsent ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          已缺考
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          标记缺考
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea
                placeholder="输入备注信息..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedApplication('')
                  setScoreEntries({})
                  setRemarks('')
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveScores}
                disabled={recordScoreMutation.isPending || markAbsentMutation.isPending}
              >
                {recordScoreMutation.isPending || markAbsentMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存成绩
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

