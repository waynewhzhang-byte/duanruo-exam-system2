import ReviewsPageClient from './ReviewsPageClient'

interface ReviewsPageProps {
  params: Promise<{
    tenantSlug: string
  }>
}

export default async function ReviewsPage({ params }: ReviewsPageProps) {
  const { tenantSlug } = await params

  return <ReviewsPageClient tenantSlug={tenantSlug} />
}

