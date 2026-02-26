import { z } from 'zod'

export const UserRole = z.enum(['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CANDIDATE', 'PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'EXAMINER'])
export type UserRole = z.infer<typeof UserRole>

export const TenantRoleInfo = z.object({
  tenantId: z.string().uuid(),
  tenantName: z.string(),
  tenantCode: z.string(),
  role: UserRole,
  active: z.boolean(),
})
export type TenantRoleInfo = z.infer<typeof TenantRoleInfo>

export const LoginRequest = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})
export type LoginRequest = z.infer<typeof LoginRequest>

export const UserWithRoles = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  roles: z.array(UserRole),
  globalRoles: z.array(UserRole).optional(),
  tenantRoles: z.array(TenantRoleInfo).optional(),
  permissions: z.array(z.string()).optional(),
})
export type UserWithRoles = z.infer<typeof UserWithRoles>

export const LoginResponse = z.object({
  token: z.string(),
  user: UserWithRoles,
  tenantRoles: z.array(TenantRoleInfo).optional(),
})
export type LoginResponse = z.infer<typeof LoginResponse>

// Register request
export const RegisterRequest = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8个字符'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})
export type RegisterRequest = z.infer<typeof RegisterRequest>

// Select tenant request
export const SelectTenantRequest = z.object({
  tenantId: z.string().uuid('无效的租户ID'),
})
export type SelectTenantRequest = z.infer<typeof SelectTenantRequest>

export const UserResponse = UserWithRoles.extend({
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
})
export type UserResponse = z.infer<typeof UserResponse>

export interface AuthState {
  isAuthenticated: boolean
  user: UserResponse | null
  token: string | null
  tenantRoles: TenantRoleInfo[]
}

export interface AuthContextType extends AuthState {
  login: (token: string, user: UserResponse, tenantRoles?: TenantRoleInfo[]) => void
  logout: () => void
  refreshSession: () => Promise<void>
}
