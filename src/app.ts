import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config/env';
import { logger } from './lib/logger';

import './events/auth.events';
import './events/admin.events';
import './events/document.events';
import './events/cache.events';

import './queues/document.worker';




import authRoutes from './routes/auth';


import { errorHandler } from './middleware/errorHandler';


import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';


const app = express();

// === MIDDLEWARE (runs on every request) ===
app.use(helmet());              // Security headers
app.use(cors());                // Cross-origin requests


// Capture raw body for webhook routes BEFORE express.json()
// const secret = process.env.WEBHOOK_SECRET
// app.use('/webhooks', verifyWebhookSignature(secret, "x-signature"), express.raw({
//   type: 'application/json',
//   verify: (req: any, res, buf) => {
//     req.rawBody = buf;
//   },
// }));

app.use(express.json());        // Parse JSON request bodies

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === REQUEST LOGGING ===
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Also serve the raw JSON spec (useful for code generators)
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});


// === ROUTES (mounted here as you build them) ===
// API v1
app.use('/api/v1/auth', authRoutes);
//app.use('/api/v1/admin', adminRoutes);
// app.use('/api/v1/documents', documentRoutes);
// app.use('/api/v1/conversations', conversationRoutes);
// app.use('/api/v1/chat', chatRoutes);

// When v2 exists:
// app.use('/api/v2/documents', documentRoutesV2);


// === ERROR HANDLER (must be last middleware) ===

 
// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` },
  });
});

app.use(errorHandler);


// Mount the dashboard (protect with auth in production)
// app.use('/admin/queues', bullBoardAdapter.getRouter());


export { app };
