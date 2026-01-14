'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Edit } from 'lucide-react'
import { apiPost } from '@/lib/api'
import { toast } from 'sonner'

interface ExamStatusEditorProps {
    examId: string
    currentStatus: string
    tenantId: string
    onStatusChange: () => void
}

const STATUS_OPTIONS = [
    { value: 'DRAFT', label: '草稿', description: '考试尚未开放报名' },
    { value: 'OPEN', label: '开放报名', description: '考试报名已开放，考生可以提交报名申请', action: 'open' },
    { value: 'CLOSED', label: '报名关闭', description: '报名已关闭，等待考试开始', action: 'close' },
    { value: 'IN_PROGRESS', label: '考试进行中', description: '考试正在进行', action: 'start' },
    { value: 'COMPLETED', label: '已完成', description: '考试已结束', action: 'complete' },
]

// 定义状态转换映射（基于后端 ExamStatus.canTransitionTo）
const STATUS_TRANSITIONS: Record<string, string[]> = {
    'DRAFT': ['OPEN'],
    'OPEN': ['CLOSED'],
    'CLOSED': ['IN_PROGRESS'],
    'IN_PROGRESS': ['COMPLETED'],
    'COMPLETED': [], // 终态
}

// 状态到API端点的映射
const STATUS_TO_ENDPOINT: Record<string, string> = {
    'OPEN': 'open',
    'CLOSED': 'close',
    'IN_PROGRESS': 'start',
    'COMPLETED': 'complete',
}

export default function ExamStatusEditor({
    examId,
    currentStatus,
    tenantId,
    onStatusChange,
}: ExamStatusEditorProps) {
    const [open, setOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState(currentStatus)
    const [loading, setLoading] = useState(false)

    // 获取当前状态可以转换到的目标状态
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []

    // 如果当前状态不在预定义的转换规则中，显示所有状态选项（除了当前状态保持禁用）
    const availableOptions = allowedTransitions.length > 0
        ? STATUS_OPTIONS.filter(option => option.value === currentStatus || allowedTransitions.includes(option.value))
        : STATUS_OPTIONS  // 如果没有定义转换规则，显示所有选项

    const handleSave = async () => {
        if (selectedStatus === currentStatus) {
            setOpen(false)
            return
        }

        if (!tenantId) {
            toast.error('租户信息缺失，请刷新页面重试')
            return
        }

        const endpoint = STATUS_TO_ENDPOINT[selectedStatus]
        if (!endpoint) {
            toast.error('不支持的状态转换')
            return
        }

        setLoading(true)
        try {
            await apiPost(`/exams/${examId}/${endpoint}`, {}, { tenantId })
            toast.success('考试状态已更新')
            onStatusChange()
            setOpen(false)
        } catch (error: any) {
            toast.error(error?.message || '状态更新失败')
        } finally {
            setLoading(false)
        }
    }

    const currentStatusLabel = STATUS_OPTIONS.find(opt => opt.value === currentStatus)?.label || currentStatus
    const selectedStatusInfo = STATUS_OPTIONS.find(opt => opt.value === selectedStatus)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    修改状态
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>修改考试状态</DialogTitle>
                    <DialogDescription>
                        当前状态：<strong>{currentStatusLabel}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">选择新状态</Label>
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.value === currentStatus}
                                    >
                                        {option.label} - {option.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedStatus && selectedStatus !== currentStatus && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.description}
                            </p>
                        )}
                    </div>

                    {selectedStatus !== currentStatus && selectedStatusInfo && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <h4 className="text-sm font-medium text-yellow-900 mb-1">
                                将要执行的操作
                            </h4>
                            <p className="text-sm text-yellow-700">
                                {selectedStatusInfo.description}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || selectedStatus === currentStatus}
                    >
                        {loading ? '处理中...' : '确认修改'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
