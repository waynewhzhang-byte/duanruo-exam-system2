import ReviewPageClient from './ReviewPageClient'

interface ReviewPageProps {
  params: Promise<{
    tenantSlug: string
    applicationId: string
  }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { tenantSlug, applicationId } = await params

  return <ReviewPageClient tenantSlug={tenantSlug} applicationId={applicationId} />
}

