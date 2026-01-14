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
import { apiPost, apiGet } from '@/lib/api'
import { toast } from 'sonner'
import {
  UserPlus,
  Shield,
  UserCheck,
  Users,
  Mail,
  Phone,
  Lock,
  User,
  Building2
} from 'lucide-react'

interface UserFormData {
  username: string
  email: string
  password: string
  fullName: string
  phoneNumber: string
}

interface Tenant {
  id: string
  name: string
  code: string
  status: string
}

const ROLE_CONFIG = {
  ADMIN: {
    label: '系统管理员',
    endpoint: '/auth/admin/create-admin',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    description: '拥有系统最高权限，可以管理所有功能'
  },
  TENANT_ADMIN: {
    label: '租户管理员',
    endpoint: '/auth/admin/create-tenant-admin',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    description: '管理特定租户下的考试、用户和审核员'
  },
  EXAMINER: {
    label: '考官',
    endpoint: '/auth/admin/create-examiner',
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    description: '负责考试监考和成绩录入'
  },
  PRIMARY_REVIEWER: {
    label: '初审员',
    endpoint: '/auth/admin/create-primary-reviewer',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    description: '负责申请的初步审核'
  },
  SECONDARY_REVIEWER: {
    label: '复审员',
    endpoint: '/auth/admin/create-secondary-reviewer',
    icon: UserCheck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    description: '负责申请的二次审核'
  }
}

export default function UsersPage() {
  const [form, setForm] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  })
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_CONFIG>('ADMIN')
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTenants, setLoadingTenants] = useState(false)

  // 加载租户列表
  useEffect(() => {
    const loadTenants = async () => {
      setLoadingTenants(true)
      try {
        const response = await apiGet<{ content: Tenant[] }>('/tenants?activeOnly=true')
        setTenants(response.content || [])
      } catch (e) {
        console.error('Failed to load tenants:', e)
      } finally {
        setLoadingTenants(false)
      }
    }
    loadTenants()
  }, [])

  const canSubmit = form.username && form.email && form.password && form.fullName &&
    (selectedRole !== 'TENANT_ADMIN' || selectedTenantId)

  const handleSubmit = async () => {
    if (!canSubmit) return

    const roleConfig = ROLE_CONFIG[selectedRole]
    setLoading(true)

    try {
      // 创建用户，如果是租户管理员，在请求中包含 tenantId
      const requestBody = selectedRole === 'TENANT_ADMIN' && selectedTenantId
        ? { ...form, tenantId: selectedTenantId }
        : form

      const userResponse = await apiPost<{ id: string }>(roleConfig.endpoint, requestBody)

      toast.success(`${roleConfig.label}创建成功`)
      setForm({ username: '', email: '', password: '', fullName: '', phoneNumber: '' })
      setSelectedTenantId('')
    } catch (e: any) {
      toast.error(e?.message || '创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = ROLE_CONFIG[selectedRole]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
        <p className="text-muted-foreground mt-2">
          创建和管理系统用户，包括管理员、考官和审核员
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="lg:col-span-2">
          <Card>
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

              {/* Tenant Selection (only for TENANT_ADMIN) */}
              {selectedRole === 'TENANT_ADMIN' && (
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
                  <p className="text-sm text-muted-foreground">
                    租户管理员将管理该租户下的所有考试和用户
                  </p>
                </div>
              )}

              {/* User Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      用户名 *
                    </div>
                  </Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="例如: admin001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      邮箱 *
                    </div>
                  </Label>
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
                  <Label htmlFor="phoneNumber">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      手机号（可选）
                    </div>
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="13800000000"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="password">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      密码 *
                    </div>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="不少于6位"
                  />
                  <p className="text-xs text-muted-foreground">
                    密码长度至少6位，建议包含字母、数字和特殊字符
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <>创建中...</>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      创建{roleConfig.label}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">角色说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${
                      selectedRole === key ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{config.label}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">快速提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                <p>用户名必须唯一，建议使用工号或编号</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                <p>邮箱用于接收系统通知和密码重置</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                <p>初始密码由管理员设置，用户首次登录后可修改</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                <p>手机号用于短信通知（可选）</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Future Features Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">用户列表</CardTitle>
          <CardDescription>查看和管理所有系统用户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">功能开发中</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              用户列表、查询、启用/禁用、重置密码等功能正在开发中，敬请期待
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
