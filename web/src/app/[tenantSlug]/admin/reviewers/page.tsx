'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/api'
import { TenantUserResponse } from '@/types/user'
import { toast } from 'sonner'
import { Plus, Search, UserCheck, Shield } from 'lucide-react'

export default function TenantReviewersPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [users, setUsers] = useState<TenantUserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const tenantRes = await apiGet<any>(`/tenants/slug/${tenantSlug}`)
        const tenantId = tenantRes.id

        const data = await apiGet<TenantUserResponse[]>(`/tenants/${tenantId}/users/details`)
        // Filter for reviewers only
        const reviewers = data.filter(u =>
          u.tenantRoles.includes('PRIMARY_REVIEWER') ||
          u.tenantRoles.includes('SECONDARY_REVIEWER')
        )
        setUsers(reviewers)
      } catch (error) {
        console.error('Failed to fetch reviewers:', error)
        toast.error('获取审核员列表失败')
      } finally {
        setLoading(false)
      }
    }

    if (tenantSlug) {
      fetchUsers()
    }
  }, [tenantSlug])

  const filteredUsers = users.filter(u =>
    u.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">审核员管理</h1>
          <p className="text-muted-foreground mt-2">
            管理负责考试报名审核的人员
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加审核员
        </Button>
      </div>

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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>审核员</TableHead>
                <TableHead>角色</TableHead>
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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无审核员
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((item) => (
                  <TableRow key={item.user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-purple-600" />
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
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role === 'PRIMARY_REVIEWER' ? '初审员' :
                              role === 'SECONDARY_REVIEWER' ? '复审员' : role}
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
                        管理权限
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
