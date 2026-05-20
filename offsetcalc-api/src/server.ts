import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import pool from './db/pool';

const PORT = parseInt(process.env.PORT || '3000');

async function start() {
  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`OffsetCalc API running on port ${PORT}`, {
        env: process.env.NODE_ENV,
        version: process.env.API_VERSION || 'v1',
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

start();
