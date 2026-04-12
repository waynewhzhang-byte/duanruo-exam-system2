'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown, User, LogOut, Settings, Bell } from 'lucide-react';

interface AppNavigationProps {
  user?: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  onSignOut?: () => void;
}

export default function AppNavigation({ user, onSignOut }: AppNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if (!user) {
    return null;
  }

  // 角色中文映射
  const ROLE_LABELS: Record<string, string> = {
    'SUPER_ADMIN': '超级管理员',
    'ADMIN': '超级管理员',
    'TENANT_ADMIN': '租户管理员',
    'EXAM_ADMIN': '考试管理员',
    'PRIMARY_REVIEWER': '初审员',
    'SECONDARY_REVIEWER': '复审员',
    'CANDIDATE': '考生',
    'EXAMINER': '考官',
  };

  // 角色优先级定义 (数值越小优先级越高)
  const ROLE_PRIORITY: Record<string, number> = {
    'SUPER_ADMIN': 1,
    'ADMIN': 2,
    'TENANT_ADMIN': 3,
    'EXAM_ADMIN': 4,
    'PRIMARY_REVIEWER': 5,
    'SECONDARY_REVIEWER': 6,
    'EXAMINER': 7,
    'CANDIDATE': 99,
  };

  // 获取主角色（优先级最高的角色）
  const getPrimaryRole = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'CANDIDATE';
    const initialRole: string = roles[0] ?? 'CANDIDATE';
    return roles.reduce<string>(
      (prev, curr) => {
        const prevPriority = ROLE_PRIORITY[prev] || 100;
        const currPriority = ROLE_PRIORITY[curr] || 100;
        return prevPriority < currPriority ? prev : curr;
      },
      initialRole,
    );
  };

  const primaryRole = getPrimaryRole(user.roles);

  // 角色判断 - 修正角色名称
  const isSystemAdmin = user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN');
  const isTenantAdmin = user.roles.includes('TENANT_ADMIN');
  const isReviewer = user.roles.includes('PRIMARY_REVIEWER') || user.roles.includes('SECONDARY_REVIEWER');
  const isCandidate = user.roles.includes('CANDIDATE');

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      router.push('/login');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-primary transition-colors">
              考试报名系统
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                "text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === '/dashboard' && "bg-gray-100 text-gray-900"
              )}
            >
              仪表板
            </Link>

            {/* System Admin Menu */}
            {isSystemAdmin && (
              <div className="relative group">
                <button className={cn(
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  pathname.startsWith('/admin') && "bg-gray-100 text-gray-900"
                )}>
                  系统管理
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible border z-50">
                  <Link href="/admin/exams" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    考试管理
                  </Link>
                  <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    用户管理
                  </Link>
                  <Link href="/admin/tenants" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    租户管理
                  </Link>
                  <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    系统设置
                  </Link>
                </div>
              </div>
            )}

            {/* Tenant Admin Menu */}
            {(isSystemAdmin || isTenantAdmin) && (
              <div className="relative group">
                <button className={cn(
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  pathname.startsWith('/tenant') && "bg-gray-100 text-gray-900"
                )}>
                  租户管理
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible border z-50">
                  <Link href="/tenant/positions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    岗位管理
                  </Link>
                  <Link href="/tenant/subjects" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    科目管理
                  </Link>
                  <Link href="/tenant/applications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    申请管理
                  </Link>
                  <Link href="/tenant/analytics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    数据分析
                  </Link>
                </div>
              </div>
            )}

            {/* Reviewer Menu */}
            {(isSystemAdmin || isTenantAdmin || isReviewer) && (
              <Link
                href="/reviewer/queue"
                className={cn(
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith('/reviewer') && "bg-gray-100 text-gray-900"
                )}
              >
                审核中心
              </Link>
            )}

            {/* Candidate Menu */}
            {isCandidate && (
              <Link
                href="/candidate/exams"
                className={cn(
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith('/candidate') && "bg-gray-100 text-gray-900"
                )}
              >
                我的报名
              </Link>
            )}

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {ROLE_LABELS[primaryRole] || primaryRole}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible border z-50">
                <div className="px-4 py-2 border-b">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.roles.map((role, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {ROLE_LABELS[role] || role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="h-4 w-4" />
                  个人资料
                </Link>
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                  账户设置
                </Link>
                <Link href="/notifications" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Bell className="h-4 w-4" />
                  通知中心
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium",
                pathname === '/dashboard'
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              仪表板
            </Link>

            {isSystemAdmin && (
              <>
                <div className="px-3 py-2 text-sm font-semibold text-gray-500">系统管理</div>
                <Link href="/admin/exams" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                  考试管理
                </Link>
                <Link href="/admin/users" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                  用户管理
                </Link>
              </>
            )}

            {(isSystemAdmin || isTenantAdmin) && (
              <>
                <div className="px-3 py-2 text-sm font-semibold text-gray-500">租户管理</div>
                <Link href="/tenant/positions" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                  岗位管理
                </Link>
                <Link href="/tenant/applications" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                  申请管理
                </Link>
              </>
            )}

            {(isSystemAdmin || isTenantAdmin || isReviewer) && (
              <Link href="/reviewer/queue" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                审核中心
              </Link>
            )}

            {isCandidate && (
              <Link href="/candidate/exams" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                我的报名
              </Link>
            )}

            <hr className="my-2" />
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

