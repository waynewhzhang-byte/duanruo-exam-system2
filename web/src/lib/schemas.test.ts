import { describe, expect, it } from 'vitest'
import { parseTenantListResponse } from './schemas'

describe('parseTenantListResponse', () => {
  it('normalizes nest pagination payload with non-string datetime fields', () => {
    const payload = {
      content: [
        {
          id: '3f3d8be1-8867-4926-a8a4-3576c2e5f214',
          name: 'Tenant A',
          code: 'tenant-a',
          status: 'ACTIVE',
          contactEmail: 'ops@example.com',
          contactPhone: null,
          description: null,
          createdAt: {},
          updatedAt: {},
          activatedAt: null,
          deactivatedAt: null,
        },
      ],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      },
    }

    const result = parseTenantListResponse(payload)

    expect(result.totalElements).toBe(1)
    expect(result.content).toHaveLength(1)
    expect(result.content[0].id).toBe('3f3d8be1-8867-4926-a8a4-3576c2e5f214')
    expect(result.content[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.content[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('normalizes spring pagination payload and keeps canonical fields', () => {
    const payload = {
      content: [
        {
          id: 'b2b65945-bf9f-4ef6-9bb8-2f9434f3cf0e',
          name: 'Tenant B',
          code: 'tenant-b',
          status: 'INACTIVE',
          contactEmail: 'admin@example.com',
          contactPhone: '18800001111',
          description: 'desc',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          activatedAt: null,
          deactivatedAt: null,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    }

    const result = parseTenantListResponse(payload)

    expect(result.number).toBe(0)
    expect(result.size).toBe(10)
    expect(result.content[0].code).toBe('tenant-b')
    expect(result.content[0].status).toBe('INACTIVE')
    expect(result.content[0].createdAt).toBe('2026-01-01T00:00:00.000Z')
  })
})
