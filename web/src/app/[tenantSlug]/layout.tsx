'use client'

import { TenantProvider } from '@/contexts/TenantContext'
import { useParams } from 'next/navigation'

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  return (
    <TenantProvider tenantSlug={tenantSlug}>
      {children}
    </TenantProvider>
  )
}

