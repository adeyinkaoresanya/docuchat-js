import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';

export function requestLogger(
  req: Request, res: Response, next: NextFunction
) {
  const incomingCorrelationId = req.headers['x-correlation-id'];
  const correlationId = typeof incomingCorrelationId === 'string'
    ? incomingCorrelationId
    : randomUUID();

  (req as any).correlationId = correlationId;
  
    const requestLog = logger.child({
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.setHeader('X-Correlation-Id', correlationId);

  const startTime = Date.now();

    requestLog.info('Request received');

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logData = {
      statusCode: res.statusCode,
      durationMs: duration,
      userId: (req as any).user?.id,
    };

    if (res.statusCode >= 500) {
        requestLog.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
        requestLog.warn(logData, 'Request client error');
    } else {
        requestLog.info(logData, 'Request completed');
    }
  });

  next();
}
