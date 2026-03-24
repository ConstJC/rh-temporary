/**
 * API response and error shapes aligned with backend.
 * Success: { data: T } or { data: T[], meta: { page, limit, total } }
 * Error: { error: { code, message, details? } }
 */

export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorDetail {
  property?: string;
  message: string;
  constraints?: Record<string, string>;
}

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  errors?: ErrorDetail[];
}

export function normalizeApiError(err: unknown): ApiError {
  if (err && typeof err === "object" && "response" in err) {
    const ax = err as {
      response?: {
        data?: {
          error?: { code?: string; message?: string; details?: ErrorDetail[] };
        };
        status?: number;
      };
    };
    const status = ax.response?.status ?? 500;
    const body = ax.response?.data?.error;
    return {
      message: body?.message ?? "An error occurred",
      statusCode: status,
      code: body?.code,
      errors: body?.details,
    };
  }
  if (err instanceof Error) {
    return { message: err.message, statusCode: 500 };
  }
  return { message: "An error occurred", statusCode: 500 };
}
