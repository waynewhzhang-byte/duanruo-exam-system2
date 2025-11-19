import { apiPost } from './api'
import { LoginRequest, LoginResponse, SelectTenantRequest } from '@/types/auth'

/**
 * 用户登录
 */
export async function login(credentials: LoginRequest) {
  return apiPost<LoginResponse>('/auth/login', credentials)
}

/**
 * 选择租户并获取租户特定Token
 */
export async function selectTenant(request: SelectTenantRequest) {
  return apiPost<LoginResponse>('/auth/select-tenant', request)
}

/**
 * 刷新Token
 */
export async function refreshToken() {
  return apiPost<LoginResponse>('/auth/refresh', {})
}

/**
 * 登出
 */
export async function logout() {
  return apiPost<void>('/auth/logout', {})
}

