import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { scrubSensitiveData, scrubSensitiveString } from '../lib/scrub';



// if this error is an instance of the custom errors implemented which are mostly operational errors, log it
//otherwise, this is most likely a programming error, log it and return a generic message to the client

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
      { error: scrubSensitiveData(err), method: req.method, path: req.path },
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

