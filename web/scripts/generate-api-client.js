#!/usr/bin/env node
/**
 * OpenAPI API Client Generator
 *
 * Generates TypeScript types and a type-safe API client from the OpenAPI specification.
 * Uses openapi-typescript for type generation.
 *
 * Usage:
 *   npm run openapi:generate
 *
 * Prerequisites:
 *   1. Backend must be running (to export latest spec)
 *   2. OpenAPI spec must exist at web/openapi/exam-system-api.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('OpenAPI Type-Safe API Client Generator');
console.log('='.repeat(80));
console.log();

// Paths
const openapiSpecPath = path.join(__dirname, '../openapi/exam-system-api.json');
const outputTypesPath = path.join(__dirname, '../src/lib/api/generated-types.ts');
const outputDir = path.dirname(outputTypesPath);

// Step 1: Verify OpenAPI spec exists
console.log('Step 1: Verifying OpenAPI specification...');
if (!fs.existsSync(openapiSpecPath)) {
  console.error('❌ Error: OpenAPI spec not found at:', openapiSpecPath);
  console.error('');
  console.error('Please run one of the following commands first:');
  console.error('  1. npm run openapi:export (if backend is running)');
  console.error('  2. Ensure backend is started and accessible at http://localhost:8081');
  process.exit(1);
}
console.log('✓ OpenAPI spec found:', openapiSpecPath);

// Check spec size
const specStats = fs.statSync(openapiSpecPath);
console.log(`  Size: ${(specStats.size / 1024).toFixed(1)}KB`);
console.log();

// Step 2: Create output directory if needed
console.log('Step 2: Preparing output directory...');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('✓ Created directory:', outputDir);
} else {
  console.log('✓ Output directory exists:', outputDir);
}
console.log();

// Step 3: Generate TypeScript types
console.log('Step 3: Generating TypeScript types from OpenAPI spec...');
console.log('  Running: npx openapi-typescript');
try {
  execSync(
    `npx openapi-typescript "${openapiSpecPath}" -o "${outputTypesPath}"`,
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    }
  );
  console.log('✓ Types generated successfully');
} catch (error) {
  console.error('❌ Error generating types:', error.message);
  process.exit(1);
}
console.log();

// Step 4: Verify generated file
console.log('Step 4: Verifying generated types...');
if (!fs.existsSync(outputTypesPath)) {
  console.error('❌ Error: Generated types file not found');
  process.exit(1);
}

const generatedStats = fs.statSync(outputTypesPath);
console.log(`✓ Generated file: ${outputTypesPath}`);
console.log(`  Size: ${(generatedStats.size / 1024).toFixed(1)}KB`);
console.log();

// Step 5: Count type definitions
console.log('Step 5: Analyzing generated types...');
const generatedContent = fs.readFileSync(outputTypesPath, 'utf-8');
const pathCount = (generatedContent.match(/paths: \{/g) || []).length;
const schemaCount = (generatedContent.match(/components.*schemas/g) || []).length;
const operationsMatch = generatedContent.match(/operations: \{([^}]+)\}/);

console.log(`✓ Type definitions generated`);
console.log(`  - API paths defined: ${pathCount > 0 ? 'Yes' : 'No'}`);
console.log(`  - Schemas defined: ${schemaCount > 0 ? 'Yes' : 'No'}`);
console.log();

// Step 6: Create API client wrapper
console.log('Step 6: Creating type-safe API client wrapper...');
const clientWrapperPath = path.join(__dirname, '../src/lib/api/client.ts');

// Read existing client to preserve any custom logic
let existingClientContent = '';
if (fs.existsSync(clientWrapperPath)) {
  existingClientContent = fs.readFileSync(clientWrapperPath, 'utf-8');
  console.log('  Note: Existing client.ts found - will create client-generated.ts instead');
}

const generatedClientPath = path.join(__dirname, '../src/lib/api/client-generated.ts');
const generatedClientContent = `/**
 * Type-Safe API Client (Auto-generated)
 *
 * This file is auto-generated from the OpenAPI specification.
 * DO NOT EDIT MANUALLY - Changes will be overwritten.
 *
 * Generated: ${new Date().toISOString()}
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
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1',
});

// Add authentication interceptor
apiClient.use({
  async onRequest({ request }) {
    // Get token from localStorage (browser) or other storage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        request.headers.set('Authorization', \`Bearer \${token}\`);
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
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1',
  });

  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', \`Bearer \${token}\`);
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
`;

fs.writeFileSync(generatedClientPath, generatedClientContent);
console.log(`✓ Generated API client wrapper: ${generatedClientPath}`);
console.log();

// Summary
console.log('='.repeat(80));
console.log('Generation Complete!');
console.log('='.repeat(80));
console.log();
console.log('Generated files:');
console.log(`  1. ${outputTypesPath}`);
console.log(`  2. ${generatedClientPath}`);
console.log();
console.log('Next steps:');
console.log('  1. Import the client in your components:');
console.log('     import { apiClient } from "@/lib/api/client-generated"');
console.log();
console.log('  2. Make type-safe API calls:');
console.log('     const { data, error } = await apiClient.GET("/api/v1/exams")');
console.log();
console.log('  3. Update existing api.ts to use the generated client');
console.log();
console.log('To regenerate (when backend API changes):');
console.log('  npm run openapi:refresh');
console.log();
