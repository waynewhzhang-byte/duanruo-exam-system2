'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { UserRole } from '@/types/auth'

interface User {
  id: string
  username: string
  email: string
  fullName: string
  roles: UserRole[]
}

interface DashboardLayoutProps {
  children: ReactNode
  user?: User
}

interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  // Candidate routes
  { label: '我的报名', href: '/candidate/applications', icon: '📝', roles: ['CANDIDATE'] },
  { label: '我的文件', href: '/candidate/files', icon: '📁', roles: ['CANDIDATE'] },
  { label: '准考证', href: '/candidate/tickets', icon: '🎫', roles: ['CANDIDATE'] },
  
  // Reviewer routes
  { label: '审核队列', href: '/reviewer/queue', icon: '📋', roles: ['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER'] },
  { label: '我的任务', href: '/reviewer/tasks', icon: '✅', roles: ['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER'] },
  
  // Admin routes (global - super admin only)
  { label: '仪表盘', href: '/admin', icon: '🏠', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: '租户管理', href: '/admin/tenants', icon: '🏢', roles: ['SUPER_ADMIN'] },
  { label: '用户管理', href: '/admin/users', icon: '👥', roles: ['SUPER_ADMIN'] },
  { label: '系统设置', href: '/admin/settings', icon: '⚙️', roles: ['SUPER_ADMIN'] },

  // Note: 考试管理、岗位管理等应该在租户上下文中访问
  // 路由格式：/{tenantSlug}/admin/exams
]

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(user || null)

  useEffect(() => {
    // Get user info from cookie if not provided as prop
    if (!currentUser) {
      const userInfo = document.cookie
        .split('; ')
        .find(row => row.startsWith('user-info='))
        ?.split('=')[1]
      
      if (userInfo) {
        try {
          setCurrentUser(JSON.parse(decodeURIComponent(userInfo)))
        } catch (error) {
          console.error('Failed to parse user info:', error)
        }
      }
    }
  }, [currentUser])

  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect even if API call fails
      router.push('/login')
    }
  }

  const getVisibleNavItems = () => {
    if (!currentUser) return []
    
    return NAV_ITEMS.filter(item => 
      item.roles.some(role => currentUser.roles.includes(role))
    )
  }

  const getUserRoleLabel = () => {
    if (!currentUser) return ''
    
    if (currentUser.roles.includes('SUPER_ADMIN')) return '超级管理员'
    if (currentUser.roles.includes('ADMIN')) return '管理员'
    if (currentUser.roles.includes('PRIMARY_REVIEWER')) return '初审员'
    if (currentUser.roles.includes('SECONDARY_REVIEWER')) return '复审员'
    if (currentUser.roles.includes('CANDIDATE')) return '候选人'
    return '用户'
  }

  const getDashboardTitle = () => {
    if (pathname.startsWith('/candidate')) return '候选人门户'
    if (pathname.startsWith('/reviewer')) return '审核员工作台'
    if (pathname.startsWith('/admin')) return '管理员后台'
    return '工作台'
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 bg-blue-600 text-white">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <span className="text-blue-600 text-sm font-bold">端</span>
            </div>
            <span className="text-lg font-semibold">端若考盟</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2 list-none">
            {getVisibleNavItems().map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSidebarOpen(false); } }}
          aria-label="关闭侧栏"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 md:ml-0 text-xl font-semibold text-gray-900">
                {getDashboardTitle()}
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* 快捷入口 */}
              <div className="hidden lg:flex items-center space-x-6">
                <Link href="/admin/users" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  用户管理
                </Link>
                <Link href="/admin/settings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  系统设置
                </Link>
              </div>

              {/* User info */}
              {currentUser && (
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {currentUser.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getUserRoleLabel()}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    退出
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            <div className="max-w-7xl mx-auto px-6 py-8 h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
