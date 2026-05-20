import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { sendError } from '../utils/response';

export async function setTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }
  try {
    // Validate tenant is active
    const { rows } = await query<{ status: string }>(
      'SELECT status FROM tenants WHERE id = $1',
      [req.user.tenant_id]
    );
    if (!rows[0] || rows[0].status !== 'active') {
      sendError(res, 403, 'TENANT_INACTIVE', 'Your account is suspended or inactive');
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
