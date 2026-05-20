import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import quotesRouter from './routes/quotes';
import configRouter from './routes/config';
import clientsRouter from './routes/clients';
import healthRouter from './routes/health';

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Request ID ───────────────────────────────────────────────
app.use((req, _res, next) => {
  (req as { requestId?: string }).requestId = uuidv4();
  next();
});

// ── Request logging ──────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP', {
      method: req.method, path: req.path, status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
});

// ── Routes ───────────────────────────────────────────────────
const API_VERSION = process.env.API_VERSION || 'v1';
app.use('/health', healthRouter);
app.use(`/api/${API_VERSION}/auth`, authRouter);
app.use(`/api/${API_VERSION}/quotes`, quotesRouter);
app.use(`/api/${API_VERSION}/config`, configRouter);
app.use(`/api/${API_VERSION}/clients`, clientsRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: 'error', error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// ── Error handler ────────────────────────────────────────────
app.use(errorHandler);

export default app;
