import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorDetail {
  property?: string;
  message: string;
  constraints?: Record<string, string>;
}

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

function getCodeFromStatus(status: number): string {
  const map: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
    [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
    [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
    [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
    [HttpStatus.CONFLICT]: 'CONFLICT',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
    [HttpStatus.PAYMENT_REQUIRED]: 'PAYMENT_REQUIRED',
    [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  };
  return map[status] ?? 'ERROR';
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let details: ErrorDetail[] | undefined;
    let code = getCodeFromStatus(status);

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const body = exceptionResponse as Record<string, unknown>;
      message = (body.message as string) ?? exception.message;
      if (Array.isArray(body.message)) {
        details = (body.message as string[]).map((m) => ({ message: m }));
        code = 'VALIDATION_ERROR';
      } else if (body.details && Array.isArray(body.details)) {
        details = body.details as ErrorDetail[];
        code = 'VALIDATION_ERROR';
      } else if (
        typeof body.message === 'string' &&
        status === HttpStatus.BAD_REQUEST
      ) {
        code = 'VALIDATION_ERROR';
      }
    } else {
      message = exception.message || 'An error occurred';
    }

    const errorResponse: StandardErrorResponse = {
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
    };

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse: StandardErrorResponse = {
      error: {
        code: getCodeFromStatus(status),
        message,
      },
    };

    response.status(status).json(errorResponse);
  }
}
