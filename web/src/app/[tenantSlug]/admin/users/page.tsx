'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { apiGetWithTenant } from '@/lib/api'
import { TenantUserResponse } from '@/types/user'
import { toast } from 'sonner'
import { Plus, Search, User, Shield, Users, UserPlus } from 'lucide-react'
import { useTenant } from '@/hooks/useTenant'
import { AddTenantUserDialog } from '@/components/admin/AddTenantUserDialog'

export default function TenantUsersPage() {
    const { tenant, isLoading: tenantLoading } = useTenant()
    const [users, setUsers] = useState<TenantUserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [reviewers, setReviewers] = useState<TenantUserResponse[]>([])
    const [candidates, setCandidates] = useState<TenantUserResponse[]>([])
    const [activeTab, setActiveTab] = useState<'reviewers' | 'candidates'>('reviewers')

    // 添加用户对话框状态
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [defaultRole, setDefaultRole] = useState<'PRIMARY_REVIEWER' | 'SECONDARY_REVIEWER' | 'CANDIDATE' | undefined>()

    // Fetch users
    const fetchUsers = useCallback(async () => {
        if (!tenant?.id) return

        try {
            setLoading(true)
            const data = await apiGetWithTenant<{ reviewers: TenantUserResponse[], candidates: TenantUserResponse[] }>(
                `/tenants/${tenant.id}/users/details/categorized`,
                tenant.id
            )
            setReviewers(data.reviewers || [])
            setCandidates(data.candidates || [])
            // 为了兼容性，也设置users（合并两个列表）
            setUsers([...data.reviewers || [], ...data.candidates || []])
        } catch (error: any) {
            console.error('Failed to fetch users:', error)
            toast.error(error?.message || '获取用户列表失败')
        } finally {
            setLoading(false)
        }
    }, [tenant?.id])

    useEffect(() => {
        if (tenant?.id && !tenantLoading) {
            fetchUsers()
        }
    }, [tenant?.id, tenantLoading, fetchUsers])

    // 打开添加审核员对话框
    const handleAddReviewer = () => {
        setDefaultRole('PRIMARY_REVIEWER')
        setAddUserDialogOpen(true)
    }

    // 打开添加考生对话框
    const handleAddCandidate = () => {
        setDefaultRole('CANDIDATE')
        setAddUserDialogOpen(true)
    }

    // 用户创建成功后刷新列表
    const handleUserCreated = () => {
        fetchUsers()
    }

    const filteredReviewers = reviewers.filter(u =>
        u.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredCandidates = candidates.filter(u =>
        u.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 为了兼容性，保留filteredUsers
    const filteredUsers = [...filteredReviewers, ...filteredCandidates]

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'TENANT_ADMIN': return 'default'
            case 'PRIMARY_REVIEWER': return 'secondary'
            case 'SECONDARY_REVIEWER': return 'secondary'
            default: return 'outline'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'TENANT_ADMIN': return '管理员'
            case 'PRIMARY_REVIEWER': return '初审员'
            case 'SECONDARY_REVIEWER': return '复审员'
            case 'CANDIDATE': return '考生'
            default: return role
        }
    }

    // 用户表格组件
    const UserTable = ({ users, loading }: { users: TenantUserResponse[], loading: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>角色 (本租户)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>加入时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                            加载中...
                        </TableCell>
                    </TableRow>
                ) : users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            暂无用户
                        </TableCell>
                    </TableRow>
                ) : (
                    users.map((item) => (
                        <TableRow key={item.user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{item.user.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{item.user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {item.tenantRoles.map(role => (
                                        <Badge key={role} variant={getRoleBadgeVariant(role) as any} className="text-xs">
                                            {getRoleLabel(role)}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={item.user.status === 'ACTIVE' ? 'outline' : 'secondary'}>
                                    {item.user.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {item.user.createdAt ? new Date(item.user.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                    编辑
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
                    <p className="text-muted-foreground mt-2">
                        管理本租户下的审核员和报名考生
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAddCandidate}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        添加考生
                    </Button>
                    <Button onClick={handleAddReviewer}>
                        <Plus className="h-4 w-4 mr-2" />
                        添加审核员
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'reviewers' | 'candidates')} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reviewers">
                        <Shield className="h-4 w-4 mr-2" />
                        审核员 ({reviewers.length})
                    </TabsTrigger>
                    <TabsTrigger value="candidates">
                        <Users className="h-4 w-4 mr-2" />
                        报名考生 ({candidates.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reviewers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>审核员列表</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜索姓名、邮箱..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <CardDescription>
                                关联租户的角色（初审员、复审员）
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserTable users={filteredReviewers} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>报名考生列表</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜索姓名、邮箱..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <CardDescription>
                                报名参加此租户考试的用户
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserTable users={filteredCandidates} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* 添加用户对话框 */}
            {tenant?.id && (
                <AddTenantUserDialog
                    open={addUserDialogOpen}
                    onOpenChange={setAddUserDialogOpen}
                    tenantId={tenant.id}
                    defaultRole={defaultRole}
                    onSuccess={handleUserCreated}
                />
            )}
        </div>
    )
}
