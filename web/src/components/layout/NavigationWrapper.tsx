'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ConditionalNavigation from './ConditionalNavigation';

/**
 * 导航包装组件
 * 连接AuthContext和ConditionalNavigation
 */
export default function NavigationWrapper() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  // 转换用户数据格式以匹配ConditionalNavigation的props
  const navigationUser = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles || [],
  } : undefined;

  return (
    <ConditionalNavigation 
      user={navigationUser} 
      onSignOut={handleSignOut} 
    />
  );
}

