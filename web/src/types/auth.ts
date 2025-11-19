import { z } from 'zod'

// User roles
export const UserRole = z.enum(['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CANDIDATE', 'PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'EXAMINER'])
export type UserRole = z.infer<typeof UserRole>

// Login request/response
export const LoginRequest = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

export const LoginResponse = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    roles: z.array(UserRole),
  }),
})

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

// Select tenant request
export const SelectTenantRequest = z.object({
  tenantId: z.string().uuid('无效的租户ID'),
})

export type SelectTenantRequest = z.infer<typeof SelectTenantRequest>

export const UserResponse = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  fullName: z.string(),
  roles: z.array(UserRole),
  createdAt: z.string(),
})

// Session/Auth state
export interface AuthState {
  isAuthenticated: boolean
  user: z.infer<typeof UserResponse> | null
  token: string | null
}

export type LoginRequestType = z.infer<typeof LoginRequest>
export type LoginResponseType = z.infer<typeof LoginResponse>
export type RegisterRequestType = z.infer<typeof RegisterRequest>
export type UserResponseType = z.infer<typeof UserResponse>
