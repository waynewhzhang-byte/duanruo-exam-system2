/**
 * Permission System - Unified with Backend
 * 
 * This file provides permission checking utilities that align with the backend's
 * unified permission model. It uses permission codes (e.g., "exam:create") instead
 * of enum names (e.g., "EXAM_CREATE") to match the JWT token format.
 * 
 * @see docs/Phase1_Unified_Permission_Model_Summary.md
 */

// Permission codes matching backend Permission enum
// Format: {resource}:{action}[:{scope}]
export const PermissionCodes = {
    // Tenant Management
    TENANT_CREATE: 'tenant:create',
    TENANT_VIEW: 'tenant:view',
    TENANT_EDIT: 'tenant:edit',
    TENANT_DELETE: 'tenant:delete',
    TENANT_UPDATE: 'tenant:update',
    TENANT_VIEW_ALL: 'tenant:view:all',
    TENANT_ACTIVATE: 'tenant:activate',
    TENANT_DEACTIVATE: 'tenant:deactivate',
    TENANT_USER_MANAGE: 'tenant:user_manage',

    // Tenant Backup
    TENANT_BACKUP_CREATE: 'tenant:backup:create',
    TENANT_BACKUP_LIST: 'tenant:backup:list',
    TENANT_BACKUP_DOWNLOAD: 'tenant:backup:download',
    TENANT_BACKUP_RESTORE: 'tenant:backup:restore',
    TENANT_BACKUP_DELETE: 'tenant:backup:delete',
    TENANT_BACKUP_VERIFY: 'tenant:backup:verify',
    TENANT_BACKUP_CLEANUP: 'tenant:backup:cleanup',
    TENANT_BACKUP_SCHEDULE: 'tenant:backup:schedule',

    // User Management
    USER_CREATE: 'user:create',
    USER_VIEW: 'user:view',
    USER_EDIT: 'user:edit',
    USER_DELETE: 'user:delete',
    USER_MANAGE: 'user:manage',
    USER_CREATE_TENANT: 'user:create:tenant',
    USER_TENANT_ROLE_GRANT: 'user:tenant:role:grant',
    USER_ASSIGN_ROLE: 'user:assign_role',

    // Exam Management
    EXAM_CREATE: 'exam:create',
    EXAM_VIEW: 'exam:view',
    EXAM_EDIT: 'exam:edit',
    EXAM_DELETE: 'exam:delete',
    EXAM_PUBLISH: 'exam:publish',
    EXAM_ARCHIVE: 'exam:archive',
    EXAM_OPEN: 'exam:open',
    EXAM_CLOSE: 'exam:close',
    EXAM_START: 'exam:start',
    EXAM_COMPLETE: 'exam:complete',
    EXAM_FORM_CONFIG: 'exam:form_config',
    EXAM_VENUE_MANAGE: 'exam:venue_manage',
    EXAM_SCHEDULE_MANAGE: 'exam:schedule_manage',
    EXAM_ADMIN_MANAGE: 'exam:admin:manage',
    EXAM_VIEW_PUBLIC: 'exam:view:public',

    // Position Management
    POSITION_CREATE: 'position:create',
    POSITION_VIEW: 'position:view',
    POSITION_EDIT: 'position:edit',
    POSITION_DELETE: 'position:delete',
    POSITION_FORM_CONFIG: 'position:form_config',

    // Subject Management
    SUBJECT_CREATE: 'subject:create',
    SUBJECT_VIEW: 'subject:view',
    SUBJECT_EDIT: 'subject:edit',
    SUBJECT_DELETE: 'subject:delete',

    // Application Management
    APPLICATION_CREATE: 'application:create',
    APPLICATION_VIEW_OWN: 'application:view:own',
    APPLICATION_VIEW_ALL: 'application:view:all',
    APPLICATION_VIEW_ASSIGNED: 'application:view:assigned',
    APPLICATION_VIEW_BASIC: 'application:view:basic',
    APPLICATION_EDIT: 'application:edit',
    APPLICATION_DELETE: 'application:delete',
    APPLICATION_UPDATE_OWN: 'application:update:own',
    APPLICATION_DELETE_OWN: 'application:delete:own',
    APPLICATION_BULK_OPERATION: 'application:bulk_operation',
    APPLICATION_APPROVE: 'application:approve',
    APPLICATION_REJECT: 'application:reject',
    APPLICATION_WITHDRAW: 'application:withdraw',
    APPLICATION_PAY: 'application:pay',

    // Review Management
    REVIEW_ASSIGN: 'review:assign',
    REVIEW_VIEW: 'review:view',
    REVIEW_PERFORM: 'review:perform',
    REVIEW_PRIMARY: 'review:primary',
    REVIEW_SECONDARY: 'review:secondary',
    REVIEW_STATISTICS: 'review:statistics',
    REVIEW_BATCH: 'review:batch',

    // Ticket Management
    TICKET_GENERATE: 'ticket:generate',
    TICKET_VIEW_OWN: 'ticket:view:own',
    TICKET_VIEW_ALL: 'ticket:view:all',
    TICKET_VIEW: 'ticket:view',
    TICKET_PRINT: 'ticket:print',
    TICKET_BATCH_GENERATE: 'ticket:batch_generate',
    TICKET_VALIDATE: 'ticket:validate',
    TICKET_VERIFY: 'ticket:verify',
    TICKET_DOWNLOAD: 'ticket:download',
    TICKET_ISSUE: 'ticket:issue',
    TICKET_TEMPLATE_VIEW: 'ticket:template:view',
    TICKET_TEMPLATE_UPDATE: 'ticket:template:update',
    TICKET_TEMPLATE_DELETE: 'ticket:template:delete',

    // Score Management
    SCORE_INPUT: 'score:input',
    SCORE_VIEW_OWN: 'score:view:own',
    SCORE_VIEW_ALL: 'score:view:all',
    SCORE_VIEW: 'score:view',
    SCORE_PUBLISH: 'score:publish',
    SCORE_RECORD: 'score:record',
    SCORE_UPDATE: 'score:update',
    SCORE_DELETE: 'score:delete',
    SCORE_STATISTICS: 'score:statistics',
    SCORE_BATCH_IMPORT: 'score:batch_import',

    // File Management
    FILE_UPLOAD: 'file:upload',
    FILE_VIEW_OWN: 'file:view:own',
    FILE_VIEW: 'file:view',
    FILE_DELETE: 'file:delete',
    FILE_SCAN: 'file:scan',

    // Venue & Seat Management
    VENUE_CREATE: 'venue:create',
    VENUE_UPDATE: 'venue:update',
    VENUE_DELETE: 'venue:delete',
    VENUE_VIEW: 'venue:view',
    VENUE_LIST: 'venue:list',
    SEAT_ALLOCATE: 'seat:allocate',
    SEAT_VIEW: 'seat:view',
    SEAT_UPDATE: 'seat:update',
    SEATING_ALLOCATE: 'seating:allocate',

    // Interview Management
    INTERVIEW_SCHEDULE: 'interview:schedule',
    INTERVIEW_CONDUCT: 'interview:conduct',
    INTERVIEW_RESULT: 'interview:result',

    // Notification & Template
    NOTIFICATION_SEND: 'notification:send',
    NOTIFICATION_VIEW: 'notification:view',
    NOTIFICATION_HISTORY_VIEW: 'notification:history:view',
    TEMPLATE_CREATE: 'template:create',
    TEMPLATE_VIEW: 'template:view',
    TEMPLATE_UPDATE: 'template:update',
    TEMPLATE_DELETE: 'template:delete',

    // Report
    REPORT_VIEW: 'report:view',
    REPORT_EXPORT: 'report:export',

    // Payment
    PAYMENT_CREATE: 'payment:create',
    PAYMENT_VIEW: 'payment:view',
    PAYMENT_INITIATE: 'payment:initiate',
    PAYMENT_CONFIG_VIEW: 'payment:config:view',

    // Statistics
    STATISTICS_VIEW: 'statistics:view',
    STATISTICS_TENANT_VIEW: 'statistics:tenant:view',
    STATISTICS_SYSTEM_VIEW: 'statistics:system:view',

    // System
    SYSTEM_MONITOR: 'system:monitor',
    SYSTEM_CONFIG: 'system:config',
    ROLE_MANAGE: 'role:manage',
    PERMISSION_ASSIGN: 'permission:assign',

    // Audit
    AUDIT_VIEW: 'audit:view',
    AUDIT_EXPORT: 'audit:export',

    // PII Compliance
    PII_EXPORT: 'pii:export',
    PII_ANONYMIZE: 'pii:anonymize',
    PII_DELETE: 'pii:delete',
    PII_AUDIT: 'pii:audit',
    PII_POLICY_VIEW: 'pii:policy:view',
} as const;

export type PermissionCode = typeof PermissionCodes[keyof typeof PermissionCodes];

/**
 * User context with permissions from JWT token
 */
export interface UserPermissions {
    permissions: string[];
    roles: string[];
}

/**
 * Check if user has a specific permission
 * @param user - User context with permissions
 * @param permission - Permission code to check
 * @returns true if user has the permission
 */
export function hasPermission(user: UserPermissions | null, permission: PermissionCode): boolean {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param user - User context with permissions
 * @param permissions - Array of permission codes
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(user: UserPermissions | null, permissions: PermissionCode[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 * @param user - User context with permissions
 * @param permissions - Array of permission codes
 * @returns true if user has all permissions
 */
export function hasAllPermissions(user: UserPermissions | null, permissions: PermissionCode[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
}

/**
 * Check if user has a specific role
 * @param user - User context with roles
 * @param role - Role name to check
 * @returns true if user has the role
 */
export function hasRole(user: UserPermissions | null, role: string): boolean {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * @param user - User context with roles
 * @param roles - Array of role names
 * @returns true if user has at least one role
 */
export function hasAnyRole(user: UserPermissions | null, roles: string[]): boolean {
    if (!user || !user.roles) return false;
    return roles.some(role => user.roles.includes(role));
}

/**
 * Extract permissions from JWT token
 * @param token - JWT token string
 * @returns User permissions or null if invalid
 */
export function extractPermissionsFromToken(token: string): UserPermissions | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            permissions: payload.permissions || [],
            roles: payload.roles || [],
        };
    } catch (error) {
        console.error('Failed to extract permissions from token:', error);
        return null;
    }
}

/**
 * Permission guard for UI components
 * Returns true if user has required permissions, false otherwise
 * 
 * @example
 * ```tsx
 * {canAccess(user, [PermissionCodes.EXAM_CREATE]) && (
 *   <Button>Create Exam</Button>
 * )}
 * ```
 */
export function canAccess(
    user: UserPermissions | null,
    requiredPermissions: PermissionCode[],
    requireAll: boolean = false
): boolean {
    if (!user) return false;

    if (requireAll) {
        return hasAllPermissions(user, requiredPermissions);
    } else {
        return hasAnyPermission(user, requiredPermissions);
    }
}

/**
 * Get user's highest priority role
 * Priority: SUPER_ADMIN > TENANT_ADMIN > EXAM_ADMIN > REVIEWER > EXAMINER > CANDIDATE
 */
export function getPrimaryRole(user: UserPermissions | null): string | null {
    if (!user || !user.roles || user.roles.length === 0) return null;

    const rolePriority = [
        'SUPER_ADMIN',
        'TENANT_ADMIN',
        'EXAM_ADMIN',
        'SECONDARY_REVIEWER',
        'PRIMARY_REVIEWER',
        'EXAMINER',
        'CANDIDATE',
    ];

    for (const role of rolePriority) {
        if (user.roles.includes(role)) {
            return role;
        }
    }

    return user.roles[0] || null;
}
