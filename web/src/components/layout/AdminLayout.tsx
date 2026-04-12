'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Settings,
  BarChart3,
  Menu,
  ChevronDown,
  ChevronRight,
  Building,
  UserCheck,
  LogOut,
  User,
  FileText,
  Plus,
  ShieldAlert,
  ClipboardList,
  Bell,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/loading';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

// Admin roles that can access the admin panel
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'EXAM_ADMIN'];

type AdminAccess = 'loading' | 'unauthenticated' | 'forbidden' | 'allowed';

export default function AdminLayout({ children, tenantSlug }: AdminLayoutProps & { tenantSlug?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['系统管理']);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const adminAccess = useMemo((): AdminAccess => {
    if (isLoading) return 'loading';
    if (!isAuthenticated || !user) return 'unauthenticated';
    const userRoles = user.roles || [];
    if (!userRoles.some((role: string) => ADMIN_ROLES.includes(role))) return 'forbidden';
    return 'allowed';
  }, [isLoading, isAuthenticated, user]);

  // Generate navigation items based on context
  const getNavigationItems = (): NavItem[] => {
    const basePath = tenantSlug ? `/${tenantSlug}/admin` : '/admin';

    if (tenantSlug) {
      // Tenant Admin Navigation
      return [
        {
          href: basePath,
          label: '管理首页',
          icon: Home,
        },
        {
          label: '考试管理',
          icon: FileText,
          children: [
            {
              href: `${basePath}/exams`,
              label: '考试列表',
              icon: FileText,
            },
            {
              href: `${basePath}/exams/create`,
              label: '创建考试',
              icon: Plus,
            }
          ]
        },
        {
          label: '用户管理',
          icon: Users,
          children: [
            {
              href: `${basePath}/users`,
              label: '用户列表',
              icon: Users,
            },
            {
              href: `${basePath}/reviewers`,
              label: '审核员管理',
              icon: UserCheck,
            },
            {
              href: `${basePath}/reviews`,
              label: '审核记录审计',
              icon: ClipboardList,
            }
          ]
        },
        {
          href: `${basePath}/analytics`,
          label: '数据分析',
          icon: BarChart3,
        }
      ];
    }

    // Global Admin Navigation
    return [
      {
        href: '/admin',
        label: '管理首页',
        icon: Home,
      },
      {
        label: '系统管理',
        icon: Settings,
        children: [
          {
            href: '/admin/tenants',
            label: '租户管理',
            icon: Building,
          },
          {
            href: '/admin/users',
            label: '用户管理',
            icon: Users,
          },
          {
            href: '/admin/reviewers',
            label: '审核员管理',
            icon: UserCheck,
          },
          {
            href: '/admin/reviews',
            label: '审核记录审计',
            icon: ClipboardList,
          },
          {
            href: '/admin/settings',
            label: '系统设置',
            icon: Settings,
          },
        ],
      },
      {
        href: '/admin/analytics',
        label: '数据分析',
        icon: BarChart3,
      },
    ];
  };

  const navigationItems = getNavigationItems();

  // 权限检查：未登录或非管理员时重定向（使用派生状态，避免 useState + Strict Mode 下反复回到「验证中」造成页面抖动）
  useEffect(() => {
    if (adminAccess === 'loading') return;

    if (adminAccess === 'unauthenticated') {
      const loginBase = tenantSlug ? `/${tenantSlug}/login` : '/login';
      router.replace(`${loginBase}?redirect=` + encodeURIComponent(pathname));
      return;
    }

    if (adminAccess === 'forbidden') {
      console.warn('User does not have admin role, redirecting to candidate page');
      router.replace(tenantSlug ? `/${tenantSlug}/candidate` : '/');
    }
  }, [adminAccess, pathname, tenantSlug, router]);

  if (adminAccess === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-600">正在验证权限...</p>
        </div>
      </div>
    );
  }

  if (adminAccess === 'unauthenticated' || adminAccess === 'forbidden') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            {adminAccess === 'forbidden' ? '访问被拒绝' : '需要登录'}
          </h1>
          <p className="text-slate-600">正在跳转...</p>
        </div>
      </div>
    );
  }

  // 退出登录：必须清除 httpOnly 会话 cookie（/api/session DELETE），否则 /login 会探测到旧会话并自动跳回管理端
  const handleLogout = async () => {
    await logout();
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('tenantRoles');
      localStorage.removeItem('pendingTenantSelection');
      sessionStorage.removeItem('token');
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const active = item.href ? isActive(item.href) : false;

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              level === 0 
                ? "text-slate-300 hover:bg-slate-700/50 hover:text-white" 
                : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200",
              isExpanded && "bg-slate-700/30"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5", sidebarOpen ? "" : "mx-auto")} />
              {sidebarOpen && <span>{item.label}</span>}
            </div>
            {sidebarOpen && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && sidebarOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children!.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mb-1",
          active
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
            : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
          !sidebarOpen && "justify-center px-2"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {sidebarOpen && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">管理后台</span>
                <span className="text-[10px] text-slate-400">企业版</span>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg mx-auto">
              <Building className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "text-slate-400 hover:text-white hover:bg-slate-700",
              !sidebarOpen && "mx-auto"
            )}
          >
            {sidebarOpen ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700">
          {sidebarOpen ? (
            <div className="text-center">
              <div className="text-xs text-slate-500">端若数智考盟</div>
              <div className="text-[10px] text-slate-600">v2.0 企业版</div>
            </div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">系统管理</h1>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="搜索功能..." 
                className="w-64 h-9 bg-slate-50 border-slate-200 pl-10 focus:border-blue-400 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <Bell className="h-5 w-5" />
            </Button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden md:inline">{user.username}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-slate-500">
                        {user.roles?.join(', ') || '未知角色'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>个人设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>系统设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void handleLogout();
                    }}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-100">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
