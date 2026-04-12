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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiPost, apiGet, apiDelete } from '@/lib/api'

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
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [creating, setCreating] = useState(false)
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
      // 使用 apiGet 自动处理响应解包
      const result = await apiGet<any>('/super-admin/tenants?page=0&size=100');
      
      console.log('📥 租户管理数据:', result);

      if (result && Array.isArray(result.content)) {
        setTenants(result.content);
      } else if (Array.isArray(result)) {
        setTenants(result);
      } else {
        setTenants([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch tenants:', error);
      toast.error('获取租户列表失败');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    // 客户端校验
    if (!formData.name?.trim()) {
      toast.error('请输入租户名称');
      return;
    }
    if (!formData.slug?.trim()) {
      toast.error('请输入租户标识 (Slug)');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(formData.slug)) {
      toast.error('租户标识只能包含小写字母、数字、下划线或连字符');
      return;
    }
    if (!formData.contactEmail?.trim()) {
      toast.error('请输入联系邮箱');
      return;
    }

    try {
      setCreating(true);
      // 1. 创建租户
      const tenant = await apiPost<any>('/super-admin/tenants', {
        name: formData.name.trim(),
        code: formData.slug.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone?.trim() || undefined,
        description: formData.description?.trim() || ''
      });

      console.log('✅ 租户创建成功:', tenant);

      // 2. 自动激活
      try {
        await apiPost(`/super-admin/tenants/${tenant.id}/activate`, {});
        toast.success('租户创建并激活成功');
      } catch (e) {
        toast.warning('租户创建成功，但激活失败，请手动启用');
      }

      setShowCreateDialog(false);
      setFormData({ name: '', slug: '', contactName: '', contactPhone: '', contactEmail: '', description: '' });
      fetchTenants();
    } catch (error: any) {
      toast.error('创建租户失败: ' + (error?.message || '未知错误'));
    } finally {
      setCreating(false);
    }
  };

  const handleDisableTenant = async () => {
    if (!selectedTenant) return;
    try {
      await apiPost(`/super-admin/tenants/${selectedTenant.id}/deactivate`, {});
      setShowDisableDialog(false);
      setSelectedTenant(null);
      fetchTenants();
      toast.success('租户已禁用');
    } catch (error: any) {
      toast.error('禁用失败: ' + error.message);
    }
  };

  const handleEnableTenant = async () => {
    if (!selectedTenant) return;
    try {
      await apiPost(`/super-admin/tenants/${selectedTenant.id}/activate`, {});
      setShowEnableDialog(false);
      setSelectedTenant(null);
      fetchTenants();
      toast.success('租户已启用');
    } catch (error: any) {
      toast.error('启用失败: ' + error.message);
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    try {
      await apiDelete(`/super-admin/tenants/${selectedTenant.id}`);
      setShowDeleteDialog(false);
      setSelectedTenant(null);
      fetchTenants();
      toast.success('租户已删除');
    } catch (error: any) {
      toast.error('删除失败: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">租户管理</h1>
          <p className="text-sm text-gray-600 mt-2">总共 {tenants.length} 个租户</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建租户
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">正在加载数据...</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>租户名称</TableHead>
                <TableHead>租户标识</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    暂无租户数据
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.slug || tenant.code}</TableCell>
                    <TableCell>
                      <div className="text-sm">{tenant.contactEmail || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {tenant.status === 'ACTIVE' ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {tenant.status === 'ACTIVE' ? (
                          <Button variant="outline" size="sm" onClick={() => { setSelectedTenant(tenant); setShowDisableDialog(true); }}>
                            禁用
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setSelectedTenant(tenant); setShowEnableDialog(true); }}>
                            启用
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => { setSelectedTenant(tenant); setShowDeleteDialog(true); }}>
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 创建对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新租户</DialogTitle>
            <DialogDescription>
              请输入租户的基础信息。租户标识（Slug）将作为访问 URL 的一部分。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">租户名称</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="例如：某某大学" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">租户标识 (Slug)</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="例如：demo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">联系邮箱</Label>
              <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="hr@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>取消</Button>
            <Button onClick={handleCreateTenant} disabled={creating}>
              {creating ? '创建中...' : '确定创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 - 禁用 */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认禁用</DialogTitle></DialogHeader>
          <p>确定要禁用租户 {selectedTenant?.name} 吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDisableTenant}>确认禁用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 - 启用 */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认启用</DialogTitle></DialogHeader>
          <p>确定要启用租户 {selectedTenant?.name} 吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnableDialog(false)}>取消</Button>
            <Button onClick={handleEnableTenant}>确认启用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 - 删除 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-600">危险操作</DialogTitle></DialogHeader>
          <p>确定要<b>删除</b>租户 {selectedTenant?.name} 吗？此操作不可逆，将删除该租户下的所有数据。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteTenant}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
