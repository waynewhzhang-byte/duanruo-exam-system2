'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface Tenant {
  id: string
  name: string
  slug: string
  code?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED'
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  description?: string
  createdAt: string
  activatedAt?: string
}

export default function SuperAdminTenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
  })

  useEffect(() => {
    fetchTenants()
  }, [activeOnly])

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/v1/super-admin/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 后端返回格式: { content: [...], totalElements, totalPages, ... }
        if (data && Array.isArray(data.content)) {
          setTenants(data.content);
        } else if (Array.isArray(data)) {
          setTenants(data);
        } else if (data && Array.isArray(data.data)) {
          setTenants(data.data);
        } else {
          console.error('Invalid tenants data format:', data);
          setTenants([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch tenants:', response.status, errorText);
        setTenants([]);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/v1/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.slug,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          description: ''
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({ name: '', slug: '', contactName: '', contactPhone: '', contactEmail: '' });
        fetchTenants();
        alert('租户创建成功');
      } else {
        const errorText = await response.text();
        console.error('Failed to create tenant:', response.status, errorText);
        alert('创建租户失败: ' + errorText);
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert('创建租户失败: ' + error);
    }
  };

  const handleDisableTenant = async () => {
    if (!selectedTenant) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/v1/super-admin/tenants/${selectedTenant.id}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDisableDialog(false);
        setSelectedTenant(null);
        fetchTenants();
        alert('租户已禁用');
      } else {
        const errorText = await response.text();
        console.error('Failed to disable tenant:', response.status, errorText);
        alert('禁用租户失败');
      }
    } catch (error) {
      console.error('Failed to disable tenant:', error);
      alert('禁用租户失败');
    }
  };

  const handleEnableTenant = async () => {
    if (!selectedTenant) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/v1/super-admin/tenants/${selectedTenant.id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowEnableDialog(false);
        setSelectedTenant(null);
        fetchTenants();
        alert('租户已启用');
      } else {
        const errorText = await response.text();
        console.error('Failed to enable tenant:', response.status, errorText);
        alert('启用租户失败');
      }
    } catch (error) {
      console.error('Failed to enable tenant:', error);
      alert('启用租户失败');
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/v1/super-admin/tenants/${selectedTenant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setSelectedTenant(null);
        fetchTenants();
        alert('租户已删除');
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">租户管理</h1>
        <Button onClick={() => setShowCreateDialog(true)}>创建租户</Button>
      </div>

      {loading ? (
        <div>加载中...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>租户名称</TableHead>
              <TableHead>租户标识</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>{tenant.slug}</TableCell>
                <TableCell>{tenant.contactName || '-'}</TableCell>
                <TableCell>{tenant.contactPhone || '-'}</TableCell>
                <TableCell>
                  <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {tenant.status === 'ACTIVE' ? '启用' : '禁用'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setShowConfigDialog(true);
                      }}
                    >
                      配置
                    </Button>
                    {tenant.status === 'ACTIVE' ? (
                      <Button
                        data-testid="btn-disable-tenant"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowDisableDialog(true);
                        }}
                      >
                        禁用
                      </Button>
                    ) : (
                      <Button
                        data-testid="btn-enable-tenant"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowEnableDialog(true);
                        }}
                      >
                        启用
                      </Button>
                    )}
                    <Button
                      data-testid="btn-delete-tenant"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setShowDeleteDialog(true);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 创建租户对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建租户</DialogTitle>
            <DialogDescription>填写租户信息以创建新租户</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                租户名称
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                租户标识
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactName" className="text-right">
                联系人
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPhone" className="text-right">
                联系电话
              </Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactEmail" className="text-right">
                联系邮箱
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTenant}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 禁用租户对话框 */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁用租户</DialogTitle>
            <DialogDescription>
              确定要禁用租户 "{selectedTenant?.name}" 吗？禁用后该租户的用户将无法登录。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDisableTenant}>
              确认禁用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 启用租户对话框 */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>启用租户</DialogTitle>
            <DialogDescription>
              确定要启用租户 "{selectedTenant?.name}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnableDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEnableTenant}>确认启用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除租户对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除租户</DialogTitle>
            <DialogDescription>
              警告：将删除所有租户数据！此操作不可恢复。
              <br />
              请输入确认文本 "确认删除" 以继续。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="确认删除" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteTenant}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

