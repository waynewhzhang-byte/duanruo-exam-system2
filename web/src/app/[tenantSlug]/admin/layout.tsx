'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import { useParams } from 'next/navigation'

export default function TenantAdminLayoutWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    const params = useParams()
    const tenantSlug = params.tenantSlug as string

    return <AdminLayout tenantSlug={tenantSlug}>{children}</AdminLayout>
}
