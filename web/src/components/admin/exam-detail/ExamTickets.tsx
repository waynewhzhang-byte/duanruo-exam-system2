'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPostWithTenant, apiPutWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Ticket, Users, CheckCircle2, AlertTriangle, Info, RefreshCw, Download, Eye, Settings, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { useTenant } from '@/hooks/useTenant'

interface ExamTicketsProps {
  examId: string
}

interface TicketInfo {
  id: string
  applicationId: string
  ticketNo: string
  candidateName: string
  positionTitle: string
  venueName: string
  roomNumber?: string
  seatNumber?: string
  status: string
  issuedAt: string
}

interface BatchIssueResult {
  totalCandidates: number
  issued: number
  notApproved?: number
  failed?: number
  feeRequired?: boolean
  message?: string
}

interface ExamInfo {
  id: string
  title: string
  code?: string
  status: string
  feeRequired: boolean
}

interface TicketNumberRule {
  prefix?: string
  dateFormat?: string
  sequenceLength?: number
  separator?: string
  includeExamCode?: boolean
  includePositionCode?: boolean
  checksumType?: string
}

export default function ExamTickets({ examId }: ExamTicketsProps) {
  const queryClient = useQueryClient()
  const [isIssuing, setIsIssuing] = useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const { tenant } = useTenant()

  // Rule form state
  const [ruleForm, setRuleForm] = useState<TicketNumberRule>({
    prefix: '',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    separator: '-',
    includeExamCode: true,
    includePositionCode: true,
    checksumType: 'NONE',
  })

  // Fetch exam info
  const { data: exam, isLoading: examLoading } = useQuery<ExamInfo>({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiGetWithTenant<ExamInfo>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Fetch issued tickets
  const { data: tickets, isLoading: ticketsLoading, refetch } = useQuery<TicketInfo[]>({
    queryKey: ['exam-tickets', examId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiGetWithTenant<TicketInfo[]>(`/tickets/exam/${examId}/list`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Fetch ticket number rule
  const { data: ticketRule, isLoading: ruleLoading } = useQuery<TicketNumberRule>({
    queryKey: ['ticket-rule', examId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiGetWithTenant<TicketNumberRule>(`/exams/${examId}/ticket-number-rule`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async (data: TicketNumberRule) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPutWithTenant(`/exams/${examId}/ticket-number-rule`, tenant.id, data)
    },
    onSuccess: () => {
      toast.success('准考证号规则更新成功')
      queryClient.invalidateQueries({ queryKey: ['ticket-rule', examId] })
      setRuleDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败')
    },
  })

  // Issue tickets mutation
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPostWithTenant<BatchIssueResult>(`/exams/${examId}/issue-tickets`, tenant.id, {})
    },
    onSuccess: (result) => {
      if (result.issued > 0) {
        toast.success(`准考证发放成功！共发放 ${result.issued} 张准考证`)
      } else if (result.notApproved && result.notApproved > 0) {
        const condition = result.feeRequired ? '完成缴费' : '通过审核'
        toast.warning(`没有发放准考证。${result.notApproved} 位考生尚未${condition}`)
      } else if (result.totalCandidates === 0) {
        toast.info('没有找到已分配座位的考生')
      } else {
        toast.info('没有新的准考证需要发放')
      }
      // 如果有额外的提示信息
      if (result.message) {
        toast.info(result.message)
      }
      queryClient.invalidateQueries({ queryKey: ['exam-tickets', examId] })
      queryClient.refetchQueries({ queryKey: ['exam-tickets', examId] })
    },
    onError: (error: any) => {
      toast.error(error?.message || '准考证发放失败')
    },
  })

  const handleIssueTickets = async () => {
    if (!confirm('确定要为所有已分配座位的考生发放准考证吗？')) {
      return
    }
    setIsIssuing(true)
    try {
      await issueMutation.mutateAsync()
    } finally {
      setIsIssuing(false)
    }
  }

  const openRuleDialog = () => {
    if (ticketRule) {
      setRuleForm({
        prefix: ticketRule.prefix || '',
        dateFormat: ticketRule.dateFormat || 'YYYYMMDD',
        sequenceLength: ticketRule.sequenceLength || 4,
        separator: ticketRule.separator || '-',
        includeExamCode: ticketRule.includeExamCode ?? true,
        includePositionCode: ticketRule.includePositionCode ?? true,
        checksumType: ticketRule.checksumType || 'NONE',
      })
    }
    setRuleDialogOpen(true)
  }

  const handleSaveRule = () => {
    updateRuleMutation.mutate(ruleForm)
  }

  // 生成预览编号
  const previewTicketNumber = () => {
    const parts: string[] = []
    if (ruleForm.prefix) parts.push(ruleForm.prefix)
    if (ruleForm.includeExamCode) parts.push(exam?.code || 'EXAM001')
    if (ruleForm.includePositionCode) parts.push('POS001')
    if (ruleForm.dateFormat && ruleForm.dateFormat !== 'NONE') {
      const now = new Date()
      switch (ruleForm.dateFormat) {
        case 'YYYYMMDD':
          parts.push(now.toISOString().slice(0, 10).replace(/-/g, ''))
          break
        case 'YYMMDD':
          parts.push(now.toISOString().slice(2, 10).replace(/-/g, ''))
          break
        case 'YYYYMM':
          parts.push(now.toISOString().slice(0, 7).replace(/-/g, ''))
          break
        case 'YYMM':
          parts.push(now.toISOString().slice(2, 7).replace(/-/g, ''))
          break
      }
    }
    parts.push('0001'.padStart(ruleForm.sequenceLength || 4, '0'))
    return parts.join(ruleForm.separator || '-')
  }

  const isLoading = examLoading || ticketsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalIssued = tickets?.length || 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>考试状态</CardDescription>
            <CardTitle className="text-xl">
              <Badge variant={exam?.status === 'CLOSED' ? 'default' : 'secondary'}>
                {exam?.status === 'CLOSED' ? '已关闭' : exam?.status}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>收费类型</CardDescription>
            <CardTitle className="text-xl">
              <Badge variant={exam?.feeRequired ? 'outline' : 'secondary'}>
                {exam?.feeRequired ? '收费考试' : '免费考试'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已发放准考证</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totalIssued}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Ticket Number Rule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                准考证号规则
              </CardTitle>
              <CardDescription>
                配置准考证编号的生成规则
              </CardDescription>
            </div>
            <Button variant="outline" onClick={openRuleDialog}>
              <Settings className="h-4 w-4 mr-2" />
              配置规则
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">前缀</p>
              <p className="font-medium">{ticketRule?.prefix || '(无)'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">日期格式</p>
              <p className="font-medium">{ticketRule?.dateFormat || 'YYYYMMDD'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">序号长度</p>
              <p className="font-medium">{ticketRule?.sequenceLength || 4} 位</p>
            </div>
            <div>
              <p className="text-muted-foreground">分隔符</p>
              <p className="font-medium">{ticketRule?.separator || '-'}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">示例编号</p>
            <p className="font-mono text-lg">{previewTicketNumber()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Issue Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>准考证发放</CardTitle>
              <CardDescription>
                为已分配座位的考生批量发放准考证
              </CardDescription>
            </div>
            <Button onClick={handleIssueTickets} disabled={isIssuing}>
              {isIssuing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  发放中...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  批量发放准考证
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prerequisites Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>准考证发放前提条件</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>考生已通过审核{exam?.feeRequired && '并完成缴费'}</li>
                <li>考生已分配考场座位</li>
                <li>考试已配置准考证号规则</li>
              </ul>
            </AlertDescription>
          </Alert>

          {totalIssued === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>尚未发放准考证</strong>
                <p className="mt-2">
                  请先在"座位分配"标签页完成座位分配，然后点击"批量发放准考证"按钮。
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>准考证已发放</strong>
                <p className="mt-2">
                  已为 {totalIssued} 名考生发放准考证。考生可登录系统查看并下载准考证。
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tickets List */}
      {tickets && tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>准考证列表</CardTitle>
            <CardDescription>共 {tickets.length} 张准考证</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>准考证号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>考场/教室</TableHead>
                    <TableHead>座位</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>发放时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.slice(0, 50).map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.ticketNo}</TableCell>
                      <TableCell className="font-medium">{ticket.candidateName}</TableCell>
                      <TableCell>{ticket.positionTitle}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{ticket.venueName || '-'}</div>
                          {ticket.roomNumber && (
                            <div className="text-muted-foreground">{ticket.roomNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {ticket.seatNumber || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.status === 'ISSUED' ? 'default' : 'secondary'}>
                          {ticket.status === 'ISSUED' ? '已发放' : ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.issuedAt ? new Date(ticket.issuedAt).toLocaleString('zh-CN') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tickets.length > 50 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  仅显示前 50 条记录，共 {tickets.length} 条
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rule Configuration Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>配置准考证号规则</DialogTitle>
            <DialogDescription>
              设置准考证编号的生成规则，修改后将影响新生成的准考证
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">前缀</Label>
                <Input
                  id="prefix"
                  placeholder="如: 2024"
                  value={ruleForm.prefix}
                  onChange={(e) => setRuleForm({ ...ruleForm, prefix: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="separator">分隔符</Label>
                <Select
                  value={ruleForm.separator === '' ? 'NONE' : ruleForm.separator}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, separator: v === 'NONE' ? '' : v })}
                >
                  <SelectTrigger id="separator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">横线 (-)</SelectItem>
                    <SelectItem value="_">下划线 (_)</SelectItem>
                    <SelectItem value="NONE">无分隔符</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFormat">日期格式</Label>
                <Select
                  value={ruleForm.dateFormat}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, dateFormat: v })}
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYYMMDD">YYYYMMDD (20251202)</SelectItem>
                    <SelectItem value="YYMMDD">YYMMDD (251202)</SelectItem>
                    <SelectItem value="YYYYMM">YYYYMM (202512)</SelectItem>
                    <SelectItem value="YYMM">YYMM (2512)</SelectItem>
                    <SelectItem value="NONE">不包含日期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sequenceLength">序号长度</Label>
                <Select
                  value={String(ruleForm.sequenceLength)}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, sequenceLength: parseInt(v) })}
                >
                  <SelectTrigger id="sequenceLength">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 位</SelectItem>
                    <SelectItem value="4">4 位</SelectItem>
                    <SelectItem value="5">5 位</SelectItem>
                    <SelectItem value="6">6 位</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">预览</p>
              <p className="font-mono text-lg">{previewTicketNumber()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRule} disabled={updateRuleMutation.isPending}>
              {updateRuleMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
