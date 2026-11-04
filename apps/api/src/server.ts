import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './core/config.js';
import { logger } from './core/errors.js';
try {
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const server = app.listen(config.PORT, '0.0.0.0', () =>
    logger.info({ port: config.PORT }, 'Nexora API ready'),
  );
  const shutdown = () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  logger.fatal(
    { message: error instanceof Error ? error.message : 'Connection failed' },
    'Cannot start API',
  );
  process.exit(1);
}
