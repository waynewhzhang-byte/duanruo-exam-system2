import { z } from 'zod'

// Tenant schema - matches backend TenantResponse
export const Tenant = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
  slug: z.string().optional(),
  schemaName: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED']),
  contactEmail: z.string().optional(),
  contactPhone: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activatedAt: z.string().nullable().optional(),
  deactivatedAt: z.string().nullable().optional(),
})

export type TenantType = z.infer<typeof Tenant>

// Tenant list response
export const TenantListResponse = z.object({
  content: z.array(Tenant),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(),
})

export type TenantListResponseType = z.infer<typeof TenantListResponse>

// Tenant context type
export interface TenantContextType {
  tenant: TenantType | null
  tenantSlug: string | null
  isLoading: boolean
  error: Error | null
  setTenant: (tenant: TenantType | null) => void
}

