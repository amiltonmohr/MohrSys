import { Response } from 'express';
import { ApiResponse, ApiError } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  tenantId?: string
): void {
  const body: ApiResponse<T> = {
    status: 'success',
    data,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: (res.req as { requestId?: string }).requestId || uuidv4(),
      tenant_id: tenantId,
    },
    error: null,
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const body: ApiResponse<null> = {
    status: 'error',
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: (res.req as { requestId?: string }).requestId || uuidv4(),
    },
    error: { code, message, details } as ApiError,
  };
  res.status(statusCode).json(body);
}
