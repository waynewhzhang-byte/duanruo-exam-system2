export interface User {
    id: string
    username: string
    email: string
    fullName: string
    phoneNumber?: string
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION' | 'DELETED'
    roles: string[]
    permissions: string[]
    lastLoginAt?: string
    emailVerified: boolean
    phoneVerified: boolean
    department?: string
    jobTitle?: string
    createdAt: string
}

export interface TenantUserResponse {
    user: User
    tenantRoles: string[]
}
