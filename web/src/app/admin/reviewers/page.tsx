'use client'

import { useEffect, useState } from 'react'
import { useExams } from '@/lib/api-hooks'
import { apiGet, apiPost } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function ReviewersPage() {
  const [selectedExamId, setSelectedExamId] = useState('')
  const [stage, setStage] = useState<'PRIMARY'|'SECONDARY'>('PRIMARY')
  const [reviewerIds, setReviewerIds] = useState<string[]>([])
  const [newReviewerId, setNewReviewerId] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: exams, isLoading: examsLoading } = useExams()

  const loadList = async () => {
    if (!selectedExamId) return
    try {
      const data = await apiGet<{ examId: string; stage: string; reviewerIds: string[] }>(`/exams/${selectedExamId}/reviewers${stage ? `?stage=${stage}` : ''}`)
      setReviewerIds((data as any).reviewerIds || [])
    } catch {
      setReviewerIds([])
    }
  }

  useEffect(() => { loadList() }, [selectedExamId, stage])

  const canAdd = selectedExamId && newReviewerId

  const handleAdd = async () => {
    if (!canAdd) return
    setLoading(true)
    try {
      await apiPost(`/exams/${selectedExamId}/reviewers`, { reviewerId: newReviewerId, stage })
      setNewReviewerId('')
      await loadList()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">审核员管理</h1>
        <p className="text-gray-600">为考试分配审核员（按阶段 PRIMARY/SECONDARY）。后续将补充从用户列表选择。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">选择考试</label>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger>
              <SelectValue placeholder={examsLoading ? '加载中…' : '请选择考试'} />
            </SelectTrigger>
            <SelectContent>
              {(exams?.content || []).map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>{exam.title}（{exam.code}）</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">阶段</label>
          <Select value={stage} onValueChange={(v) => setStage(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIMARY">PRIMARY</SelectItem>
              <SelectItem value="SECONDARY">SECONDARY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="font-medium">添加审核员</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label htmlFor="rid" className="block text-sm text-gray-600 mb-1">审核员用户ID（UUID）</label>
            <Input id="rid" value={newReviewerId} onChange={(e) => setNewReviewerId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={!canAdd || loading}>
              {loading ? '添加中...' : '添加'}
            </Button>
          </div>
        </div>
      </div>

      {selectedExamId && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">当前审核员列表（{stage}）</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewerIds.map((id) => (
                <TableRow key={id}>
                  <TableCell>{id}</TableCell>
                </TableRow>
              ))}
              {reviewerIds.length === 0 && (
                <TableRow>
                  <TableCell className="text-gray-500">暂无数据</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
