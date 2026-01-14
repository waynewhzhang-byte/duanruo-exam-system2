/**
 * Enhanced API Client with Permission Awareness
 * 
 * This module provides React hooks and utilities for making type-safe API calls
 * with automatic permission checking and error handling.
 * 
 * Features:
 * - Type-safe API calls using OpenAPI-generated types
 * - Automatic JWT token injection
 * - Permission-based request guards
 * - Standardized error handling
 * - React Query integration
 * 
 * @see docs/Phase3_Frontend_API_Client_Summary.md
 */

import { apiClient, type paths, type components } from './api/client-generated';
import { PermissionCodes, type PermissionCode, type UserPermissions, hasPermission } from './permissions-unified';
import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';

// Re-export for convenience
export { apiClient, PermissionCodes };
export type { paths, components, PermissionCode, UserPermissions };

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
    code: string;
    message: string;
    status: number;
    timestamp: string;
    traceId?: string;
}

/**
 * Permission-aware API call options
 */
export interface PermissionAwareOptions {
    /** Required permissions for this API call */
    requiredPermissions?: PermissionCode[];
    /** Require all permissions (default: false - requires any) */
    requireAll?: boolean;
    /** Skip permission check (use with caution) */
    skipPermissionCheck?: boolean;
}

/**
 * Check if user has required permissions for an API call
 */
function checkPermissions(
    user: UserPermissions | null,
    options?: PermissionAwareOptions
): { allowed: boolean; missingPermissions?: PermissionCode[] } {
    // Skip check if explicitly requested
    if (options?.skipPermissionCheck) {
        return { allowed: true };
    }

    // No permissions required
    if (!options?.requiredPermissions || options.requiredPermissions.length === 0) {
        return { allowed: true };
    }

    // No user context
    if (!user) {
        return {
            allowed: false,
            missingPermissions: options.requiredPermissions,
        };
    }

    const requireAll = options.requireAll ?? false;
    const missing: PermissionCode[] = [];

    for (const permission of options.requiredPermissions) {
        const has = hasPermission(user, permission);
        if (!has) {
            missing.push(permission);
            if (!requireAll) {
                // For "any" mode, if we find one missing, we might still have another
                continue;
            } else {
                // For "all" mode, one missing means failure
                return { allowed: false, missingPermissions: missing };
            }
        }
    }

    // For "any" mode, allowed if we have at least one permission
    if (!requireAll) {
        return {
            allowed: missing.length < options.requiredPermissions.length,
            missingPermissions: missing.length === options.requiredPermissions.length ? missing : undefined,
        };
    }

    // For "all" mode, allowed if no missing permissions
    return {
        allowed: missing.length === 0,
        missingPermissions: missing.length > 0 ? missing : undefined,
    };
}

/**
 * Permission error thrown when user lacks required permissions
 */
export class PermissionError extends Error {
    constructor(
        public missingPermissions: PermissionCode[],
        message?: string
    ) {
        super(message || `Missing required permissions: ${missingPermissions.join(', ')}`);
        this.name = 'PermissionError';
    }
}

/**
 * Hook to get current user permissions from context
 * This should be implemented based on your auth context
 */
export function useUserPermissions(): UserPermissions | null {
    // TODO: Implement based on your auth context
    // For now, return null - this should be replaced with actual implementation
    if (typeof window === 'undefined') return null;

    try {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            permissions: payload.permissions || [],
            roles: payload.roles || [],
        };
    } catch (error) {
        console.error('Failed to extract user permissions:', error);
        return null;
    }
}

/**
 * Permission-aware query hook
 * 
 * @example
 * ```tsx
 * const { data, error } = usePermissionQuery(
 *   ['exams'],
 *   () => apiClient.GET('/exams'),
 *   { requiredPermissions: [PermissionCodes.EXAM_VIEW] }
 * );
 * ```
 */
export function usePermissionQuery<TData, TError = ApiErrorResponse>(
    queryKey: unknown[],
    queryFn: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> & PermissionAwareOptions
) {
    const user = useUserPermissions();

    return useQuery<TData, TError>({
        queryKey,
        queryFn: async () => {
            const permCheck = checkPermissions(user, options);
            if (!permCheck.allowed) {
                throw new PermissionError(
                    permCheck.missingPermissions || [],
                    'You do not have permission to perform this action'
                );
            }
            return queryFn();
        },
        ...options,
    });
}

/**
 * Permission-aware mutation hook
 * 
 * @example
 * ```tsx
 * const createExam = usePermissionMutation(
 *   (data) => apiClient.POST('/exams', { body: data }),
 *   { requiredPermissions: [PermissionCodes.EXAM_CREATE] }
 * );
 * ```
 */
export function usePermissionMutation<TData, TVariables, TError = ApiErrorResponse>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & PermissionAwareOptions
) {
    const user = useUserPermissions();

    return useMutation<TData, TError, TVariables>({
        mutationFn: async (variables) => {
            const permCheck = checkPermissions(user, options);
            if (!permCheck.allowed) {
                throw new PermissionError(
                    permCheck.missingPermissions || [],
                    'You do not have permission to perform this action'
                );
            }
            return mutationFn(variables);
        },
        ...options,
    });
}

/**
 * Extract error message from API error response
 */
export function getApiErrorMessage(error: unknown): string {
    if (error instanceof PermissionError) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const apiError = error as Partial<ApiErrorResponse>;
        if (apiError.message) {
            return apiError.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): error is PermissionError {
    return error instanceof PermissionError;
}

/**
 * Check if error is an API error
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'status' in error
    );
}

/**
 * Permission guard component
 * Only renders children if user has required permissions
 * 
 * @example
 * ```tsx
 * <PermissionGuard requiredPermissions={[PermissionCodes.EXAM_CREATE]}>
 *   <Button>Create Exam</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
    children,
    requiredPermissions,
    requireAll = false,
    fallback = null,
}: {
    children: React.ReactNode;
    requiredPermissions: PermissionCode[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
}) {
    const user = useUserPermissions();
    const permCheck = checkPermissions(user, { requiredPermissions, requireAll });

    if (!permCheck.allowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
