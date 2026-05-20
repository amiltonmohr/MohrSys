import { Router, Request, Response, NextFunction } from 'express';
import { ConfigService } from '../services/ConfigService';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import { validate } from '../middleware/validation';
import { configUpdateSchema } from '../utils/validation';
import { sendSuccess } from '../utils/response';

const router = Router();
const configService = new ConfigService();

router.use(authenticate, setTenantContext);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const config = await configService.getActive(tenant_id, userId);
    sendSuccess(res, config, 200, tenant_id);
  } catch (err) { next(err); }
});

router.put('/', requireRole('admin', 'manager'), validate(configUpdateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const config = await configService.update(tenant_id, userId, req.body);
    sendSuccess(res, config, 200, tenant_id);
  } catch (err) { next(err); }
});

router.get('/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const versions = await configService.listVersions(tenant_id, userId);
    sendSuccess(res, versions, 200, tenant_id);
  } catch (err) { next(err); }
});

export default router;
