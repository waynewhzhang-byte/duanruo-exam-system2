'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Upload,
  Ticket,
  TrendingUp,
  Menu,
  LogOut,
  User,
  ChevronDown,
  Bell,
  Search,
  ChevronRight,
  GraduationCap,
  Settings,
  HelpCircle,
  MessageCircle
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
import { TenantProvider } from '@/contexts/TenantContext';

interface CandidateLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    href: '/candidate',
    label: '我的首页',
    icon: Home,
  },
  {
    href: '/candidate/exams',
    label: '考试报名',
    icon: FileText,
  },
  {
    href: '/candidate/applications',
    label: '我的报名',
    icon: FileText,
  },
  {
    href: '/candidate/files',
    label: '文件管理',
    icon: Upload,
  },
  {
    href: '/candidate/tickets',
    label: '准考证',
    icon: Ticket,
  },
  {
    href: '/candidate/scores',
    label: '成绩查询',
    icon: TrendingUp,
  },
];

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenantSlug, setTenantSlug] = useState<string | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        // Get tenant slug from tenantRoles
        const tenantRolesStr = localStorage.getItem('tenantRoles');
        if (tenantRolesStr) {
          const tenantRoles = JSON.parse(tenantRolesStr);
          if (tenantRoles && tenantRoles.length > 0) {
            setTenantSlug(tenantRoles[0].tenantCode);
          }
        }
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

  return (
    <TenantProvider tenantSlug={tenantSlug}>
      <div className="flex h-screen bg-emerald-50/50">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-gradient-to-b from-emerald-900 to-teal-900 border-r border-emerald-800 transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wide">考生中心</span>
                  <span className="text-[10px] text-emerald-400">个人门户</span>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg mx-auto">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "text-emerald-400 hover:text-white hover:bg-emerald-800",
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
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25" 
                      : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white",
                    !sidebarOpen && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-emerald-400")} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Progress Card in Sidebar */}
          {sidebarOpen && (
            <div className="px-4 py-3 border-t border-emerald-800">
              <div className="bg-emerald-800/50 rounded-lg p-3 space-y-3">
                <div className="text-xs text-emerald-300 font-medium">报名进度</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">进行中</span>
                    <Badge variant="secondary" className="bg-emerald-600/30 text-emerald-300 border-emerald-600/50">2</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">已完成</span>
                    <span className="text-emerald-200 font-medium">5</span>
                  </div>
                  <div className="w-full bg-emerald-900/50 rounded-full h-1.5 mt-2">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-emerald-800">
            {sidebarOpen ? (
              <div className="text-center">
                <div className="text-xs text-emerald-500">端若数智考盟</div>
                <div className="text-[10px] text-emerald-600">考生门户 v2.0</div>
              </div>
            ) : (
              <div className="h-8"></div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <header className="bg-white border-b border-emerald-100 h-16 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-emerald-800">考生中心</h1>
            </div>
            
            {/* Search */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <Input 
                  placeholder="搜索考试或报名..." 
                  className="w-72 h-9 bg-emerald-50 border-emerald-200 pl-10 focus:border-emerald-400 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Help Button */}
              <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                <HelpCircle className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>

              {currentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-emerald-50">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-emerald-800 hidden md:inline">{currentUser.username}</span>
                      <ChevronDown className="h-4 w-4 text-emerald-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{currentUser.username}</p>
                        <p className="text-xs text-emerald-500">考生账号</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>个人资料</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>账号设置</span>
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

          <div className="flex-1 overflow-y-auto bg-emerald-50/30">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </TenantProvider>
  );
}
