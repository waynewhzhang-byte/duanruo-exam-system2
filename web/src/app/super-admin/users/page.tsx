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

const ROLE_CONFIG = {
  ADMIN: {
    label: '系统管理员',
    endpoint: '/admin/users',
    role: 'SUPER_ADMIN',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    description: '拥有系统最高权限，可以管理所有功能',
    requiresTenant: false
  },
  TENANT_ADMIN: {
    label: '租户管理员',
    endpoint: '/admin/users',
    role: 'TENANT_ADMIN',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    description: '管理特定租户下的考试、用户和审核员',
    requiresTenant: true
  },
  EXAMINER: {
    label: '考官',
    endpoint: '/admin/users',
    role: 'EXAMINER',
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    description: '负责考试监考和成绩录入',
    requiresTenant: true
  },
  PRIMARY_REVIEWER: {
    label: '初审员',
    endpoint: '/admin/users',
    role: 'PRIMARY_REVIEWER',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    description: '负责特定租户下申请的初步审核',
    requiresTenant: true
  },
  SECONDARY_REVIEWER: {
    label: '复审员',
    endpoint: '/admin/users',
    role: 'SECONDARY_REVIEWER',
    icon: UserCheck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    description: '负责特定租户下申请的二次审核',
    requiresTenant: true
  }
}

export default function SuperAdminUsersPage() {
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
  const [loading, setLoading] = useState(false)
  const [loadingTenants, setLoadingTenants] = useState(false)

  // 加载租户列表
  useEffect(() => {
    const loadTenants = async () => {
      setLoadingTenants(true)
      try {
        const token = localStorage.getItem('token');
        // 请求更大的分页大小，避免分页限制（默认只返回10条）
        const response = await fetch('/api/v1/super-admin/tenants?page=0&size=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📥 Users页面 - 获取到的租户数据:', data);
          console.log('📊 数据类型:', typeof data, '是否有content:', !!data?.content, '是否数组:', Array.isArray(data));

          // 处理不同的响应格式
          if (data && Array.isArray(data.content)) {
            console.log('✅ 使用 data.content, 租户数量:', data.content.length);
            setTenants(data.content);
          } else if (Array.isArray(data)) {
            console.log('✅ 直接使用 data 数组, 租户数量:', data.length);
            setTenants(data);
          } else if (data && Array.isArray(data.data)) {
            console.log('✅ 使用 data.data, 租户数量:', data.data.length);
            setTenants(data.data);
          } else {
            console.error('❌ 无效的租户数据格式:', data);
            setTenants([]);
            toast.error('租户数据格式错误');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ 获取租户列表失败:', response.status, errorText);
          toast.error(`获取租户列表失败: ${response.status}`);
        }
      } catch (e) {
        console.error('Failed to load tenants:', e);
        toast.error('加载租户列表时发生错误')
      } finally {
        setLoadingTenants(false)
      }
    }
    loadTenants()
  }, [])

  const passwordsMatch = form.password === form.confirmPassword
  const requiresTenant = ROLE_CONFIG[selectedRole].requiresTenant
  const canSubmit = form.username && form.email && form.password && form.confirmPassword &&
    passwordsMatch && form.fullName && (!requiresTenant || selectedTenantId)

  const handleSubmit = async () => {
    if (!canSubmit) return

    const roleConfig = ROLE_CONFIG[selectedRole]
    setLoading(true)

    try {
      // 构建请求参数
      const requestBody: any = {
        username: form.username,
        password: form.password,
        email: form.email,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber || undefined,
      }

      // 如果是租户级别角色，添加租户信息
      if (roleConfig.requiresTenant && selectedTenantId) {
        requestBody.tenantId = selectedTenantId
        requestBody.tenantRole = roleConfig.role
      } else {
        // 全局角色设置 globalRoles
        requestBody.globalRoles = [roleConfig.role]
      }

      console.log('📤 创建用户请求:', requestBody)

      // 创建用户
      const userResponse = await apiPost<{ id: string }>(roleConfig.endpoint, requestBody)

      toast.success(`${roleConfig.label}创建成功`)
      setForm({ username: '', email: '', password: '', confirmPassword: '', fullName: '', phoneNumber: '' })
      setSelectedTenantId('')
    } catch (e: any) {
      console.error('❌ 创建用户失败:', e)
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

              {/* Tenant Selection (for tenant-level roles) */}
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
                  <p className="text-sm text-muted-foreground">
                    {selectedRole === 'TENANT_ADMIN'
                      ? '租户管理员将管理该租户下的所有考试和用户'
                      : selectedRole === 'PRIMARY_REVIEWER'
                        ? '初审员将负责该租户下报名申请的初步审核'
                        : selectedRole === 'SECONDARY_REVIEWER'
                          ? '复审员将负责该租户下报名申请的二次审核'
                          : '该角色将在选定的租户下工作'}
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

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="confirmPassword">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      确认密码 *
                    </div>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="再次输入密码"
                  />
                  {form.password && form.confirmPassword && !passwordsMatch && (
                    <p className="text-sm text-destructive">两次输入的密码不一致</p>
                  )}
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
                    className={`p-3 rounded-lg border ${selectedRole === key ? 'border-primary bg-primary/5' : 'border-border'
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

