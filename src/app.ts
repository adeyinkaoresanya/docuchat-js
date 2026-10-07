import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config/env';
import { requestLogger } from './middleware/requestLogger';

import './events/auth.events';
import './events/admin.events';
import './events/document.events';
import './events/cache.events';
import './events/security.events'; 
import './events/ingestion.events';

import './queues/document.worker';


import { metricsRegistry } from './lib/metrics';



import authRoutes from './routes/auth';
import healthRoutes from './routes/health';


import { errorHandler } from './middleware/errorHandler';
//import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
import { metricsMiddleware } from './middleware/metrics';





import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';


const app = express();

// === MIDDLEWARE (runs on every request) ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"],
      // Allow Swagger UI if you serve it
      // scriptSrc: ["'self'", "'unsafe-inline'"],
      // styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
})
);    

const allowedOrigins = [
  config.FRONTEND_URL || 'http://localhost:3001',
];

          // Security headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,  // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight requests for 24 hours
}
));                // Cross-origin requests


// Capture raw body for webhook routes BEFORE express.json()
// const secret = process.env.WEBHOOK_SECRET
// app.use('/webhooks', verifyWebhookSignature(secret, "x-signature"), express.raw({
//   type: 'application/json',
//   verify: (req: any, res, buf) => {
//     req.rawBody = buf;
//   },
// }));

app.use(express.json());        // Parse JSON request bodies
app.use(sanitizeInput);
app.use(requestLogger);
app.use(metricsMiddleware);    // Prometheus metrics

// Serve Swagger UI
app.use('/api-docs', helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
})
, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === HEALTH CHECK ===

app.use(healthRoutes);

// app.get('/health', (req, res) => {
//   res.json({
//     status: 'ok',
//     timestamp: new Date().toISOString(),
//     environment: config.NODE_ENV,
//   });
// });

// Also serve the raw JSON spec (useful for code generators)
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Metrics endpoint (no auth — Prometheus needs to scrape it)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});



// === ROUTES (mounted here as you build them) ===
// API v1
//app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes); //add authLimiter here
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
