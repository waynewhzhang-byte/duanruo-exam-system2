'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/lib/api'

export default function UsersPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  })
  const [loading, setLoading] = useState<string | null>(null)

  const canSubmit = form.username && form.email && form.password && form.fullName

  const submitTo = async (endpoint: string) => {
    if (!canSubmit) return
    setLoading(endpoint)
    try {
      await apiPost(endpoint, form)
      alert('创建成功')
      setForm({ username: '', email: '', password: '', fullName: '', phoneNumber: '' })
    } catch (e: any) {
      alert(`创建失败：${e?.message || '未知错误'}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600">创建管理员与审核员账号；后续将补充查询、启用/禁用、重置密码等。</p>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className="block text-sm text-gray-600 mb-1">用户名</label>
            <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="如 admin001" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-600 mb-1">邮箱</label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@example.com" />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm text-gray-600 mb-1">姓名</label>
            <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="张三" />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-1">手机（可选）</label>
            <Input id="phoneNumber" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="13800000000" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="password" className="block text-sm text-gray-600 mb-1">密码</label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="不少于6位" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button onClick={() => submitTo('/auth/admin/create-admin')} disabled={!canSubmit}>
            {loading === '/auth/admin/create-admin' ? '创建中...' : '创建管理员'}
          </Button>
          <Button variant="secondary" onClick={() => submitTo('/auth/admin/create-examiner')} disabled={!canSubmit}>
            {loading === '/auth/admin/create-examiner' ? '创建中...' : '创建考官'}
          </Button>
          <Button variant="outline" onClick={() => submitTo('/auth/admin/create-primary-reviewer')} disabled={!canSubmit}>
            {loading === '/auth/admin/create-primary-reviewer' ? '创建中...' : '创建初审员'}
          </Button>
          <Button variant="outline" onClick={() => submitTo('/auth/admin/create-secondary-reviewer')} disabled={!canSubmit}>
            {loading === '/auth/admin/create-secondary-reviewer' ? '创建中...' : '创建复审员'}
          </Button>
        </div>
      </div>
    </div>
  )
}
