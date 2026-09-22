import { app } from './app.js';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';

const PORT = config.PORT;

app.listen(PORT, () => {
  logger.info({
    event: 'server:started',
    port: PORT,
    environment: config.NODE_ENV,
  });
});
