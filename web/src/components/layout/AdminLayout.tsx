'use client';

import { useState, useEffect } from 'react';
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
  User
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
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

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['系统管理']);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 获取当前用户信息
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // 退出登录
  const handleLogout = () => {
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    sessionStorage.clear();

    // 跳转到登录页
    router.push('/login');
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
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
              level === 0 ? "text-gray-700 hover:bg-gray-100" : "text-gray-600 hover:bg-gray-50",
              isExpanded && "bg-gray-50"
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
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mb-1",
          active 
            ? "bg-primary text-primary-foreground" 
            : "text-gray-700 hover:bg-gray-100",
          !sidebarOpen && "justify-center"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {sidebarOpen && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <h2 className="text-lg font-semibold text-gray-900">管理后台</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          {sidebarOpen ? (
            <div className="text-xs text-gray-500 text-center">
              考试报名管理系统 v1.0
            </div>
          ) : (
            <div className="h-2"></div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {pathname === '/admin' ? '管理首页' : ''}
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{currentUser.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentUser.username}</p>
                      <p className="text-xs text-gray-500">
                        {currentUser.roles?.join(', ') || '未知角色'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

