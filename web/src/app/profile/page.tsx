'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, useUserProfile, useUpsertProfile } from '@/lib/api-hooks'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  CheckCircle,
  FileText,
  MapPin,
  GraduationCap,
  Briefcase,
  Users,
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

const genderOptions = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
]

const politicalStatusOptions = [
  { value: '中共党员', label: '中共党员' },
  { value: '中共预备党员', label: '中共预备党员' },
  { value: '共青团员', label: '共青团员' },
  { value: '群众', label: '群众' },
  { value: '民主党派', label: '民主党派' },
]

const educationOptions = [
  { value: 'DOCTOR', label: '博士' },
  { value: 'MASTER', label: '硕士' },
  { value: 'BACHELOR', label: '本科' },
  { value: 'COLLEGE', label: '大专' },
  { value: 'HIGH_SCHOOL', label: '高中' },
  { value: 'OTHER', label: '其他' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: authProfile, isLoading: isAuthLoading } = useProfile()
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile()
  const upsertProfile = useUpsertProfile()

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
  const [profileForm, setProfileForm] = useState({
    gender: '',
    birthDate: '',
    idNumber: '',
    politicalStatus: '',
    hukouLocation: '',
    address: '',
    education: '',
    major: '',
    university: '',
    graduateYear: '',
    currentCompany: '',
    currentPosition: '',
    emergencyContact: '',
    emergencyPhone: '',
  })

  const displayUser = authProfile || user
  const isCandidate = displayUser?.roles?.includes('CANDIDATE')
  const isLoading = isAuthLoading || isProfileLoading

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        gender: userProfile.gender || '',
        birthDate: userProfile.birthDate ? userProfile.birthDate.split('T')[0] : '',
        idNumber: userProfile.idNumber || '',
        politicalStatus: userProfile.politicalStatus || '',
        hukouLocation: userProfile.hukouLocation || '',
        address: userProfile.address || '',
        education: userProfile.education || '',
        major: userProfile.major || '',
        university: userProfile.university || '',
        graduateYear: userProfile.graduateYear?.toString() || '',
        currentCompany: userProfile.currentCompany || '',
        currentPosition: userProfile.currentPosition || '',
        emergencyContact: userProfile.emergencyContact || '',
        emergencyPhone: userProfile.emergencyPhone || '',
      })
    }
  }, [userProfile])

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
      await new Promise((resolve) => setTimeout(resolve, 1000))
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('密码修改成功')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error('密码修改失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCandidateProfile = async () => {
    setIsSaving(true)
    try {
      await upsertProfile.mutateAsync({
        gender: profileForm.gender || undefined,
        birthDate: profileForm.birthDate || undefined,
        idNumber: profileForm.idNumber || undefined,
        politicalStatus: profileForm.politicalStatus || undefined,
        hukouLocation: profileForm.hukouLocation || undefined,
        address: profileForm.address || undefined,
        education: profileForm.education || undefined,
        major: profileForm.major || undefined,
        university: profileForm.university || undefined,
        graduateYear: profileForm.graduateYear ? parseInt(profileForm.graduateYear) : undefined,
        currentCompany: profileForm.currentCompany || undefined,
        currentPosition: profileForm.currentPosition || undefined,
        emergencyContact: profileForm.emergencyContact || undefined,
        emergencyPhone: profileForm.emergencyPhone || undefined,
      })
      toast.success('档案信息已保存')
    } catch (error) {
      toast.error('保存失败，请重试')
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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {displayUser?.fullName?.charAt(0) ||
                    displayUser?.username?.charAt(0) ||
                    'U'}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">
                  {displayUser?.fullName || displayUser?.username}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {displayUser?.email || '未设置邮箱'}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayUser?.roles?.map((role: string) => (
                <Badge
                  key={role}
                  className={roleColors[role] || 'bg-gray-100 text-gray-800'}
                >
                  {roleLabels[role] || role}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </TabsTrigger>
          {isCandidate && (
            <TabsTrigger value="candidate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              档案信息
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            安全设置
          </TabsTrigger>
        </TabsList>

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
                      {isSaving ? (
                        <Spinner className="mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
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
                    value={
                      isEditing
                        ? editForm.fullName
                        : displayUser?.fullName || ''
                    }
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
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
                    value={
                      isEditing ? editForm.email : displayUser?.email || ''
                    }
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, email: e.target.value }))
                    }
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
                    value={
                      isEditing
                        ? editForm.phoneNumber
                        : displayUser?.phoneNumber || ''
                    }
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
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
                    value={
                      displayUser?.createdAt
                        ? new Date(displayUser.createdAt).toLocaleDateString(
                            'zh-CN',
                          )
                        : '未知'
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  账户状态正常
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isCandidate && (
          <TabsContent value="candidate">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>档案信息</CardTitle>
                    <CardDescription>
                      保存您的个人信息，报名时将自动填充
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveCandidateProfile} disabled={isSaving}>
                    {isSaving ? (
                      <Spinner className="mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    保存档案
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>性别</Label>
                    <Select
                      value={profileForm.gender}
                      onValueChange={(v) =>
                        setProfileForm((prev) => ({ ...prev, gender: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      出生日期
                    </Label>
                    <Input
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          birthDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>身份证号</Label>
                    <Input
                      value={profileForm.idNumber}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          idNumber: e.target.value,
                        }))
                      }
                      placeholder="请输入身份证号"
                    />
                    <p className="text-xs text-muted-foreground">
                      身份证号将加密存储
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>政治面貌</Label>
                    <Select
                      value={profileForm.politicalStatus}
                      onValueChange={(v) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          politicalStatus: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择政治面貌" />
                      </SelectTrigger>
                      <SelectContent>
                        {politicalStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      户籍所在地
                    </Label>
                    <Input
                      value={profileForm.hukouLocation}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          hukouLocation: e.target.value,
                        }))
                      }
                      placeholder="请输入户籍所在地"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      通讯地址
                    </Label>
                    <Input
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="请输入通讯地址"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      学历
                    </Label>
                    <Select
                      value={profileForm.education}
                      onValueChange={(v) =>
                        setProfileForm((prev) => ({ ...prev, education: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择学历" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      专业
                    </Label>
                    <Input
                      value={profileForm.major}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          major: e.target.value,
                        }))
                      }
                      placeholder="请输入专业"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      毕业院校
                    </Label>
                    <Input
                      value={profileForm.university}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          university: e.target.value,
                        }))
                      }
                      placeholder="请输入毕业院校"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>毕业年份</Label>
                    <Input
                      type="number"
                      value={profileForm.graduateYear}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          graduateYear: e.target.value,
                        }))
                      }
                      placeholder="如：2020"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      当前单位
                    </Label>
                    <Input
                      value={profileForm.currentCompany}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          currentCompany: e.target.value,
                        }))
                      }
                      placeholder="请输入当前单位"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      当前职位
                    </Label>
                    <Input
                      value={profileForm.currentPosition}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          currentPosition: e.target.value,
                        }))
                      }
                      placeholder="请输入当前职位"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      紧急联系人
                    </Label>
                    <Input
                      value={profileForm.emergencyContact}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          emergencyContact: e.target.value,
                        }))
                      }
                      placeholder="请输入紧急联系人姓名"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      紧急联系电话
                    </Label>
                    <Input
                      value={profileForm.emergencyPhone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          emergencyPhone: e.target.value,
                        }))
                      }
                      placeholder="请输入紧急联系电话"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                修改密码
              </CardTitle>
              <CardDescription>定期修改密码可以提高账户安全性</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>当前密码</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="请输入当前密码"
                />
              </div>

              <div className="space-y-2">
                <Label>新密码</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="请输入新密码（至少6位）"
                />
              </div>

              <div className="space-y-2">
                <Label>确认新密码</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="请再次输入新密码"
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={
                  isSaving ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword
                }
              >
                {isSaving ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                修改密码
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
