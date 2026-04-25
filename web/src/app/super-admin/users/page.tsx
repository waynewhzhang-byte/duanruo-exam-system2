'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { apiPost, apiGet, apiPatch, apiDelete } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  UserPlus,
  Shield,
  UserCheck,
  Users,
  User,
  Building2,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react'

interface UserFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phoneNumber: string
}

interface Tenant {
  id: string
  name: string
  code: string
  status: string
}

interface SystemUser {
  id: string
  username: string
  email: string
  fullName: string
  phoneNumber?: string | null
  status: string
  roles: string // 后端返回的是字符串化的 JSON 数组
  createdAt: string
}

interface EditUserForm {
  username: string
  email: string
  fullName: string
  phoneNumber: string
  status: string
  newPassword: string
  confirmPassword: string
}

const ROLE_CONFIG = {
  ADMIN: {
    label: '系统管理员',
    endpoint: '/super-admin/users',
    role: 'SUPER_ADMIN',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    description: '拥有系统最高权限，可以管理所有功能',
    requiresTenant: false
  },
  TENANT_ADMIN: {
    label: '租户管理员',
    endpoint: '/super-admin/users',
    role: 'TENANT_ADMIN',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    description: '管理特定租户下的考试、用户和审核员',
    requiresTenant: true
  },
  EXAMINER: {
    label: '考官',
    endpoint: '/super-admin/users',
    role: 'EXAMINER',
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    description: '负责考试监考和成绩录入',
    requiresTenant: true
  },
  PRIMARY_REVIEWER: {
    label: '初审员',
    endpoint: '/super-admin/users',
    role: 'PRIMARY_REVIEWER',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    description: '负责特定租户下申请的初步审核',
    requiresTenant: true
  },
  SECONDARY_REVIEWER: {
    label: '复审员',
    endpoint: '/super-admin/users',
    role: 'SECONDARY_REVIEWER',
    icon: UserCheck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    description: '负责特定租户下申请的二次审核',
    requiresTenant: true
  },
  CANDIDATE: {
    label: '考生',
    endpoint: '/super-admin/users',
    role: 'CANDIDATE',
    icon: User,
    color: 'text-slate-600',
    bgColor: 'bg-slate-500/10',
    description: '在指定租户下报名与提交申请的考生账号',
    requiresTenant: true
  }
}

const emptyEditForm = (): EditUserForm => ({
  username: '',
  email: '',
  fullName: '',
  phoneNumber: '',
  status: 'ACTIVE',
  newPassword: '',
  confirmPassword: '',
})

export default function SuperAdminUsersPage() {
  const { user: authUser } = useAuth()
  const [form, setForm] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
  })
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_CONFIG>('ADMIN')
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [editForm, setEditForm] = useState<EditUserForm>(emptyEditForm())
  const [savingEdit, setSavingEdit] = useState(false)
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openEdit = (u: SystemUser) => {
    setEditingUser(u)
    setEditForm({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phoneNumber: u.phoneNumber ?? '',
      status: u.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const saveEdit = async () => {
    if (!editingUser) return
    if (!editForm.username.trim() || !editForm.email.trim() || !editForm.fullName.trim()) {
      toast.error('请填写用户名、邮箱和姓名')
      return
    }
    const pw = editForm.newPassword.trim()
    const pw2 = editForm.confirmPassword.trim()
    if (pw || pw2) {
      if (pw.length < 6) {
        toast.error('新密码至少 6 位')
        return
      }
      if (pw !== pw2) {
        toast.error('两次输入的新密码不一致')
        return
      }
    }
    setSavingEdit(true)
    try {
      const body: Record<string, unknown> = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        fullName: editForm.fullName.trim(),
        status: editForm.status,
        phoneNumber: editForm.phoneNumber.trim() || undefined,
      }
      if (pw) body.password = pw
      await apiPatch(`/super-admin/users/${editingUser.id}`, body)
      toast.success('用户已更新')
      setEditingUser(null)
      setEditForm(emptyEditForm())
      fetchUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '更新失败'
      toast.error(msg)
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await apiDelete(`/super-admin/users/${userToDelete.id}`)
      toast.success('用户已删除')
      setUserToDelete(null)
      fetchUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  // 加载初始数据
  useEffect(() => {
    loadTenants()
    fetchUsers()
  }, [])

  const loadTenants = async () => {
    setLoadingTenants(true)
    try {
      const data = await apiGet<any>('/super-admin/tenants?page=0&size=100');
      if (data && Array.isArray(data.content)) {
        setTenants(data.content);
      }
    } catch (e: any) {
      console.error('Failed to load tenants:', e);
    } finally {
      setLoadingTenants(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await apiGet<any>('/super-admin/users?page=0&size=50');
      console.log('📥 用户列表数据:', data);
      if (data && Array.isArray(data.content)) {
        setSystemUsers(data.content);
      }
    } catch (e: any) {
      console.error('Failed to fetch users:', e);
      toast.error('获取用户列表失败');
    } finally {
      setLoadingUsers(false)
    }
  }

  const passwordsMatch = form.password === form.confirmPassword
  const requiresTenant = ROLE_CONFIG[selectedRole].requiresTenant
  const canSubmit = form.username && form.email && form.password && form.confirmPassword &&
    passwordsMatch && form.fullName && (!requiresTenant || selectedTenantId)

  const handleSubmit = async () => {
    if (!canSubmit) return

    const roleConfig = ROLE_CONFIG[selectedRole]
    setLoading(true)

    try {
      const requestBody: any = {
        username: form.username,
        password: form.password,
        email: form.email,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber || undefined,
      }

      if (roleConfig.requiresTenant && selectedTenantId) {
        requestBody.tenantId = selectedTenantId
        requestBody.tenantRole = roleConfig.role
      } else {
        requestBody.globalRoles = [roleConfig.role]
      }

      await apiPost<{ id: string }>(roleConfig.endpoint, requestBody)

      toast.success(`${roleConfig.label}创建成功`)
      setForm({ username: '', email: '', password: '', confirmPassword: '', fullName: '', phoneNumber: '' })
      setSelectedTenantId('')
      fetchUsers() // 刷新列表
    } catch (e: any) {
      const msg = e?.message || (typeof e === 'string' ? e : '创建失败，请重试')
      console.error('❌ 创建用户失败:', e)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // 格式化显示角色
  const formatRoles = (rolesStr: string) => {
    try {
      const roles = JSON.parse(rolesStr || '[]');
      if (!Array.isArray(roles) || roles.length === 0) return <span className="text-muted-foreground italic">无全局角色</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map(r => (
            <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
          ))}
        </div>
      );
    } catch {
      return <span className="text-destructive">格式错误</span>;
    }
  }

  const roleConfig = ROLE_CONFIG[selectedRole]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground mt-2">
            创建和管理系统用户，包括管理员、考官和审核员
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loadingUsers}>
          <Calendar className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
          刷新列表
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                创建新用户
              </CardTitle>
              <CardDescription>
                填写用户信息并选择角色类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>用户角色 *</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as keyof typeof ROLE_CONFIG)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {roleConfig.description}
                </p>
              </div>

              {/* Tenant Selection */}
              {roleConfig.requiresTenant && (
                <div className="space-y-2">
                  <Label>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      所属租户 *
                    </div>
                  </Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingTenants ? '加载中...' : '请选择租户'} />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* User Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="例如: admin001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">姓名 *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="张三"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">手机号</Label>
                  <Input
                    id="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="13800000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">密码 *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="不少于6位"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码 *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="再次输入密码"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                >
                  {loading ? '创建中...' : `创建${roleConfig.label}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">创建说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4 text-muted-foreground">
            <p>1. <b>系统管理员</b>拥有全局权限，通常用于运维人员。</p>
            <p>2. <b>租户管理员</b>仅能管理所属租户的数据，无法跨租户操作。</p>
            <p>3. <b>审核员</b>角色建议通过租户管理后台进行更精细的分配。</p>
          </CardContent>
        </Card>
      </div>

      {/* Real User List */}
      <Card>
        <CardHeader>
          <CardTitle>系统用户列表</CardTitle>
          <CardDescription>
            当前显示系统最近加入的 {systemUsers.length} 位用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center py-10">正在加载用户数据...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名/姓名</TableHead>
                  <TableHead>电子邮箱</TableHead>
                  <TableHead>全局角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right w-[140px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  systemUsers.map((u) => {
                    const isSelf = authUser?.id === u.id
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-muted-foreground">{u.fullName}</div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{formatRoles(u.roles)}</TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {u.status === 'ACTIVE' ? '正常' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(u)}
                              title="编辑"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={isSelf}
                              onClick={() => !isSelf && setUserToDelete(u)}
                              title={isSelf ? '不能删除当前登录账号' : '删除'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null)
            setEditForm(emptyEditForm())
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改基本信息、状态或重置密码。留空密码则表示不修改密码。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-username">用户名</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">姓名</Label>
              <Input
                id="edit-fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">手机号</Label>
              <Input
                id="edit-phone"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                placeholder="选填"
              />
            </div>
            <div className="space-y-2">
              <Label>账号状态</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">正常</SelectItem>
                  <SelectItem value="INACTIVE">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-np">新密码（可选）</Label>
              <Input
                id="edit-np"
                type="password"
                autoComplete="new-password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="不修改请留空"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-np2">确认新密码</Label>
              <Input
                id="edit-np2"
                type="password"
                autoComplete="new-password"
                value={editForm.confirmPassword}
                onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingUser(null)
                setEditForm(emptyEditForm())
              }}
            >
              取消
            </Button>
            <Button type="button" onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除用户「{userToDelete?.username}」（{userToDelete?.email}
              ）。此操作不可恢复，若该用户在其他租户有关联数据，请确认无业务影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
