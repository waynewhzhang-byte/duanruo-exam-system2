import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PaymentPage from '../page'
import { useApplication, usePaymentConfig } from '@/lib/api-hooks'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'

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

  const mockApplication = {
    id: 'app-123',
    applicationNumber: 'APP20240001',
    examTitle: '2024年公务员考试',
    positionTitle: '行政管理岗位',
    feeAmount: 100.00,
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
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
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
  })

  it('should render payment page correctly', async () => {
    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('支付报名费用')).toBeDefined()
      expect(screen.getByText('2024年公务员考试')).toBeDefined()
      expect(screen.getByText('行政管理岗位')).toBeDefined()
      expect(screen.getByText('¥100.00')).toBeDefined()
    })
  })

  it('should display payment methods', async () => {
    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('支付宝')).toBeDefined()
      expect(screen.getByText('微信支付')).toBeDefined()
      expect(screen.getByText('模拟支付')).toBeDefined()
    })
  })

  it('should handle mock payment successfully', async () => {
    const mockPaymentResponse = {
      outTradeNo: 'ORDER123',
      payUrl: null,
      qrCode: null,
    }

    vi.mocked(apiPost).mockResolvedValueOnce(mockPaymentResponse)
    vi.mocked(apiPost).mockResolvedValueOnce({ status: 'SUCCESS' })

    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      const payButton = screen.getByText('立即支付')
      fireEvent.click(payButton)
    })

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/payments/initiate', {
        applicationId: 'app-123',
        channel: 'MOCK',
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/test-tenant/candidate/applications/app-123/payment/success')
    })
  })

  it('should redirect if already paid', async () => {
    vi.mocked(useApplication).mockReturnValue({
      data: { ...mockApplication, paymentStatus: 'PAID' },
      isLoading: false,
      error: null,
    } as any)

    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
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

    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
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

    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    // Should show skeleton loaders
    expect(screen.queryByText('支付报名费用')).toBeNull()
  })

  it('should handle payment error', async () => {
    vi.mocked(apiPost).mockRejectedValueOnce(new Error('Payment failed'))

    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      const payButton = screen.getByText('立即支付')
      fireEvent.click(payButton)
    })

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalled()
      // Toast should be called with error message
    })
  })

  it('should allow selecting different payment methods', async () => {
    const params = Promise.resolve({ tenantSlug: 'test-tenant', id: 'app-123' })
    render(<PaymentPage params={params} />)

    await waitFor(() => {
      const alipayRadio = screen.getByLabelText(/支付宝/i)
      fireEvent.click(alipayRadio)
    })

    // Should update selected method
    expect((screen.getByLabelText(/支付宝/i) as HTMLInputElement).checked).toBeTruthy()
  })
})

