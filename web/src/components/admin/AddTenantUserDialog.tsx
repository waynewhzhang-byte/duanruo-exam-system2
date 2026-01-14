'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiPostWithTenant } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// 表单验证 schema
const createUserSchema = z.object({
    username: z.string()
        .min(3, '用户名至少3个字符')
        .max(50, '用户名最多50个字符')
        .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string()
        .min(6, '密码至少6个字符')
        .max(100, '密码最多100个字符'),
    confirmPassword: z.string(),
    fullName: z.string()
        .min(2, '姓名至少2个字符')
        .max(50, '姓名最多50个字符'),
    phoneNumber: z.string()
        .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号')
        .optional()
        .or(z.literal('')),
    tenantRole: z.enum(['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'CANDIDATE'], {
        required_error: '请选择用户角色',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface AddTenantUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tenantId: string
    defaultRole?: 'PRIMARY_REVIEWER' | 'SECONDARY_REVIEWER' | 'CANDIDATE'
    onSuccess?: () => void
}

const ROLE_OPTIONS = [
    { value: 'PRIMARY_REVIEWER', label: '初审员' },
    { value: 'SECONDARY_REVIEWER', label: '复审员' },
    { value: 'CANDIDATE', label: '考生' },
] as const

export function AddTenantUserDialog({
    open,
    onOpenChange,
    tenantId,
    defaultRole,
    onSuccess,
}: AddTenantUserDialogProps) {
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            phoneNumber: '',
            tenantRole: defaultRole,
        },
    })

    const selectedRole = watch('tenantRole')

    const onSubmit = async (data: CreateUserFormData) => {
        setLoading(true)
        try {
            // 准备请求数据，移除 confirmPassword
            const requestData = {
                username: data.username,
                email: data.email,
                password: data.password,
                fullName: data.fullName,
                phoneNumber: data.phoneNumber || undefined,
                tenantRole: data.tenantRole,
            }

            await apiPostWithTenant(
                `/tenants/${tenantId}/users`,
                tenantId,
                requestData
            )

            const roleLabel = ROLE_OPTIONS.find(r => r.value === data.tenantRole)?.label
            toast.success(`${roleLabel} ${data.fullName} 创建成功`)
            reset()
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            console.error('Failed to create user:', error)
            toast.error(error?.message || '创建用户失败')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            reset()
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>添加用户</DialogTitle>
                    <DialogDescription>
                        创建新用户并关联到当前租户。用户将自动获得所选角色。
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* 角色选择 */}
                    <div className="space-y-2">
                        <Label htmlFor="tenantRole">用户角色 *</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(value) => setValue('tenantRole', value as any)}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择用户角色" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.tenantRole && (
                            <p className="text-sm text-destructive">{errors.tenantRole.message}</p>
                        )}
                    </div>

                    {/* 用户名 */}
                    <div className="space-y-2">
                        <Label htmlFor="username">用户名 *</Label>
                        <Input
                            id="username"
                            placeholder="请输入用户名"
                            {...register('username')}
                            disabled={loading}
                        />
                        {errors.username && (
                            <p className="text-sm text-destructive">{errors.username.message}</p>
                        )}
                    </div>

                    {/* 姓名 */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName">姓名 *</Label>
                        <Input
                            id="fullName"
                            placeholder="请输入真实姓名"
                            {...register('fullName')}
                            disabled={loading}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-destructive">{errors.fullName.message}</p>
                        )}
                    </div>

                    {/* 邮箱 */}
                    <div className="space-y-2">
                        <Label htmlFor="email">邮箱 *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="请输入邮箱地址"
                            {...register('email')}
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    {/* 手机号 */}
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">手机号</Label>
                        <Input
                            id="phoneNumber"
                            placeholder="请输入手机号（选填）"
                            {...register('phoneNumber')}
                            disabled={loading}
                        />
                        {errors.phoneNumber && (
                            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                        )}
                    </div>

                    {/* 密码 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">密码 *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="至少6位"
                                {...register('password')}
                                disabled={loading}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">确认密码 *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="再次输入密码"
                                {...register('confirmPassword')}
                                disabled={loading}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            创建用户
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

