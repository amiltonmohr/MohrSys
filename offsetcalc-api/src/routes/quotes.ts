import { Router, Request, Response, NextFunction } from 'express';
import { QuoteService, calculateQuote } from '../services/QuoteService';
import { ConfigService } from '../services/ConfigService';
import { authenticate } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import { validate } from '../middleware/validation';
import { quoteInputSchema } from '../utils/validation';
import { sendSuccess } from '../utils/response';

const router = Router();
const quoteService = new QuoteService();
const configService = new ConfigService();

router.use(authenticate, setTenantContext);

// POST /quotes — calculate & save
router.post('/', validate(quoteInputSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const config = await configService.getActive(tenant_id, userId);
    const quote = await quoteService.create(tenant_id, userId, req.body, config);
    sendSuccess(res, quote, 201, tenant_id);
  } catch (err) { next(err); }
});

// POST /quotes/calculate — just calculate, don't persist
router.post('/calculate', validate(quoteInputSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const config = await configService.getActive(tenant_id, userId);
    const result = calculateQuote(req.body, config);
    sendSuccess(res, result, 200, tenant_id);
  } catch (err) { next(err); }
});

// GET /quotes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const { page, limit, status, search } = req.query as Record<string, string>;
    const result = await quoteService.list(tenant_id, userId, {
      page: parseInt(page || '1'), limit: parseInt(limit || '20'), status, search,
    });
    sendSuccess(res, result, 200, tenant_id);
  } catch (err) { next(err); }
});

// GET /quotes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const quote = await quoteService.findById(tenant_id, userId, req.params.id);
    sendSuccess(res, quote, 200, tenant_id);
  } catch (err) { next(err); }
});

// PUT /quotes/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    const quote = await quoteService.update(tenant_id, userId, req.params.id, req.body);
    sendSuccess(res, quote, 200, tenant_id);
  } catch (err) { next(err); }
});

// DELETE /quotes/:id — archive
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenant_id, sub: userId } = req.user!;
    await quoteService.archive(tenant_id, userId, req.params.id);
    sendSuccess(res, { message: 'Quote archived' }, 200, tenant_id);
  } catch (err) { next(err); }
});

export default router;
