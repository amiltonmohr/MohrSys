import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error & { code?: string; status?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    process.env.NODE_ENV === 'production' ? 'An internal error occurred' : err.message;

  sendError(res, status, code, message);
}
