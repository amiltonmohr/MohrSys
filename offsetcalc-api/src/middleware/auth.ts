import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    return;
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, 401, 'TOKEN_EXPIRED', 'Access token expired or invalid');
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      return;
    }
    next();
  };
}
