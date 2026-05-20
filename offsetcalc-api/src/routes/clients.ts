import { Router, Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/ClientService';
import { authenticate } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import { validate } from '../middleware/validation';
import { clientSchema } from '../utils/validation';
import { sendSuccess } from '../utils/response';

const router = Router();
const clientService = new ClientService();

router.use(authenticate, setTenantContext);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const { page, limit, search } = req.query as Record<string, string>;
    const result = await clientService.list(tenant_id, userId, {
      page: parseInt(page || '1'), limit: parseInt(limit || '20'), search,
    });
    sendSuccess(res, result, 200, tenant_id);
  } catch (err) { next(err); }
});

router.post('/', validate(clientSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const client = await clientService.create(tenant_id, userId, req.body);
    sendSuccess(res, client, 201, tenant_id);
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const client = await clientService.findById(tenant_id, userId, req.params.id);
    sendSuccess(res, client, 200, tenant_id);
  } catch (err) { next(err); }
});

router.put('/:id', validate(clientSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const client = await clientService.update(tenant_id, userId, req.params.id, req.body);
    sendSuccess(res, client, 200, tenant_id);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    await clientService.archive(tenant_id, userId, req.params.id);
    sendSuccess(res, { message: 'Client removed' }, 200, tenant_id);
  } catch (err) { next(err); }
});

export default router;
