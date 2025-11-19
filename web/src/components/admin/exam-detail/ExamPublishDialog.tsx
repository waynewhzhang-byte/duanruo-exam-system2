'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { toast } from 'sonner'

interface ExamPublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examId: string
  examTitle: string
  examStatus: string
  onPublish: () => Promise<void>
}

export default function ExamPublishDialog({
  open,
  onOpenChange,
  examId,
  examTitle,
  examStatus,
  onPublish,
}: ExamPublishDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [confirmChecks, setConfirmChecks] = useState({
    formConfigured: false,
    positionsAdded: false,
    venuesReady: false,
    reviewersAssigned: false,
  })

  const allChecked = Object.values(confirmChecks).every((v) => v)

  const handlePublish = async () => {
    if (!allChecked) {
      toast.error('请确认所有检查项')
      return
    }

    setIsPublishing(true)
    try {
      await onPublish()
      toast.success('考试发布成功！候选人现在可以报名了')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.message || '发布失败')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>发布考试</DialogTitle>
          <DialogDescription>
            发布后，候选人将可以看到此考试并提交报名申请
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 考试信息 */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">考试信息</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">考试名称：</span>
                <span className="font-medium">{examTitle}</span>
              </p>
              <p>
                <span className="text-muted-foreground">当前状态：</span>
                <span className="font-medium">{examStatus}</span>
              </p>
            </div>
          </div>

          {/* 发布前检查 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              发布前检查
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="formConfigured"
                  checked={confirmChecks.formConfigured}
                  onCheckedChange={(checked) =>
                    setConfirmChecks({ ...confirmChecks, formConfigured: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="formConfigured" className="cursor-pointer">
                    已配置报名表单
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    确认已在"报名表单"标签页设计并保存了表单模板
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="positionsAdded"
                  checked={confirmChecks.positionsAdded}
                  onCheckedChange={(checked) =>
                    setConfirmChecks({ ...confirmChecks, positionsAdded: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="positionsAdded" className="cursor-pointer">
                    已添加招聘岗位
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    确认已在"岗位与科目"标签页添加了至少一个岗位
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="venuesReady"
                  checked={confirmChecks.venuesReady}
                  onCheckedChange={(checked) =>
                    setConfirmChecks({ ...confirmChecks, venuesReady: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="venuesReady" className="cursor-pointer">
                    已准备考场（可选）
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    可以在报名截止后再配置考场和分配座位
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="reviewersAssigned"
                  checked={confirmChecks.reviewersAssigned}
                  onCheckedChange={(checked) =>
                    setConfirmChecks({ ...confirmChecks, reviewersAssigned: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="reviewersAssigned" className="cursor-pointer">
                    已分配审核员
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    确认已在"审核规则"标签页配置了审核员
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 发布说明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>发布后的流程：</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>候选人可以在考试列表中看到此考试</li>
                <li>候选人填写报名表单并提交（含附件）</li>
                <li>系统生成报名编号</li>
                <li>审核员进行审核（初审/复审）</li>
                <li>审核通过后，如需缴费则进入缴费流程</li>
                <li>缴费成功后，候选人可查看准考证</li>
                <li>报名截止后，管理员分配考场和座位</li>
                <li>候选人可查看座位安排</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* 警告 */}
          {examStatus === 'OPEN' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                此考试已经发布。重新发布将不会影响已提交的报名申请。
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
            取消
          </Button>
          <Button onClick={handlePublish} disabled={!allChecked || isPublishing}>
            {isPublishing ? '发布中...' : '确认发布'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

