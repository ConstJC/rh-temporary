import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { PaginationMeta } from '../dto/pagination.dto';

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((value) => {
        // If already wrapped (e.g. controller returned { data, meta }), pass through
        if (value && typeof value === 'object' && 'data' in value && Object.keys(value).length <= 2) {
          return value as ApiResponse<T>;
        }
        // 204 No Content: some endpoints return nothing
        if (response.statusCode === 204) {
          return value;
        }
        return { data: value };
      }),
    );
  }
}
