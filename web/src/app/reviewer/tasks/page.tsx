"use client"

import { useState, useEffect, useMemo } from 'react'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import {
  useReviewQueue,
  usePullReviewTask,
  useReviewTaskDecision,
  useReviewTaskHeartbeat,
  useReviewTaskRelease,
  useExams,
  useExamPositions,
} from '@/lib/api-hooks'


export default function ReviewerTasksPage() {
  const [examId, setExamId] = useState<string>('')
  const [stage, setStage] = useState<'PRIMARY'|'SECONDARY'>('PRIMARY')
  const { data: examsPaged } = useExams({})
  const examOptions = useMemo(() => ((examsPaged as any)?.content ?? []), [examsPaged])
  useEffect(() => {
    if (!examId && examOptions.length > 0) setExamId(examOptions[0].id)
  }, [examOptions, examId])
  const { data: positions } = useExamPositions(examId)
  const positionOptions = useMemo(() => ((positions as any) ?? []), [positions])
  const [positionId, setPositionId] = useState<string>('')

  const router = useRouter()
  const errorHandler = useErrorHandler()

  const [status, setStatus] = useState<'ALL'|'OPEN'|'ASSIGNED'>('ALL')
  const { data, isLoading, error, refetch } = useReviewQueue({ examId, stage, positionId: positionId || undefined, status, enabled: !!examId })
  const pull = usePullReviewTask()
  const approve = useReviewTaskDecision()
  const reject = useReviewTaskDecision()
  const heartbeat = useReviewTaskHeartbeat()
  const release = useReviewTaskRelease()

  if (error) errorHandler.handleError(error)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的审核任务</h1>
          <p className="text-gray-600">展示当前占用或待处理的审核任务</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <div className="mt-2 flex items-center gap-3">
            <select
              value={examId}
              onChange={(e)=>setExamId(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">请选择考试</option>
              {examOptions.map((ex: any) => (
                <option key={ex.id} value={ex.id}>{ex.title || ex.name || ex.code || ex.id}</option>
              ))}
            </select>
            <select
              value={stage}
              onChange={(e)=>setStage(e.target.value as any)}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="PRIMARY">初审</option>
              <option value="SECONDARY">复审</option>
            </select>
            <select
              value={positionId}
              onChange={(e)=>setPositionId(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              disabled={!examId}
            >
              <option value="">全部岗位</option>
              {positionOptions.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title || p.name || p.code || p.id}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e)=>setStatus(e.target.value as any)}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="ALL">全部</option>
              <option value="OPEN">待占用</option>
              <option value="ASSIGNED">已占用</option>
            </select>

            <Button size="sm" disabled={!examId} onClick={async ()=>{ await pull.mutateAsync({ examId, stage, positionId: positionId || undefined }); refetch() }}>拉取任务</Button>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            if (isLoading) return <div className="text-gray-500">加载中...</div>
            const items = (data as any)?.content
            if (!data || (Array.isArray(items) && items.length === 0)) return <div className="text-gray-500">暂无任务</div>
            return (
              <div className="space-y-3">
                {(data as any).content?.map((item: any) => (
                  <div key={item.taskId || item.applicationId} className="flex items-center justify-between p-3 border rounded-md bg-white">
                    <div>
                      <div className="font-medium text-gray-900">申请 {item.applicationId}</div>
                      <div className="text-sm text-gray-500">阶段：{item.stage || 'PRIMARY'}</div>
                      {item.taskId && <div className="text-xs text-gray-400">任务ID：{item.taskId}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => router.push(`/reviewer/applications/${item.applicationId}`)}>查看</Button>
                      {item.taskId && (
                        <>
                          <Button size="sm" onClick={async()=>{ await heartbeat.mutateAsync({ taskId: item.taskId }); }}>心跳</Button>
                          <Button size="sm" variant="outline" onClick={async()=>{ await release.mutateAsync({ taskId: item.taskId }); refetch() }}>释放</Button>
                          <Button size="sm" onClick={async()=>{ await approve.mutateAsync({ taskId: item.taskId, decision: 'APPROVE' }); refetch() }}>通过</Button>
                          <Button size="sm" variant="destructive" onClick={async()=>{ await reject.mutateAsync({ taskId: item.taskId, decision: 'REJECT' }); refetch() }}>驳回</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}

