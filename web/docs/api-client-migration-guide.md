# API Client Migration Guide

## Overview

This guide helps you migrate from the hand-written API client to the auto-generated type-safe API client.

**Benefits of the new client:**
- ✅ **Type Safety**: TypeScript types generated from OpenAPI spec
- ✅ **Auto-completion**: Full IDE support for all endpoints and parameters
- ✅ **Compile-time Validation**: Catch errors before runtime
- ✅ **Automatic Error Handling**: Consistent error response handling
- ✅ **Less Boilerplate**: No need to manually define types for requests/responses

## Quick Start

### 1. Import the new client

```typescript
// Old way (manual)
import { api } from '@/lib/api';

// New way (generated)
import { apiClient } from '@/lib/api/client-generated';
```

### 2. Make API calls with full type safety

```typescript
// Example: Get exam list
const { data, error } = await apiClient.GET('/api/v1/tenants/{tenantId}/exams', {
  params: {
    path: { tenantId: 'abc123' },
    query: { page: 1, size: 20 }
  }
});

// TypeScript knows the exact shape of 'data' and 'error'
if (error) {
  console.error('Failed to fetch exams:', error.message);
  return;
}

// data is typed correctly - IDE will show all available fields
console.log(data.exams);
```

### 3. POST requests with request body validation

```typescript
// Example: Create a new exam
const { data, error } = await apiClient.POST('/api/v1/tenants/{tenantId}/exams', {
  params: {
    path: { tenantId: 'abc123' }
  },
  body: {
    title: 'Software Engineering Exam 2024',
    description: 'Annual recruitment exam',
    startTime: '2024-06-01 09:00:00',
    endTime: '2024-06-30 17:00:00'
  }
});

// TypeScript will show errors if required fields are missing
// or if field types don't match the OpenAPI schema
```

## Migration Examples

### Example 1: Fetching Data

**Before (manual):**
```typescript
const fetchExams = async (tenantId: string) => {
  try {
    const response = await fetch(`/api/v1/tenants/${tenantId}/exams`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exams');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
```

**After (generated):**
```typescript
const fetchExams = async (tenantId: string) => {
  const { data, error } = await apiClient.GET('/api/v1/tenants/{tenantId}/exams', {
    params: { path: { tenantId } }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Even better with React Query:
const useExams = (tenantId: string) => {
  return useQuery({
    queryKey: ['exams', tenantId],
    queryFn: () => fetchExams(tenantId)
  });
};
```

### Example 2: Creating Resources

**Before (manual):**
```typescript
const createPosition = async (tenantId: string, examId: string, positionData: any) => {
  const response = await fetch(`/api/v1/tenants/${tenantId}/exams/${examId}/positions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    },
    body: JSON.stringify(positionData)
  });

  return response.json();
};
```

**After (generated):**
```typescript
const createPosition = async (
  tenantId: string,
  examId: string,
  positionData: components['schemas']['PositionCreateRequest']
) => {
  const { data, error } = await apiClient.POST(
    '/api/v1/tenants/{tenantId}/exams/{examId}/positions',
    {
      params: {
        path: { tenantId, examId }
      },
      body: positionData
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
```

### Example 3: Using with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { apiClient, type components } from '@/lib/api/client-generated';

type ExamCreateForm = components['schemas']['ExamCreateRequest'];

export function CreateExamForm({ tenantId }: { tenantId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ExamCreateForm>();

  const onSubmit = async (formData: ExamCreateForm) => {
    const { data, error } = await apiClient.POST(
      '/api/v1/tenants/{tenantId}/exams',
      {
        params: { path: { tenantId } },
        body: formData
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    console.log('Exam created:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title', { required: true })} />
      <input {...register('description')} />
      {/* TypeScript will autocomplete all fields from ExamCreateRequest */}
      <button type="submit">Create Exam</button>
    </form>
  );
}
```

## Error Handling

The new client provides consistent error handling:

```typescript
import { isApiError, getErrorMessage } from '@/lib/api/client-generated';

const { data, error } = await apiClient.GET('/api/v1/exams/{examId}', {
  params: { path: { examId: '123' } }
});

if (error) {
  // error has the shape of components['schemas']['ErrorResponse']
  console.error('Error code:', error.errorCode);
  console.error('Message:', error.message);
  console.error('Details:', error.details);
  console.error('Timestamp:', error.timestamp);
}
```

## Authentication

Authentication is handled automatically by the client:

```typescript
// The client automatically adds:
// - Authorization: Bearer <token> (from localStorage)
// - X-Tenant-ID: <tenantId> (from localStorage)

// To manually create an authenticated client:
import { createAuthenticatedClient } from '@/lib/api/client-generated';

const authedClient = createAuthenticatedClient('my-jwt-token', 'tenant-123');
const { data, error } = await authedClient.GET('/api/v1/exams');
```

## Best Practices

### 1. Create API wrapper functions

Instead of calling `apiClient` directly in components, create wrapper functions:

```typescript
// lib/api/exams.ts
import { apiClient, type components } from './client-generated';

export type Exam = components['schemas']['ExamResponse'];
export type ExamCreateRequest = components['schemas']['ExamCreateRequest'];

export const examsApi = {
  list: async (tenantId: string, page = 1, size = 20) => {
    const { data, error } = await apiClient.GET('/api/v1/tenants/{tenantId}/exams', {
      params: { path: { tenantId }, query: { page, size } }
    });

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (tenantId: string, exam: ExamCreateRequest) => {
    const { data, error } = await apiClient.POST('/api/v1/tenants/{tenantId}/exams', {
      params: { path: { tenantId } },
      body: exam
    });

    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (tenantId: string, examId: string) => {
    const { data, error } = await apiClient.GET('/api/v1/tenants/{tenantId}/exams/{examId}', {
      params: { path: { tenantId, examId } }
    });

    if (error) throw new Error(error.message);
    return data;
  }
};
```

Then use in components:

```typescript
import { examsApi } from '@/lib/api/exams';

const exams = await examsApi.list(tenantId);
```

### 2. Use with React Query for caching

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { examsApi } from '@/lib/api/exams';

export function useExams(tenantId: string) {
  return useQuery({
    queryKey: ['exams', tenantId],
    queryFn: () => examsApi.list(tenantId)
  });
}

export function useCreateExam(tenantId: string) {
  return useMutation({
    mutationFn: (exam: ExamCreateRequest) => examsApi.create(tenantId, exam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', tenantId] });
    }
  });
}
```

### 3. Export common types

```typescript
// lib/api/types.ts
export type { paths, components } from './client-generated';

// Common response types
export type ExamResponse = components['schemas']['ExamResponse'];
export type ApplicationResponse = components['schemas']['ApplicationResponse'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

// Common request types
export type ExamCreateRequest = components['schemas']['ExamCreateRequest'];
export type ApplicationCreateRequest = components['schemas']['ApplicationCreateRequest'];
```

## Regenerating Types

When the backend API changes:

```bash
# 1. Ensure backend is running
npm run openapi:export

# 2. Regenerate types
npm run openapi:generate

# Or do both in one command:
npm run openapi:refresh
```

Add this to your development workflow:
- Run `npm run openapi:refresh` after pulling backend changes
- Add to CI/CD pipeline to ensure types are always up-to-date

## Migration Checklist

- [ ] Install dependencies: `npm install`
- [ ] Generate types: `npm run openapi:generate`
- [ ] Create API wrapper functions (e.g., `lib/api/exams.ts`)
- [ ] Migrate one component as a pilot
- [ ] Test the migrated component thoroughly
- [ ] Gradually migrate other components
- [ ] Update existing API client imports
- [ ] Remove old manual API client code
- [ ] Add `npm run openapi:refresh` to development workflow

## Troubleshooting

### Types not updating

```bash
# Force regeneration
rm -rf src/lib/api/generated-types.ts
npm run openapi:generate
```

### TypeScript errors after regeneration

```bash
# Clear TypeScript cache
rm -rf .next
npm run build
```

### Backend API changes not reflected

```bash
# Ensure backend is running, then:
npm run openapi:refresh
```

## Further Reading

- [openapi-typescript documentation](https://openapi-ts.pages.dev/)
- [openapi-fetch documentation](https://openapi-ts.pages.dev/openapi-fetch/)
- [TanStack Query integration](https://tanstack.com/query/latest)
