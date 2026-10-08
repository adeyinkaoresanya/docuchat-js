// src/middleware/sanitize.ts
import type { Request, Response, NextFunction } from 'express';
import xss from 'xss';

function sanitizeValue(value: any): any {

  if (typeof value === 'string') {
    return xss(value, {
      whiteList: {},          // Strip ALL HTML tags
      stripIgnoreTag: true,   // Remove unrecognized tags entirely
      stripIgnoreTagBody: ['script', 'style'], // Remove script/style contents
    });
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const clean: any = {};
    for (const key of Object.keys(value)) {
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }
  return value;
}

export function sanitizeInput(
  req: Request, res: Response, next: NextFunction
) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    const sanitizedQuery = sanitizeValue(req.query);
    Object.assign(req.query as Record<string, unknown>, sanitizedQuery);
  }

  if (req.params) {
    const sanitizedParams = sanitizeValue(req.params);
    Object.assign(req.params as Record<string, unknown>, sanitizedParams);
  }

  next();
}

