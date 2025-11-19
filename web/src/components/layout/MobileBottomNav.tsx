'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  userRole?: string
}

/**
 * 移动端底部导航组件
 * 提供快速访问主要功能的底部导航栏
 * 
 * @param userRole - 用户角色，用于显示不同的导航项
 */
export default function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // 根据角色定义导航项
  const getNavItems = () => {
    const baseItems = [
      {
        label: '首页',
        icon: Home,
        href: '/dashboard',
        roles: ['SYSTEM_ADMIN', 'INSTANCE_ADMIN', 'CANDIDATE', 'REVIEWER_L1', 'REVIEWER_L2']
      },
      {
        label: '我的',
        icon: User,
        href: '/profile',
        roles: ['SYSTEM_ADMIN', 'INSTANCE_ADMIN', 'CANDIDATE', 'REVIEWER_L1', 'REVIEWER_L2']
      }
    ]

    // 根据角色添加特定导航项
    if (userRole === 'CANDIDATE') {
      return [
        baseItems[0],
        {
          label: '报名',
          icon: FileText,
          href: '/my-applications',
          roles: ['CANDIDATE']
        },
        baseItems[1]
      ]
    }

    if (userRole === 'REVIEWER_L1' || userRole === 'REVIEWER_L2') {
      return [
        baseItems[0],
        {
          label: '审核',
          icon: FileText,
          href: '/review-queue',
          roles: ['REVIEWER_L1', 'REVIEWER_L2']
        },
        baseItems[1]
      ]
    }

    if (userRole === 'SYSTEM_ADMIN' || userRole === 'INSTANCE_ADMIN') {
      return [
        baseItems[0],
        {
          label: '考试',
          icon: FileText,
          href: '/admin/exams',
          roles: ['SYSTEM_ADMIN', 'INSTANCE_ADMIN']
        },
        {
          label: '设置',
          icon: Settings,
          href: '/admin/settings',
          roles: ['SYSTEM_ADMIN', 'INSTANCE_ADMIN']
        },
        baseItems[1]
      ]
    }

    return baseItems
  }

  const navItems = getNavItems()

  const handleNavClick = (href: string) => {
    router.push(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                'active:bg-gray-100',
                isActive ? 'text-primary' : 'text-gray-600'
              )}
            >
              <Icon className={cn('h-6 w-6 mb-1', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-xs', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

