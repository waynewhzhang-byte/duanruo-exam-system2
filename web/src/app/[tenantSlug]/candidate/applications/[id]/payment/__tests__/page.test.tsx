import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PaymentPage from '../page'
import { useApplication, usePaymentConfig, useInitiatePayment } from '@/lib/api-hooks'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'

/** React 19-style fulfilled thenable — `use(params)` needs this when Vitest uses npm `react@18` (no real `use`). */
function fulfilledParams<T extends Record<string, string>>(value: T): Promise<T> {
  return { status: 'fulfilled' as const, value: value } as unknown as Promise<T>
}

vi.mock('react', async (importOriginal) => {
  const React = await importOriginal<typeof import('react')>()
  return {
    ...React,
    use: function use<T>(
      thenable: Promise<T> | { status: 'fulfilled'; value: T },
    ): T {
      if (
        thenable !== null &&
        typeof thenable === 'object' &&
        'status' in thenable &&
        (thenable as { status: string }).status === 'fulfilled'
      ) {
        return (thenable as { value: T }).value
      }
      throw new Error(
        'PaymentPage tests: pass fulfilledParams({ ... }) for the params Promise',
      )
    },
  }
})

// Mock dependencies
vi.mock('@/lib/api-hooks')
vi.mock('next/navigation')
vi.mock('@/lib/api')
vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { id: 'test-tenant', name: 'Test Tenant' } })
}))
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}))

describe('PaymentPage', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
  }

  const mutateAsync = vi.fn()

  const mockApplication = {
    id: 'app-123',
    applicationNumber: 'APP20240001',
    examTitle: '2024年公务员考试',
    positionTitle: '行政管理岗位',
    feeAmount: 100,
    status: 'PENDING' as const,
    paymentStatus: 'PENDING',
    reviewStatus: 'APPROVED',
  }

  const mockPaymentConfig = {
    currency: 'CNY',
    stubOnly: false,
    channels: {
      alipayEnabled: true,
      wechatEnabled: true,
      qrcodeEnabled: true,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mutateAsync.mockResolvedValue({
      outTradeNo: 'ORDER123',
      payUrl: null,
      qrCode: null,
    })
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useInitiatePayment).mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    } as any)
    vi.mocked(useApplication).mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
    } as any)
    vi.mocked(usePaymentConfig).mockReturnValue({
      data: mockPaymentConfig,
      isLoading: false,
      error: null,
    } as any)
    vi.mocked(apiPost).mockImplementation(async (path: string) => {
      if (path === '/payments/callback') {
        return { status: 'SUCCESS' }
      }
      return {}
    })
  })

  it('should render payment page correctly', async () => {
    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('支付报名费用')).toBeDefined()
      expect(screen.getByText('2024年公务员考试')).toBeDefined()
      expect(screen.getByText('行政管理岗位')).toBeDefined()
      expect(screen.getByText('¥100.00')).toBeDefined()
    })
  })

  it('should display payment methods', async () => {
    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('支付宝')).toBeDefined()
      expect(screen.getByText('微信支付')).toBeDefined()
      expect(screen.getByText('模拟支付')).toBeDefined()
    })
  })

  it('should handle mock payment successfully', async () => {
    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    const mockRadio = await screen.findByRole('radio', { name: /模拟支付/i })
    fireEvent.click(mockRadio)

    await waitFor(() => {
      const payButton = screen.getByText('立即支付')
      fireEvent.click(payButton)
    })

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ applicationId: 'app-123' })
    })
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        '/payments/callback',
        expect.objectContaining({
          outTradeNo: 'ORDER123',
          status: 'SUCCESS',
        }),
      )
    })
    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/test-tenant/candidate/applications/app-123/payment/success',
        )
      },
      { timeout: 3000 },
    )
  })

  it('should redirect if already paid', async () => {
    vi.mocked(useApplication).mockReturnValue({
      data: { ...mockApplication, status: 'PAID' as const },
      isLoading: false,
      error: null,
    } as any)

    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/test-tenant/candidate/applications/app-123/payment/success')
    })
  })

  it('should redirect if review not approved', async () => {
    vi.mocked(useApplication).mockReturnValue({
      data: { ...mockApplication, reviewStatus: 'PENDING' },
      isLoading: false,
      error: null,
    } as any)

    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/test-tenant/candidate/applications/app-123')
    })
  })

  it('should show loading state', async () => {
    vi.mocked(useApplication).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any)

    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    // Should show skeleton loaders
    expect(screen.queryByText('支付报名费用')).toBeNull()
  })

  it('should handle payment error', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('Payment failed'))

    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      const payButton = screen.getByText('立即支付')
      fireEvent.click(payButton)
    })

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ applicationId: 'app-123' })
    })
  })

  it('should allow selecting different payment methods', async () => {
    const params = fulfilledParams({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    const alipayRadio = await screen.findByRole('radio', { name: /支付宝/i })
    fireEvent.click(alipayRadio)

    expect(alipayRadio).toHaveAttribute('aria-checked', 'true')
  })
})

