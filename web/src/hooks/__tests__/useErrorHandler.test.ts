import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useErrorHandler, useFormErrorHandler, useAsyncOperation } from '../useErrorHandler'

vi.mock('@/lib/error-handling', () => ({
  handleError: vi.fn((error) => {
    if (error instanceof Error) return error
    return new Error(String(error))
  }),
  createErrorNotification: vi.fn((error) => ({
    title: 'Error',
    message: error.message,
    type: 'error',
  })),
  getErrorMessage: vi.fn((error) => error.message),
  isRecoverableError: vi.fn(() => false),
  withRetry: vi.fn((fn) => fn()),
}))

vi.mock('@/lib/api', () => ({
  APIError: class APIError extends Error {
    status: number
    code?: string
    traceId?: string

    constructor(message: string, status: number) {
      super(message)
      this.name = 'APIError'
      this.status = status
    }

    get isValidationError() {
      return this.status === 422
    }
  },
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should initialize with no error state', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.isError).toBe(false)
    expect(result.current.isRecoverable).toBe(false)
    expect(result.current.notification).toBeNull()
  })

  it('should handle error and update state', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test error'))
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Test error')
  })

  it('should clear error state', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test error'))
    })

    expect(result.current.isError).toBe(true)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should call custom onError handler', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useErrorHandler({ onError }))

    act(() => {
      result.current.handleError(new Error('Test error'))
    })

    expect(onError).toHaveBeenCalled()
  })

  it('should execute async function with error handling', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const successFn = vi.fn().mockResolvedValue('success')
    let data: string | null = null

    await act(async () => {
      data = await result.current.executeWithErrorHandling(successFn)
    })

    expect(data).toBe('success')
    expect(result.current.isError).toBe(false)
  })

  it('should handle async function errors', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const failFn = vi.fn().mockRejectedValue(new Error('Async error'))
    let data: string | null = null

    await act(async () => {
      data = await result.current.executeWithErrorHandling(failFn)
    })

    expect(data).toBeNull()
    expect(result.current.isError).toBe(true)
  })

  it('should check error type correctly', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('Network error'))
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.isErrorType('api')).toBe(false)
  })

  it('should get error message safely', () => {
    const { result } = renderHook(() => useErrorHandler())

    const message = result.current.getErrorMessage(new Error('Test message'))
    expect(message).toBe('Test message')
  })

  it('should return empty string for null error', () => {
    const { result } = renderHook(() => useErrorHandler())

    const message = result.current.getErrorMessage(null)
    expect(message).toBe('')
  })
})

describe('useFormErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should initialize with empty field errors', () => {
    const { result } = renderHook(() => useFormErrorHandler())

    expect(result.current.fieldErrors).toEqual({})
  })

  it('should clear field errors', () => {
    const { result } = renderHook(() => useFormErrorHandler())

    act(() => {
      result.current.handleFormError(new Error('Test'))
    })

    act(() => {
      result.current.clearFieldErrors()
    })

    expect(result.current.fieldErrors).toEqual({})
  })

  it('should check if field has error', () => {
    const { result } = renderHook(() => useFormErrorHandler())

    expect(result.current.hasFieldError('email')).toBe(false)
  })

  it('should get field error', () => {
    const { result } = renderHook(() => useFormErrorHandler())

    expect(result.current.getFieldError('email')).toBeUndefined()
  })
})

describe('useAsyncOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should initialize with no data and not loading', () => {
    const { result } = renderHook(() => useAsyncOperation())

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should execute operation and update data', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>())

    const operation = vi.fn().mockResolvedValue('result')

    await act(async () => {
      await result.current.execute(operation)
    })

    expect(result.current.data).toBe('result')
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle loading state', async () => {
    const { result } = renderHook(() => useAsyncOperation())

    const operation = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('done'), 100))
    )

    act(() => {
      result.current.execute(operation)
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should call onSuccess callback', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>())
    const onSuccess = vi.fn()

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.execute(operation, { onSuccess })
    })

    expect(onSuccess).toHaveBeenCalledWith('success')
  })

  it('should handle operation failure', async () => {
    const { result } = renderHook(() => useAsyncOperation())

    const operation = vi.fn().mockRejectedValue(new Error('Failed'))

    await act(async () => {
      await result.current.execute(operation)
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.isError).toBe(true)
  })

  it('should reset state', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>())

    const operation = vi.fn().mockResolvedValue('data')

    await act(async () => {
      await result.current.execute(operation)
    })

    expect(result.current.data).toBe('data')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})
