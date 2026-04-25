import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

function deepConvertBigInt(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(deepConvertBigInt);
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deepConvertBigInt(val);
    }
    return result;
  }
  return value;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown): ApiResponse<T> => {
        const converted = deepConvertBigInt(data);

        if (
          converted !== null &&
          typeof converted === 'object' &&
          'success' in (converted as Record<string, unknown>) &&
          'data' in (converted as Record<string, unknown>)
        ) {
          return converted as ApiResponse<T>;
        }
        return {
          success: true as const,
          data: converted as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
