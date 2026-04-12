'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useExamPositions, useDeletePosition, useDeleteSubject } from '@/lib/api-hooks'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiGetWithTenant } from '@/lib/api'
import { Plus, Users, BookOpen, Clock, Award, TrendingUp, Calendar, Edit, Trash2, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import CreateSubjectDialog from '@/components/admin/CreateSubjectDialog'
import EditSubjectDialog from '@/components/admin/EditSubjectDialog'
import CreatePositionDialog from './CreatePositionDialog'
import EditPositionDialog from './EditPositionDialog'
import { useTenant } from '@/hooks/useTenant'

interface ExamPositionsAndSubjectsProps {
  examId: string
}

export default function ExamPositionsAndSubjects({ examId }: ExamPositionsAndSubjectsProps) {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [selectedPositionId, setSelectedPositionId] = useState<string>('')
  const [createSubjectDialogOpen, setCreateSubjectDialogOpen] = useState(false)
  const [createPositionDialogOpen, setCreatePositionDialogOpen] = useState(false)
  const [editPositionDialogOpen, setEditPositionDialogOpen] = useState(false)
  const [editSubjectDialogOpen, setEditSubjectDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

  const { tenant } = useTenant()
  const { data: positions, isLoading: positionsLoading, refetch: refetchPositions } = useExamPositions(examId, tenant?.id)
  const deletePositionMutation = useDeletePosition()
  const deleteSubjectMutation = useDeleteSubject()

  const { data: subjects, isLoading: subjectsLoading, refetch: refetchSubjects } = useQuery<any[]>({
    queryKey: ['subjects', selectedPositionId, tenant?.id],
    queryFn: async () => {
      if (!selectedPositionId || !tenant?.id) return []
      return await apiGetWithTenant(`/exams/positions/${selectedPositionId}/subjects`, tenant.id)
    },
    enabled: !!selectedPositionId && !!tenant?.id
  })

  const currentPosition = positions?.find((p: any) => p.id === selectedPositionId)

  const handleEditPosition = (position: any) => {
    setSelectedPosition(position)
    setEditPositionDialogOpen(true)
  }

  const handleDeletePosition = async (position: any) => {
    if (!confirm(`确定要删除岗位"${position.title || position.name}"吗？删除后将无法恢复。`)) {
      return
    }

    if (!tenant?.id) {
      toast.error('租户信息缺失')
      return
    }

    try {
      await deletePositionMutation.mutateAsync({
        id: position.id,
        tenantId: tenant.id,
      })
      toast.success('岗位删除成功')
      if (selectedPositionId === position.id) {
        setSelectedPositionId('')
      }
      refetchPositions()
    } catch (error: any) {
      toast.error(error?.message || '删除失败')
    }
  }

  const handleEditSubject = (subject: any) => {
    setSelectedSubject(subject)
    setEditSubjectDialogOpen(true)
  }

  const handleDeleteSubject = async (subject: any) => {
    if (!confirm(`确定要删除科目"${subject.name}"吗？删除后将无法恢复。`)) {
      return
    }

    if (!tenant?.id) {
      toast.error('租户信息缺失')
      return
    }

    try {
      await deleteSubjectMutation.mutateAsync({
        subjectId: subject.id,
        tenantId: tenant.id,
      })
      toast.success('科目删除成功')
      refetchSubjects()
    } catch (error: any) {
      toast.error(error?.message || '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 岗位列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>招聘岗位</CardTitle>
              <CardDescription>本次考试的所有招聘岗位</CardDescription>
            </div>
            <Button onClick={() => setCreatePositionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加岗位
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {positionsLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : !positions || positions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无岗位</p>
              <p className="text-xs text-muted-foreground mt-1">点击"添加岗位"按钮创建岗位</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position: any) => (
                <div
                  key={position.id}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedPositionId === position.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedPositionId(position.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPositionId(position.id); } }}
                    aria-label={`岗位 ${position.title || position.name}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{position.title || position.name}</h3>
                      {position.code && (
                        <Badge variant="outline" className="text-xs">{position.code}</Badge>
                      )}
                    </div>
                    {position.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {position.description}
                      </p>
                    )}
{position.quota != null && (
                        <p className="text-xs text-muted-foreground mb-3">
                        招聘人数: {position.quota}人
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditPosition(position)
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/${tenantSlug}/admin/exams/${examId}/positions/${position.id}/rules`)
                      }}
                      className="flex-1"
                      title="配置岗位级别自动审核规则"
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      规则
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePosition(position)
                      }}
                      disabled={deletePositionMutation.isPending}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 科目列表 */}
      {selectedPositionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>考试科目</CardTitle>
                <CardDescription>
                  {currentPosition?.title || currentPosition?.name} 的所有考试科目
                </CardDescription>
              </div>
              <Button onClick={() => setCreateSubjectDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建科目
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subjectsLoading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : !subjects || subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">暂无科目</p>
                <p className="text-xs text-muted-foreground mt-1">点击"创建科目"按钮添加科目</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject: any) => (
                  <div key={subject.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{subject.name}</span>
                          <Badge variant={subject.type === 'WRITTEN' ? 'default' : 'secondary'}>
                            {subject.type === 'WRITTEN' ? '笔试' : '面试'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>时长: {subject.duration || subject.durationMinutes}分钟</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Award className="h-4 w-4" />
                            <span>满分: {subject.maxScore}分</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>及格: {subject.passingScore}分</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>权重: {subject.weight}</span>
                          </div>
                        </div>

                        {subject.schedule && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4" />
                            <span>考试时间: {subject.schedule}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-muted-foreground mr-2">排序: {subject.ordering}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSubject(subject)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject)}
                          disabled={deleteSubjectMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 创建岗位对话框 */}
      <CreatePositionDialog
        open={createPositionDialogOpen}
        onOpenChange={setCreatePositionDialogOpen}
        examId={examId}
        onSuccess={() => {
          refetchPositions()
          setCreatePositionDialogOpen(false)
        }}
      />

      {/* 编辑岗位对话框 */}
      {selectedPosition && (
        <EditPositionDialog
          open={editPositionDialogOpen}
          onOpenChange={setEditPositionDialogOpen}
          position={selectedPosition}
          tenantId={tenant?.id || ''}
          onSuccess={() => {
            refetchPositions()
            setEditPositionDialogOpen(false)
            setSelectedPosition(null)
          }}
        />
      )}

      {/* 创建科目对话框 */}
      {selectedPositionId && currentPosition && (
        <CreateSubjectDialog
          open={createSubjectDialogOpen}
          onOpenChange={setCreateSubjectDialogOpen}
          positionId={selectedPositionId}
          positionTitle={currentPosition.title || currentPosition.name || ''}
          onSuccess={() => refetchSubjects()}
        />
      )}

      {/* 编辑科目对话框 */}
      {selectedSubject && (
        <EditSubjectDialog
          open={editSubjectDialogOpen}
          onOpenChange={setEditSubjectDialogOpen}
          subject={selectedSubject}
          onSuccess={() => {
            refetchSubjects()
            setEditSubjectDialogOpen(false)
            setSelectedSubject(null)
          }}
        />
      )}
    </div>
  )
}

