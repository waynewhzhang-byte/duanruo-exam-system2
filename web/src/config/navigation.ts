/**
 * Role-based navigation configuration
 * Defines navigation menu items for each role
 */

import {
  Home,
  Building2,
  Users,
  FileText,
  ClipboardList,
  Settings,
  BarChart3,
  Bell,
  Calendar,
  MapPin,
  Trophy,
  CheckSquare,
  UserCheck,
  Ticket,
  AlertCircle,
  LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon?: LucideIcon
  badge?: string | number
  children?: NavigationItem[]
  description?: string
}

export interface RoleNavigation {
  primary: NavigationItem[]
  secondary?: NavigationItem[]
  user?: NavigationItem[]
}

/**
 * Get navigation items for SUPER_ADMIN role
 */
export function getSuperAdminNavigation(): RoleNavigation {
  return {
    primary: [
      {
        label: '租户管理',
        href: '/super-admin/tenants',
        icon: Building2,
        description: '管理所有租户',
      },
      {
        label: '用户管理',
        href: '/super-admin/users',
        icon: Users,
        description: '管理全局用户',
      },
      {
        label: '系统监控',
        href: '/super-admin/monitor',
        icon: BarChart3,
        description: '系统运行状态监控',
      },
      {
        label: '系统设置',
        href: '/super-admin/settings',
        icon: Settings,
        description: '全局系统配置',
      },
    ],
  }
}

/**
 * Get navigation items for TENANT_ADMIN role
 */
export function getTenantAdminNavigation(tenantSlug: string): RoleNavigation {
  return {
    primary: [
      {
        label: '仪表盘',
        href: `/${tenantSlug}/admin`,
        icon: Home,
        description: '概览统计',
      },
      {
        label: '考试管理',
        href: `/${tenantSlug}/admin/exams`,
        icon: FileText,
        description: '创建和管理考试',
        children: [
          {
            label: '考试列表',
            href: `/${tenantSlug}/admin/exams`,
          },
          {
            label: '创建考试',
            href: `/${tenantSlug}/admin/exams/new`,
          },
        ],
      },
      {
        label: '审核管理',
        href: `/${tenantSlug}/admin/reviews`,
        icon: CheckSquare,
        description: '查看所有报名审核',
        children: [
          {
            label: '待审核列表',
            href: `/${tenantSlug}/admin/reviews`,
          },
          {
            label: '审核员管理',
            href: `/${tenantSlug}/admin/reviewers`,
          },
        ],
      },
      {
        label: '成绩管理',
        href: `/${tenantSlug}/admin/scores`,
        icon: Trophy,
        description: '录入和查看成绩',
      },
      {
        label: '考场管理',
        href: `/${tenantSlug}/admin/seat-arrangement`,
        icon: MapPin,
        description: '考场和座位分配',
      },
      {
        label: '统计报表',
        href: `/${tenantSlug}/admin/analytics`,
        icon: BarChart3,
        description: '数据统计分析',
      },
    ],
    secondary: [
      {
        label: '通知管理',
        href: `/${tenantSlug}/admin/notifications`,
        icon: Bell,
      },
      {
        label: '租户设置',
        href: `/${tenantSlug}/admin/settings`,
        icon: Settings,
      },
    ],
  }
}

/**
 * Get navigation items for EXAM_ADMIN role
 */
export function getExamAdminNavigation(tenantSlug: string): RoleNavigation {
  return {
    primary: [
      {
        label: '我的考试',
        href: `/${tenantSlug}/admin/exams`,
        icon: FileText,
        description: '查看管理的考试',
      },
      {
        label: '报名审核',
        href: `/${tenantSlug}/admin/reviews`,
        icon: CheckSquare,
        description: '审核报名申请',
      },
      {
        label: '成绩管理',
        href: `/${tenantSlug}/admin/scores`,
        icon: Trophy,
        description: '录入成绩',
      },
      {
        label: '考场分配',
        href: `/${tenantSlug}/admin/seat-arrangement`,
        icon: MapPin,
        description: '座位安排',
      },
      {
        label: '统计数据',
        href: `/${tenantSlug}/admin/analytics`,
        icon: BarChart3,
        description: '查看统计',
      },
    ],
  }
}

/**
 * Get navigation items for PRIMARY_REVIEWER / SECONDARY_REVIEWER roles
 */
export function getReviewerNavigation(tenantSlug: string): RoleNavigation {
  return {
    primary: [
      {
        label: '审核队列',
        href: `/${tenantSlug}/reviewer/queue`,
        icon: ClipboardList,
        description: '待审核申请',
      },
      {
        label: '审核历史',
        href: `/${tenantSlug}/reviewer/history`,
        icon: FileText,
        description: '我的审核记录',
      },
      {
        label: '个人统计',
        href: `/${tenantSlug}/reviewer/stats`,
        icon: BarChart3,
        description: '审核统计数据',
      },
    ],
    secondary: [
      {
        label: '可报名考试',
        href: `/${tenantSlug}/exams`,
        icon: Calendar,
      },
    ],
  }
}

/**
 * Get navigation items for CANDIDATE role
 */
export function getCandidateNavigation(tenantSlug: string): RoleNavigation {
  return {
    primary: [
      {
        label: '考试列表',
        href: `/${tenantSlug}/exams`,
        icon: Calendar,
        description: '浏览可报名考试',
      },
      {
        label: '我的报名',
        href: `/${tenantSlug}/my-applications`,
        icon: ClipboardList,
        description: '查看报名状态',
      },
      {
        label: '准考证',
        href: `/${tenantSlug}/candidate/tickets`,
        icon: Ticket,
        description: '下载准考证',
      },
      {
        label: '成绩查询',
        href: `/${tenantSlug}/candidate/scores`,
        icon: Trophy,
        description: '查看考试成绩',
      },
    ],
    secondary: [
      {
        label: '通知消息',
        href: `/${tenantSlug}/candidate/notifications`,
        icon: Bell,
      },
      {
        label: '个人中心',
        href: `/${tenantSlug}/candidate/profile`,
        icon: Settings,
      },
    ],
  }
}

/**
 * Get navigation items for EXAMINER role
 */
export function getExaminerNavigation(tenantSlug: string): RoleNavigation {
  return {
    primary: [
      {
        label: '准考证验证',
        href: `/${tenantSlug}/examiner/verify`,
        icon: UserCheck,
        description: '扫码验证准考证',
      },
      {
        label: '签到记录',
        href: `/${tenantSlug}/examiner/attendance`,
        icon: ClipboardList,
        description: '查看考场签到',
      },
    ],
    secondary: [
      {
        label: '考试信息',
        href: `/${tenantSlug}/exams`,
        icon: FileText,
      },
    ],
  }
}

/**
 * Get navigation items based on user's primary role
 */
export function getNavigationForRole(role: string, tenantSlug?: string): RoleNavigation {
  const slug = tenantSlug || 'default'

  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return getSuperAdminNavigation()
    case 'TENANT_ADMIN':
      return getTenantAdminNavigation(slug)
    case 'EXAM_ADMIN':
      return getExamAdminNavigation(slug)
    case 'PRIMARY_REVIEWER':
    case 'SECONDARY_REVIEWER':
      return getReviewerNavigation(slug)
    case 'CANDIDATE':
      return getCandidateNavigation(slug)
    case 'EXAMINER':
      return getExaminerNavigation(slug)
    default:
      return getCandidateNavigation(slug)
  }
}

/**
 * Role labels for display
 */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '超级管理员',
  TENANT_ADMIN: '租户管理员',
  EXAM_ADMIN: '考试管理员',
  PRIMARY_REVIEWER: '一级审核员',
  SECONDARY_REVIEWER: '二级审核员',
  CANDIDATE: '考生',
  EXAMINER: '考官',
}

/**
 * Get display label for a role
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role
}
