'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useTenants, useActivateTenant, useDeactivateTenant } from '@/lib/api-hooks'
import { TenantType } from '@/lib/schemas'
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Power,
  PowerOff,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import CreateTenantDialog from '@/components/admin/tenants/CreateTenantDialog'
import EditTenantDialog from '@/components/admin/tenants/EditTenantDialog'

export default function TenantsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantType | null>(null)

  const { data: tenantsData, isLoading, error, refetch } = useTenants({
    page: 0,
    size: 100,
    activeOnly
  })

  const activateMutation = useActivateTenant()
  const deactivateMutation = useDeactivateTenant()

  const tenants = tenantsData?.content || []

  const filteredTenants = tenants.filter(tenant =>
    searchQuery === '' ||
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tenant.code || tenant.slug).toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleActivate = async (tenant: TenantType) => {
    try {
      await activateMutation.mutateAsync(tenant.id)
      toast.success(`租户 "${tenant.name}" 已激活`)
      refetch()
    } catch (error: any) {
      toast.error(error?.message || '激活失败')
    }
  }

  const handleDeactivate = async (tenant: TenantType) => {
    try {
      await deactivateMutation.mutateAsync(tenant.id)
      toast.success(`租户 "${tenant.name}" 已停用`)
      refetch()
    } catch (error: any) {
      toast.error(error?.message || '停用失败')
    }
  }

  const handleViewTenantExams = (tenant: TenantType) => {
    // Navigate to tenant's exam management page
    router.push(`/${tenant.slug}/admin/exams`)
  }

  const handleEdit = (tenant: TenantType) => {
    setSelectedTenant(tenant)
    setEditDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />激活</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="h-3 w-3 mr-1" />停用</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />待激活</Badge>
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />已删除</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">租户管理</h1>
          <p className="text-muted-foreground mt-2">
            管理系统中的所有租户实例
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建租户
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索租户名称、代码或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={activeOnly ? 'default' : 'outline'}
              onClick={() => setActiveOnly(!activeOnly)}
            >
              {activeOnly ? '显示全部' : '仅显示激活'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle>租户列表</CardTitle>
          <CardDescription>
            共 {filteredTenants.length} 个租户
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              <p className="font-semibold">加载失败</p>
              <p className="text-sm">{String(error)}</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : filteredTenants.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="暂无租户"
              description={searchQuery ? '没有找到匹配的租户' : '点击"创建租户"按钮添加第一个租户'}
            />
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">{tenant.name}</h3>
                        {getStatusBadge(tenant.status)}
                        <Badge variant="outline" className="text-xs">
                          {tenant.code || tenant.slug}
                        </Badge>
                      </div>
                      
                      {tenant.description && (
                        <p className="text-sm text-muted-foreground mb-3 ml-8">
                          {tenant.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm ml-8">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{tenant.contactEmail}</span>
                        </div>
                        {tenant.contactPhone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{tenant.contactPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>创建: {formatDate(tenant.createdAt)}</span>
                        </div>
                        {tenant.activatedAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            <span>激活: {formatDate(tenant.activatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewTenantExams(tenant)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        查看考试
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>

                      {tenant.status === 'ACTIVE' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(tenant)}
                          disabled={deactivateMutation.isPending}
                        >
                          <PowerOff className="h-4 w-4 mr-1" />
                          停用
                        </Button>
                      ) : tenant.status === 'PENDING' || tenant.status === 'INACTIVE' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(tenant)}
                          disabled={activateMutation.isPending}
                        >
                          <Power className="h-4 w-4 mr-1" />
                          激活
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTenantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch()
          setCreateDialogOpen(false)
        }}
      />

      {selectedTenant && (
        <EditTenantDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          tenant={selectedTenant}
          onSuccess={() => {
            refetch()
            setEditDialogOpen(false)
            setSelectedTenant(null)
          }}
        />
      )}
    </div>
  )
}


