import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';



// if this error is an instance of the custom errors implemented which are mostly operational errors, log it
//otherwise, this is most likely a programming error, log it and return a generic message to the client

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    console.warn(
      `[${err.code}] ${err.message}`,
      err.details ? { details: err.details } : ''
    );

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

