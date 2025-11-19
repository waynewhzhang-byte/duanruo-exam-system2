/**
 * React hook for centralized error handling
 */

import { useCallback, useState } from 'react'
import { 
  AppError, 
  handleError, 
  createErrorNotification, 
  ErrorNotification,
  getErrorMessage,
  isRecoverableError,
  withRetry,
  RetryOptions
} from '@/lib/error-handling'
import { APIError } from '@/lib/api'

export interface UseErrorHandlerOptions {
  // Whether to show notifications automatically
  showNotifications?: boolean
  // Default retry options
  retryOptions?: Partial<RetryOptions>
  // Custom error handler
  onError?: (error: AppError, notification: ErrorNotification) => void
}

export interface ErrorState {
  error: AppError | null
  isError: boolean
  isRecoverable: boolean
  notification: ErrorNotification | null
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showNotifications = true,
    retryOptions = {},
    onError
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    isRecoverable: false,
    notification: null,
  })

  // Handle error and create notification
  const handleErrorWithNotification = useCallback((error: unknown) => {
    const appError = handleError(error)
    const notification = createErrorNotification(appError)
    const recoverable = isRecoverableError(appError)

    const newErrorState: ErrorState = {
      error: appError,
      isError: true,
      isRecoverable: recoverable,
      notification,
    }

    setErrorState(newErrorState)

    // Call custom error handler if provided
    if (onError) {
      onError(appError, notification)
    }

    // Show notification if enabled
    if (showNotifications) {
      const payload = {
        name: appError.name,
        message: appError.message,
        ...(notification && Object.keys(notification).length > 0 ? { notification } : {}),
      }
      console.error('Error:', payload)
    }

    return appError
  }, [onError, showNotifications])

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      isRecoverable: false,
      notification: null,
    })
  }, [])

  // Execute function with error handling
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    options?: { 
      retry?: boolean
      retryOptions?: Partial<RetryOptions>
      clearPreviousError?: boolean
    }
  ): Promise<T | null> => {
    const {
      retry = false,
      retryOptions: customRetryOptions = {},
      clearPreviousError = true
    } = options || {}

    if (clearPreviousError) {
      clearError()
    }

    try {
      if (retry) {
        return await withRetry(fn, { ...retryOptions, ...customRetryOptions })
      } else {
        return await fn()
      }
    } catch (error) {
      handleErrorWithNotification(error)
      return null
    }
  }, [handleErrorWithNotification, clearError, retryOptions])

  // Get user-friendly error message
  const getErrorMessageSafe = useCallback((error?: unknown): string => {
    if (!error) return ''
    
    try {
      const appError = handleError(error)
      return getErrorMessage(appError)
    } catch {
      return 'An unexpected error occurred'
    }
  }, [])

  // Check if error is specific type
  const isErrorType = useCallback((type: 'api' | 'validation' | 'network' | 'unknown'): boolean => {
    if (!errorState.error) return false

    switch (type) {
      case 'api':
        return errorState.error instanceof APIError
      case 'validation':
        return errorState.error.name === 'ValidationError'
      case 'network':
        return errorState.error.name === 'NetworkError'
      case 'unknown':
        return errorState.error.name === 'UnknownError'
      default:
        return false
    }
  }, [errorState.error])

  // Check if error has specific status code (for API errors)
  const hasStatusCode = useCallback((statusCode: number): boolean => {
    return errorState.error instanceof APIError && errorState.error.status === statusCode
  }, [errorState.error])

  // Get error details for debugging
  const getErrorDetails = useCallback(() => {
    if (!errorState.error) return null

    const details: Record<string, any> = {
      name: errorState.error.name,
      message: errorState.error.message,
    }

    if (errorState.error instanceof APIError) {
      details.status = errorState.error.status
      details.code = errorState.error.code
      details.traceId = errorState.error.traceId
    }

    return details
  }, [errorState.error])

  return {
    // Error state
    ...errorState,
    
    // Error handling functions
    handleError: handleErrorWithNotification,
    clearError,
    executeWithErrorHandling,
    
    // Utility functions
    getErrorMessage: getErrorMessageSafe,
    isErrorType,
    hasStatusCode,
    getErrorDetails,
    
    // Convenience getters
    isUnauthorized: hasStatusCode(401),
    isForbidden: hasStatusCode(403),
    isNotFound: hasStatusCode(404),
    isValidationError: isErrorType('validation'),
    isNetworkError: isErrorType('network'),
    isServerError: errorState.error instanceof APIError && errorState.error.status >= 500,
  }
}

// Hook for form error handling
export function useFormErrorHandler() {
  const errorHandler = useErrorHandler({ showNotifications: false })
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleFormError = useCallback((error: unknown) => {
    const appError = errorHandler.handleError(error)
    
    // If it's a validation error with field-specific errors
    if (appError instanceof APIError && appError.isValidationError) {
      // Try to parse field errors from the error message or response
      // This would depend on your backend's error response format
      const errors: Record<string, string> = {}
      
      // Example: if backend returns field errors in a specific format
      // You might need to adjust this based on your backend's response
      if (appError.message.includes('field')) {
        // Parse field-specific errors
        // This is a simplified example
        errors.general = appError.message
      } else {
        errors.general = appError.message
      }
      
      setFieldErrors(errors)
    } else {
      // Clear field errors for non-validation errors
      setFieldErrors({})
    }
    
    return appError
  }, [errorHandler])

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({})
    errorHandler.clearError()
  }, [errorHandler])

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return fieldErrors[fieldName]
  }, [fieldErrors])

  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!fieldErrors[fieldName]
  }, [fieldErrors])

  return {
    ...errorHandler,
    fieldErrors,
    handleFormError,
    clearFieldErrors,
    getFieldError,
    hasFieldError,
  }
}

// Hook for async operations with loading state
export function useAsyncOperation<T = any>() {
  const errorHandler = useErrorHandler()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      retry?: boolean
      onSuccess?: (data: T) => void
      onError?: (error: AppError) => void
    }
  ): Promise<T | null> => {
    const { retry = false, onSuccess, onError } = options || {}
    
    setIsLoading(true)
    errorHandler.clearError()

    try {
      const result = await errorHandler.executeWithErrorHandling(
        operation,
        { retry, clearPreviousError: false }
      )

      if (result !== null) {
        setData(result)
        onSuccess?.(result)
      } else if (errorHandler.error) {
        onError?.(errorHandler.error)
      }

      return result
    } finally {
      setIsLoading(false)
    }
  }, [errorHandler])

  const reset = useCallback(() => {
    setData(null)
    setIsLoading(false)
    errorHandler.clearError()
  }, [errorHandler])

  return {
    data,
    isLoading,
    execute,
    reset,
    ...errorHandler,
  }
}
