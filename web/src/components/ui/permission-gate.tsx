/**
 * PermissionGate 组件
 * 基于权限条件渲染子组件的通用组件
 */

import React from 'react';
import { z } from 'zod';
import { UserRole } from '@/lib/schemas';

// 定义权限相关的类型
export interface ComponentPermissions {
  hasAnyRole: (roles: z.infer<typeof UserRole>[], instanceId?: string) => boolean;
  hasInstanceAccess: (instanceId: string) => boolean;
  canViewResource: (resourceOwnerId: string, allowedRoles?: z.infer<typeof UserRole>[]) => boolean;
}

export interface PermissionGateProps {
  permissions: ComponentPermissions;
  requireRoles?: z.infer<typeof UserRole>[];
  requireInstanceAccess?: string;
  requireResourceAccess?: {
    resourceOwnerId: string;
    allowedRoles?: z.infer<typeof UserRole>[];
  };
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permissions,
  requireRoles,
  requireInstanceAccess,
  requireResourceAccess,
  fallback = null,
  children,
}: PermissionGateProps): React.ReactElement | null {
  let hasPermission = true;

  // 检查角色权限
  if (requireRoles && requireRoles.length > 0) {
    hasPermission = permissions.hasAnyRole(requireRoles, requireInstanceAccess);
  }

  // 检查实例访问权限
  if (hasPermission && requireInstanceAccess) {
    hasPermission = permissions.hasInstanceAccess(requireInstanceAccess);
  }

  // 检查资源访问权限
  if (hasPermission && requireResourceAccess) {
    hasPermission = permissions.canViewResource(
      requireResourceAccess.resourceOwnerId,
      requireResourceAccess.allowedRoles
    );
  }

  if (!hasPermission) {
    return fallback as React.ReactElement;
  }

  return children as React.ReactElement;
}

/**
 * 使用示例：
 * 
 * ```tsx
 * // 只有系统管理员可以看到的按钮
 * <PermissionGate
 *   permissions={permissions}
 *   requireRoles={[USER_ROLES.SYSTEM_ADMIN]}
 * >
 *   <Button>系统设置</Button>
 * </PermissionGate>
 * 
 * // 实例管理员可以编辑实例
 * <PermissionGate
 *   permissions={permissions}
 *   requireRoles={[USER_ROLES.SYSTEM_ADMIN, USER_ROLES.INSTANCE_ADMIN]}
 *   requireInstanceAccess={instanceId}
 * >
 *   <Button>编辑实例</Button>
 * </PermissionGate>
 * 
 * // 用户只能编辑自己的资源
 * <PermissionGate
 *   permissions={permissions}
 *   requireResourceAccess={{
 *     resourceOwnerId: candidateId,
 *     allowedRoles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.REVIEWER_L1]
 *   }}
 *   fallback={<div>无权限查看</div>}
 * >
 *   <CandidateDetails candidate={candidate} />
 * </PermissionGate>
 * ```
 */