// 




import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { scrubSensitiveData, scrubSensitiveString } from '../lib/scrub';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    const scrubbedMessage = scrubSensitiveString(err.message);
    const scrubbedDetails = err.details
      ? scrubSensitiveData(err.details)
      : undefined;
    const scrubbedStack = err.stack
      ? scrubSensitiveString(err.stack)
      : undefined;

    logger.warn(
      {
        code: err.code,
        statusCode: err.statusCode,
        method: req.method,
        path: req.path,
        details: scrubbedDetails,
        stack: scrubbedStack,
      },
      `[${err.code}] ${scrubbedMessage}`
    );

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: scrubbedMessage,
        ...(scrubbedDetails ? { details: scrubbedDetails } : {}),
      },
    });
  }

  // Multer errors are client/request errors, not server errors
  if (err instanceof multer.MulterError) {
    logger.warn(
      {
        code: 'MULTER_ERROR',
        statusCode: 400,
        method: req.method,
        path: req.path,
        message: scrubSensitiveString(err.message),
        field: err.field,
      },
      'File upload error'
    );

    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_UPLOAD',
        message: 'There was a problem uploading the file. Please try again.',
        // code: 'MULTER_ERROR',
        // message: scrubSensitiveString(err.message),
        // ...(err.field ? { field: err.field } : {}),
      },
    });
  }

  if (err instanceof Error) {
    logger.error(
      {
        name: err.name,
        method: req.method,
        path: req.path,
        message: scrubSensitiveString(err.message),
        stack: err.stack ? scrubSensitiveString(err.stack) : undefined,
      },
      'Unhandled error'
    );
  } else {
    logger.error(
      {
        error: scrubSensitiveData(err),
        method: req.method,
        path: req.path,
      },
      'Unhandled non-Error thrown'
    );
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}