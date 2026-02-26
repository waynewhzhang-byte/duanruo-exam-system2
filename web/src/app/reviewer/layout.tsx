'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ClipboardCheck,
  ListChecks,
  FileCheck,
  Menu,
  LogOut,
  User,
  ChevronDown,
  History,
  Bell,
  Search,
  ChevronRight,
  Clock,
  AlertCircle
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
import { Badge } from '@/components/ui/badge';

interface ReviewerLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    href: '/reviewer',
    label: '审核首页',
    icon: Home,
  },
  {
    href: '/reviewer/queue',
    label: '待审核队列',
    icon: ListChecks,
  },
  {
    href: '/reviewer/review',
    label: '审核记录',
    icon: FileCheck,
  },
  {
    href: '/reviewer/tasks',
    label: '我的任务',
    icon: ClipboardCheck,
  },
  {
    href: '/reviewer/history',
    label: '审核历史',
    icon: History,
  },
];

export default function ReviewerLayout({ children }: ReviewerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    sessionStorage.clear();
    router.push('/login');
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Mock notification count for demo
  const notificationCount = 3;

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gradient-to-b from-stone-800 to-stone-900 border-r border-stone-700 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-700">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">审核中心</span>
                <span className="text-[10px] text-stone-400">工作台</span>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg mx-auto">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "text-stone-400 hover:text-white hover:bg-stone-700",
              !sidebarOpen && "mx-auto"
            )}
          >
            {sidebarOpen ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  active 
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25" 
                    : "text-stone-300 hover:bg-stone-700/50 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-stone-400")} />
                {sidebarOpen && <span>{item.label}</span>}
                {!sidebarOpen && active && (
                  <div className="absolute right-2 w-2 h-2 bg-amber-400 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats in Sidebar */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-t border-stone-700">
            <div className="bg-stone-700/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">今日任务</span>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">12</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">本周完成</span>
                <span className="text-stone-300 font-medium">48</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-stone-700">
          {sidebarOpen ? (
            <div className="text-center">
              <div className="text-xs text-stone-500">端若数智考盟</div>
              <div className="text-[10px] text-stone-600">审核工作台 v2.0</div>
            </div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-stone-800">审核工作台</h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-stone-500">
              <Clock className="h-4 w-4" />
              <span>今日任务: 12</span>
              <span className="text-stone-300">|</span>
              <span>已完成: 5</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="搜索报名..." 
                className="w-72 h-9 bg-stone-50 border-stone-200 pl-10 focus:border-amber-400 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Priority Alert */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">3 高优先级</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-stone-500 hover:text-stone-700 relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-stone-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-stone-600 to-stone-700 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-stone-700 hidden md:inline">{currentUser.username}</span>
                    <ChevronDown className="h-4 w-4 text-stone-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentUser.username}</p>
                      <p className="text-xs text-stone-500">
                        {currentUser.roles?.includes('PRIMARY_REVIEWER') ? '一级审核员' : '二级审核员'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>个人设置</span>
                  </DropdownMenuItem>
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

        <div className="flex-1 overflow-y-auto bg-stone-50">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
