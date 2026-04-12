'use client'

import { use, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPost, apiDelete } from '@/lib/api'
import { normalizePaginatedOrArray } from '@/lib/normalize-paginated-or-array'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, Download, Plus, Search, BarChart3, Edit, Trash2, Filter, X } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import Papa from 'papaparse'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ScoresPageProps {
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

interface Subject {
  id: string
  name: string
  type: string
  maxScore: number
  passingScore: number
  durationMinutes?: number
  weight?: number
  ordering?: number
  positionId?: string
  positionTitle?: string
}

interface Application {
  id: string
  applicationNo: string
  candidateName: string
  positionTitle: string
}

interface Position {
  id: string
  title: string
  code: string
}

interface Score {
  id: string
  applicationId: string
  subjectId: string
  score: number
  candidateName: string
  positionTitle: string
  subjectName: string
  totalScore: number
  isQualified: boolean
  isAbsent: boolean
  gradedAt: string
  remarks?: string
}

export default function ScoresPage({ params }: ScoresPageProps) {
  const { tenantSlug, examId } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { tenant } = useTenant()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [scoreValue, setScoreValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScore, setSelectedScore] = useState<Score | null>(null)

  // 筛选条件
  const [filterPosition, setFilterPosition] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterQualified, setFilterQualified] = useState<string>('all')
  const [filterAbsent, setFilterAbsent] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list')

  // Fetch exam details
  const { data: exam } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch positions
  const { data: positions } = useQuery<Position[]>({
    queryKey: ['positions', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Position[]>(`/exams/${examId}/positions`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Subject[]>(`/exams/${examId}/subjects`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch applications
  const { data: applications } = useQuery<Application[]>({
    queryKey: ['applications', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      const raw = await apiGetWithTenant<unknown>(
        `/exams/${examId}/applications?size=500`,
        tenant.id,
      )
      return normalizePaginatedOrArray<Application>(raw)
    },
    enabled: !!tenant?.id,
  })

  // Fetch scores
  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: ['scores', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Score[]>(`/exams/${examId}/scores`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Add score mutation
  const addScoreMutation = useMutation({
    mutationFn: async (data: { applicationId: string; subjectId: string; score: number }) => {
      return apiPost(`/scores`, data)
    },
    onSuccess: () => {
      toast.success('成绩录入成功')
      queryClient.invalidateQueries({ queryKey: ['scores', examId] })
      setIsAddDialogOpen(false)
      setSelectedApplication('')
      setSelectedSubject('')
      setScoreValue('')
    },
    onError: (error: any) => {
      toast.error(error?.message || '成绩录入失败')
    },
  })

  // Update score mutation
  const updateScoreMutation = useMutation({
    mutationFn: async (data: { scoreId: string; score: number; remarks?: string }) => {
      return apiPost(`/scores/${data.scoreId}/update`, {
        score: data.score,
        remarks: data.remarks
      })
    },
    onSuccess: () => {
      toast.success('成绩更新成功')
      queryClient.invalidateQueries({ queryKey: ['scores', examId] })
      setIsEditDialogOpen(false)
      setSelectedScore(null)
      setScoreValue('')
    },
    onError: (error: any) => {
      toast.error(error?.message || '成绩更新失败')
    },
  })

  // Delete score mutation
  const deleteScoreMutation = useMutation({
    mutationFn: async (scoreId: string) => {
      return apiDelete(`/scores/${scoreId}`)
    },
    onSuccess: () => {
      toast.success('成绩删除成功')
      queryClient.invalidateQueries({ queryKey: ['scores', examId] })
      setIsDeleteDialogOpen(false)
      setSelectedScore(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || '成绩删除失败')
    },
  })

  const handleAddScore = () => {
    if (!selectedApplication || !selectedSubject || !scoreValue) {
      toast.error('请填写完整信息')
      return
    }

    const score = parseFloat(scoreValue)
    if (isNaN(score) || score < 0) {
      toast.error('请输入有效的分数')
      return
    }

    addScoreMutation.mutate({
      applicationId: selectedApplication,
      subjectId: selectedSubject,
      score,
    })
  }

  const handleEditScore = () => {
    if (!selectedScore || !scoreValue) {
      toast.error('请填写完整信息')
      return
    }

    const score = parseFloat(scoreValue)
    if (isNaN(score) || score < 0) {
      toast.error('请输入有效的分数')
      return
    }

    updateScoreMutation.mutate({
      scoreId: selectedScore.id,
      score,
      remarks: selectedScore.remarks,
    })
  }

  const handleDeleteScore = () => {
    if (!selectedScore) return
    deleteScoreMutation.mutate(selectedScore.id)
  }

  const openEditDialog = (score: Score) => {
    setSelectedScore(score)
    setScoreValue(score.score.toString())
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (score: Score) => {
    setSelectedScore(score)
    setIsDeleteDialogOpen(true)
  }

  const clearFilters = () => {
    setFilterPosition('all')
    setFilterSubject('all')
    setFilterQualified('all')
    setFilterAbsent('all')
    setSearchTerm('')
  }

  const handleExport = async () => {
    if (!tenant?.id) {
      toast.error('请先选择租户')
      return
    }

    try {
      toast.loading('正在导出成绩...', { id: 'export' })
      
      // 调用后端API导出Excel
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/v1'
      const url = `${API_BASE}/scores/exam/${examId}/export`
      
      // 获取token
      const token = typeof window !== 'undefined' 
        ? (localStorage.getItem('token') || sessionStorage.getItem('token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1])
        : null
      
      const headers: Record<string, string> = {
        'X-Tenant-ID': tenant.id,
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`导出失败: ${response.statusText}`)
      }
      
      // 获取文件名（从Content-Disposition头或使用默认名称）
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `成绩表_${exam?.title || examId}_${new Date().toISOString().split('T')[0]}.xlsx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
          // 处理UTF-8编码的文件名
          if (filename.startsWith('UTF-8\'\'')) {
            filename = decodeURIComponent(filename.replace(/^UTF-8''/, ''))
          }
        }
      }
      
      // 下载文件
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
      
      toast.success('导出成功', { id: 'export' })
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : '导出失败，请重试', { id: 'export' })
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      {
        applicationNo: '示例报名编号',
        subjectCode: '示例科目代码',
        score: '示例分数',
      },
    ]

    const csv = Papa.unparse(template, {
      quotes: true,
      delimiter: ',',
      header: true,
    })

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '成绩导入模板.csv'
    link.click()
    URL.revokeObjectURL(url)

    toast.success('模板下载成功')
  }

  // Filter scores with advanced filters
  const filteredScores = useMemo(() => {
    return scores?.filter((score) => {
      // 搜索过滤
      const matchesSearch =
        score.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        score.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        score.subjectName.toLowerCase().includes(searchTerm.toLowerCase())

      // 岗位过滤
      const matchesPosition = filterPosition === 'all' || score.positionTitle === filterPosition

      // 科目过滤
      const matchesSubject = filterSubject === 'all' || score.subjectName === filterSubject

      // 及格状态过滤
      const matchesQualified =
        filterQualified === 'all' ||
        (filterQualified === 'qualified' && score.isQualified) ||
        (filterQualified === 'unqualified' && !score.isQualified)

      // 缺考状态过滤
      const matchesAbsent =
        filterAbsent === 'all' ||
        (filterAbsent === 'absent' && score.isAbsent) ||
        (filterAbsent === 'present' && !score.isAbsent)

      return matchesSearch && matchesPosition && matchesSubject && matchesQualified && matchesAbsent
    })
  }, [scores, searchTerm, filterPosition, filterSubject, filterQualified, filterAbsent])

  // Group scores by candidate
  const groupedScores = useMemo(() => {
    if (!filteredScores) return []

    const groups = new Map<string, Score[]>()
    filteredScores.forEach((score) => {
      const key = `${score.applicationId}-${score.candidateName}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(score)
    })

    return Array.from(groups.entries()).map(([key, scores]) => ({
      candidateName: scores[0].candidateName,
      positionTitle: scores[0].positionTitle,
      scores,
      totalScore: scores.reduce((sum, s) => sum + (s.isAbsent ? 0 : s.score), 0),
      hasAbsent: scores.some((s) => s.isAbsent),
    }))
  }, [filteredScores])

  // Get unique positions and subjects for filters
  const uniquePositions = useMemo(() => {
    if (!scores) return []
    return Array.from(new Set(scores.map((s) => s.positionTitle)))
  }, [scores])

  const uniqueSubjects = useMemo(() => {
    if (!scores) return []
    return Array.from(new Set(scores.map((s) => s.subjectName)))
  }, [scores])

  // Check if any filter is active
  const hasActiveFilters =
    filterPosition !== 'all' ||
    filterSubject !== 'all' ||
    filterQualified !== 'all' ||
    filterAbsent !== 'all' ||
    searchTerm !== ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回考试详情
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">成绩管理</h1>
          <p className="text-muted-foreground">{exam?.title}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/scores/statistics`)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            成绩统计
          </Button>
          <Button
            onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/scores/record`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            成绩录入
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            下载模板
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出成绩
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/scores/import`)}
          >
            <Upload className="h-4 w-4 mr-2" />
            批量导入
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                快速录入
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>录入成绩</DialogTitle>
                <DialogDescription>为考生录入单科成绩</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>选择考生</Label>
                  <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择考生" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications?.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.candidateName} - {app.positionTitle} ({app.applicationNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>选择科目</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} (总分: {subject.maxScore})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>分数</Label>
                  <Input
                    type="number"
                    placeholder="请输入分数"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(e.target.value)}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddScore} disabled={addScoreMutation.isPending}>
                  {addScoreMutation.isPending ? '录入中...' : '确定'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>筛选与搜索</CardTitle>
              <CardDescription>使用筛选条件快速查找成绩</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                清除筛选
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索考生姓名、岗位、科目..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Position Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">岗位</Label>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部岗位</SelectItem>
                  {uniquePositions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">科目</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部科目</SelectItem>
                  {uniqueSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Qualified Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">及格状态</Label>
              <Select value={filterQualified} onValueChange={setFilterQualified}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="qualified">及格</SelectItem>
                  <SelectItem value="unqualified">不及格</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Absent Filter */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">缺考状态</Label>
              <Select value={filterAbsent} onValueChange={setFilterAbsent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="present">正常参考</SelectItem>
                  <SelectItem value="absent">缺考</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">显示模式:</Label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                列表视图
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grouped')}
              >
                按考生分组
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores List */}
      <Card>
        <CardHeader>
          <CardTitle>成绩列表</CardTitle>
          <CardDescription>
            {viewMode === 'list'
              ? `共 ${filteredScores?.length || 0} 条记录`
              : `共 ${groupedScores.length} 名考生`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredScores || filteredScores.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? '没有符合筛选条件的成绩' : '暂无成绩数据'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>考试科目</TableHead>
                    <TableHead>得分</TableHead>
                    <TableHead>总分</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>录入时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell className="font-medium">{score.candidateName}</TableCell>
                      <TableCell>{score.positionTitle}</TableCell>
                      <TableCell>{score.subjectName}</TableCell>
                      <TableCell className="font-mono">
                        {score.isAbsent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          score.score
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{score.totalScore}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {score.isAbsent ? (
                            <Badge variant="secondary">缺考</Badge>
                          ) : score.isQualified ? (
                            <Badge variant="default" className="bg-green-600">
                              及格
                            </Badge>
                          ) : (
                            <Badge variant="destructive">不及格</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {score.gradedAt
                          ? new Date(score.gradedAt).toLocaleString('zh-CN')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(score)}
                            disabled={score.isAbsent}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(score)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedScores.map((group, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.candidateName}</CardTitle>
                        <CardDescription>{group.positionTitle}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{group.totalScore.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">总分</div>
                        {group.hasAbsent && (
                          <Badge variant="secondary" className="mt-1">
                            有缺考
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>科目</TableHead>
                          <TableHead>得分</TableHead>
                          <TableHead>满分</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.scores.map((score) => (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{score.subjectName}</TableCell>
                            <TableCell className="font-mono">
                              {score.isAbsent ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                score.score
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {score.totalScore}
                            </TableCell>
                            <TableCell>
                              {score.isAbsent ? (
                                <Badge variant="secondary">缺考</Badge>
                              ) : score.isQualified ? (
                                <Badge variant="default" className="bg-green-600">
                                  及格
                                </Badge>
                              ) : (
                                <Badge variant="destructive">不及格</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(score)}
                                  disabled={score.isAbsent}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(score)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Edit Score Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑成绩</DialogTitle>
            <DialogDescription>修改考生的科目成绩</DialogDescription>
          </DialogHeader>
          {selectedScore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">考生姓名</Label>
                  <div className="font-medium">{selectedScore.candidateName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">报考岗位</Label>
                  <div className="font-medium">{selectedScore.positionTitle}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">考试科目</Label>
                  <div className="font-medium">{selectedScore.subjectName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">满分</Label>
                  <div className="font-medium">{selectedScore.totalScore}</div>
                </div>
              </div>
              <div>
                <Label>新分数</Label>
                <Input
                  type="number"
                  placeholder="请输入分数"
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value)}
                  min="0"
                  max={selectedScore.totalScore}
                  step="0.5"
                />
              </div>
              {selectedScore.remarks && (
                <div>
                  <Label className="text-muted-foreground">原备注</Label>
                  <div className="text-sm">{selectedScore.remarks}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedScore(null)
                setScoreValue('')
              }}
            >
              取消
            </Button>
            <Button onClick={handleEditScore} disabled={updateScoreMutation.isPending}>
              {updateScoreMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Score Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除成绩？</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedScore && (
                <div className="space-y-2 mt-2">
                  <p>您即将删除以下成绩记录：</p>
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">考生：</span>
                      <span className="font-medium ml-2">{selectedScore.candidateName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">科目：</span>
                      <span className="font-medium ml-2">{selectedScore.subjectName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">分数：</span>
                      <span className="font-medium ml-2">
                        {selectedScore.isAbsent ? '缺考' : selectedScore.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-destructive font-medium">此操作不可撤销！</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedScore(null)
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScore}
              disabled={deleteScoreMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteScoreMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

