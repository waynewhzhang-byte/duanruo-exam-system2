export type ApiVersion = 'v1' | 'v2';

export interface ApiMetadata {
  version: ApiVersion;
  timestamp: string;
  requestId?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  metadata: ApiMetadata;
}

export interface ApiFailure {
  success: false;
  error: ApiError;
  metadata: ApiMetadata;
}

export type ApiResponse<T = never> = ApiSuccess<T> | ApiFailure;

export interface PaginatedData<T> {
  content: T[];
  pagination: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export type PaginatedApiResponse<T> = ApiSuccess<PaginatedData<T>> | ApiFailure;

export const ApiResponse = {
  success<T>(data: T, message?: string): ApiSuccess<T> {
    return {
      success: true,
      data,
      message,
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
    };
  },

  fail(message: string, code: string, details?: ApiErrorDetail[]): ApiFailure {
    return {
      success: false,
      error: { code, message, details },
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
    };
  },

  paginated<T>(
    items: T[],
    page: number,
    size: number,
    total: number,
  ): PaginatedApiResponse<T> {
    const totalPages = Math.ceil(total / size);
    return {
      success: true,
      data: {
        content: items,
        pagination: {
          page,
          size,
          totalItems: total,
          totalPages,
          hasNext: page < totalPages - 1,
          hasPrevious: page > 0,
        },
      },
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
    };
  },

  validationError(details: ApiErrorDetail[]): ApiFailure {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '请求参数验证失败', details },
      metadata: { version: 'v1', timestamp: new Date().toISOString() },
    };
  },

  unauthorized(message = '未授权访问'): ApiFailure {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message },
      metadata: { version: 'v1', timestamp: new Date().toISOString() },
    };
  },

  forbidden(message = '禁止访问'): ApiFailure {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message },
      metadata: { version: 'v1', timestamp: new Date().toISOString() },
    };
  },

  notFound(resource = '资源'): ApiFailure {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `${resource}不存在` },
      metadata: { version: 'v1', timestamp: new Date().toISOString() },
    };
  },

  serverError(message = '服务器内部错误'): ApiFailure {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
      metadata: { version: 'v1', timestamp: new Date().toISOString() },
    };
  },
};
