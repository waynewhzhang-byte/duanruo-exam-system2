'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/lib/api-hooks'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Save,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: '超级管理员',
  TENANT_ADMIN: '租户管理员',
  PRIMARY_REVIEWER: '初审员',
  SECONDARY_REVIEWER: '复审员',
  CANDIDATE: '考生',
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  TENANT_ADMIN: 'bg-purple-100 text-purple-800',
  PRIMARY_REVIEWER: 'bg-blue-100 text-blue-800',
  SECONDARY_REVIEWER: 'bg-green-100 text-green-800',
  CANDIDATE: 'bg-gray-100 text-gray-800',
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const displayUser = profile || user

  // Initialize edit form when entering edit mode
  const handleStartEditing = () => {
    setEditForm({
      fullName: displayUser?.fullName || '',
      email: displayUser?.email || '',
      phoneNumber: displayUser?.phoneNumber || '',
    })
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
    setEditForm({
      fullName: '',
      email: '',
      phoneNumber: '',
    })
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // TODO: Call API to update profile
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('个人资料已保存')
      setIsEditing(false)
    } catch (error) {
      toast.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度不能少于6位')
      return
    }
    
    setIsSaving(true)
    try {
      // TODO: Call API to change password
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('密码修改成功')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('密码修改失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">个人资料</h1>
            <p className="text-muted-foreground mt-1">管理您的账户信息和安全设置</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {displayUser?.fullName?.charAt(0) || displayUser?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">{displayUser?.fullName || displayUser?.username}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {displayUser?.email || '未设置邮箱'}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayUser?.roles?.map((role: string) => (
                <Badge key={role} className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
                  {roleLabels[role] || role}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            安全设置
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>基本信息</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" onClick={handleStartEditing}>
                    编辑资料
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEditing}>
                      取消
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? <Spinner className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      保存
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    用户名
                  </Label>
                  <Input
                    value={displayUser?.username || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">用户名不可修改</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    姓名
                  </Label>
                  <Input
                    value={isEditing ? editForm.fullName : (displayUser?.fullName || '')}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="请输入真实姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    邮箱
                  </Label>
                  <Input
                    type="email"
                    value={isEditing ? editForm.email : (displayUser?.email || '')}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="请输入邮箱"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    手机号
                  </Label>
                  <Input
                    value={isEditing ? editForm.phoneNumber : (displayUser?.phoneNumber || '')}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="请输入手机号"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    部门
                  </Label>
                  <Input
                    value={displayUser?.department || ''}
                    disabled
                    className="bg-muted"
                    placeholder="未设置"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    注册时间
                  </Label>
                  <Input 
                    value={displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('zh-CN') : '未知'} 
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Account Status */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  账户状态正常
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                修改密码
              </CardTitle>
              <CardDescription>
                定期修改密码可以提高账户安全性
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>当前密码</Label>
                <Input 
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="请输入当前密码"
                />
              </div>

              <div className="space-y-2">
                <Label>新密码</Label>
                <Input 
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="请输入新密码（至少6位）"
                />
              </div>

              <div className="space-y-2">
                <Label>确认新密码</Label>
                <Input 
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="请再次输入新密码"
                />
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
              >
                {isSaving ? <Spinner className="mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                修改密码
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

