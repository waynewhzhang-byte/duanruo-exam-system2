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
        // 防止双重包装：如果数据已经是 ApiResult 格式（包含 success 和 data 字段），则直接返回
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return data as ApiResponse<T>;
        }
        return {
          success: true as const,
          data: data as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
