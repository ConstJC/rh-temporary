import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response, Request } from 'express';
import { PaginationMeta } from '../dto/pagination.dto';

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((value) => {
        const message = response.statusCode < 400 ? 'OK' : 'Error';
        this.logger.log(`Endpoint accessed: ${request.method} ${request.originalUrl} - Status: ${response.statusCode} (${message})`);

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
