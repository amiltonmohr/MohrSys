import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginSchema, refreshSchema } from '../utils/validation';
import { sendSuccess } from '../utils/response';

const router = Router();
const authService = new AuthService();

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body, req.ip);
    sendSuccess(res, result, 200);
  } catch (err) { next(err); }
});

router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refresh(req.body.refresh_token);
    sendSuccess(res, result, 200);
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.sub, req.user!.tenant_id);
    sendSuccess(res, user, 200, req.user!.tenant_id);
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, (_req: Request, res: Response) => {
  // Stateless JWT — client should discard tokens
  sendSuccess(res, { message: 'Logged out successfully' });
});

export default router;
