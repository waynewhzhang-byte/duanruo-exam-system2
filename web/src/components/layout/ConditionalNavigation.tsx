'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AppNavigation from './AppNavigation';

interface ConditionalNavigationProps {
  user?: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  onSignOut?: () => void;
}

/**
 * 条件渲染全局导航组件
 * 
 * 只在非考试实例页面显示全局导航
 * 考试实例页面有自己的专用UI，不需要全局导航
 */
export default function ConditionalNavigation({ user, onSignOut }: ConditionalNavigationProps) {
  const pathname = usePathname();

  // 检查是否是考试实例相关页面或公开页面
  const isExamInstancePage = pathname.startsWith('/exam/');
  const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  // 检查是否是管理员页面（这些页面有自己的布局和导航）
  // 检查是否是管理员页面（这些页面有自己的布局和导航）
  // 匹配:
  // 1. /super-admin 开头
  // 2. /admin 开头
  // 3. /[slug]/admin 开头或包含 /admin/
  const isAdminPage = pathname.startsWith('/super-admin') ||
    pathname.startsWith('/admin') ||
    /\/admin($|\/)/.test(pathname);

  // 根据是否显示导航动态调整主内容区域的样式
  useEffect(() => {
    const mainElement = document.querySelector('.conditional-main') as HTMLElement;
    if (mainElement) {
      if (user && !isExamInstancePage && !isPublicPage && !isAdminPage) {
        // 显示导航时，主内容区域需要顶部边距
        mainElement.style.paddingTop = '4rem'; // 64px (h-16)
      } else {
        // 不显示导航时，移除顶部边距
        mainElement.style.paddingTop = '0';
      }
    }
  }, [user, isExamInstancePage, isPublicPage, isAdminPage]);

  // 只在有用户且非考试实例页面且非公开页面且非管理员页面时显示全局导航
  if (!user || isExamInstancePage || isPublicPage || isAdminPage) {
    return null;
  }

  return <AppNavigation user={user} onSignOut={onSignOut} />;
}

