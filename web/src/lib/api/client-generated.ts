/**
 * Type-Safe API Client (Auto-generated)
 *
 * This file is auto-generated from the OpenAPI specification.
 * DO NOT EDIT MANUALLY - Changes will be overwritten.
 *
 * Generated: 2025-11-25T01:11:01.749Z
 *
 * To regenerate:
 *   npm run openapi:generate
 *
 * Usage:
 *   import { apiClient } from '@/lib/api/client-generated';
 *
 *   // Type-safe API calls
 *   const { data, error } = await apiClient.GET('/api/v1/exams/{examId}', {
 *     params: { path: { examId: '123' } }
 *   });
 */

import createClient from 'openapi-fetch';
import type { paths } from './generated-types';

// Create the base client
export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
});

// Add authentication interceptor
apiClient.use({
  async onRequest({ request }) {
    // Get token from localStorage (browser) or other storage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Add tenant ID if available
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('tenant_id');
      if (tenantId) {
        request.headers.set('X-Tenant-ID', tenantId);
      }
    }

    return request;
  },

  async onResponse({ response }) {
    // Handle common error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
    }
    return response;
  }
});

// Export types for convenience
export type { paths } from './generated-types';
export type { components } from './generated-types';

/**
 * Helper function to create authenticated API client
 *
 * @param token - JWT token
 * @param tenantId - Optional tenant ID
 */
export function createAuthenticatedClient(token: string, tenantId?: string) {
  const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
  });

  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${token}`);
      if (tenantId) {
        request.headers.set('X-Tenant-ID', tenantId);
      }
      return request;
    }
  });

  return client;
}

/**
 * Type-safe API error handler
 */
export interface ApiError {
  errorCode?: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

/**
 * Helper to extract error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
