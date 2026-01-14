'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    MoreVertical,
    PlayCircle,
    StopCircle,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock
} from 'lucide-react'
import { apiPost } from '@/lib/api'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ExamStatusActionsProps {
    examId: string
    currentStatus: string
    tenantId: string
    onStatusChange: () => void
}

export default function ExamStatusActions({
    examId,
    currentStatus,
    tenantId,
    onStatusChange
}: ExamStatusActionsProps) {
    const [loading, setLoading] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{
        type: 'open' | 'close' | 'start' | 'complete' | 'cancel'
        title: string
        description: string
    } | null>(null)

    const handleAction = async () => {
        if (!confirmAction) return

        if (!tenantId) {
            toast.error('租户信息缺失，请刷新页面重试')
            setConfirmAction(null)
            return
        }

        setLoading(true)
        try {
            await apiPost(`/exams/${examId}/${confirmAction.type}`, {}, { tenantId })
            toast.success('状态更新成功')
            onStatusChange()
        } catch (error: any) {
            toast.error(error?.message || '操作失败')
        } finally {
            setLoading(false)
            setConfirmAction(null)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>更改状态</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* DRAFT -> OPEN */}
                    {currentStatus === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => setConfirmAction({
                            type: 'open',
                            title: '开放报名',
                            description: '确定要开放此考试的报名吗？考生将可以提交申请。'
                        })}>
                            <PlayCircle className="mr-2 h-4 w-4 text-green-600" />
                            开放报名
                        </DropdownMenuItem>
                    )}

                    {/* OPEN -> CLOSED */}
                    {currentStatus === 'OPEN' && (
                        <DropdownMenuItem onClick={() => setConfirmAction({
                            type: 'close',
                            title: '关闭报名',
                            description: '确定要关闭报名吗？考生将无法再提交新的申请。'
                        })}>
                            <StopCircle className="mr-2 h-4 w-4 text-orange-600" />
                            关闭报名
                        </DropdownMenuItem>
                    )}

                    {/* CLOSED -> IN_PROGRESS */}
                    {currentStatus === 'CLOSED' && (
                        <DropdownMenuItem onClick={() => setConfirmAction({
                            type: 'start',
                            title: '开始考试',
                            description: '确定要开始考试吗？这将标记考试为进行中状态。'
                        })}>
                            <Clock className="mr-2 h-4 w-4 text-blue-600" />
                            开始考试
                        </DropdownMenuItem>
                    )}

                    {/* IN_PROGRESS -> COMPLETED */}
                    {currentStatus === 'IN_PROGRESS' && (
                        <DropdownMenuItem onClick={() => setConfirmAction({
                            type: 'complete',
                            title: '完成考试',
                            description: '确定要结束考试吗？这将标记考试为已完成。'
                        })}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-purple-600" />
                            完成考试
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAction} disabled={loading}>
                            {loading ? '处理中...' : '确认'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
