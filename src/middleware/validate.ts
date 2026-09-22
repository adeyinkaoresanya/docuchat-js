import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// export function validate(schema: z.ZodType<any, any>) {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const result = schema.safeParse({
//       body: req.body,
//       query: req.query,
//       params: req.params,
//     });

//     if (!result.success) {
//       const errors = result.error.issues.map(err => ({
//         field: err.path.slice(1).join('.'), // Remove 'body'/'query' prefix
//         message: err.message,
//       }));

//       return res.status(400).json({
//         success: false,
//         error: {
//           code: 'VALIDATION_ERROR',
//           message: 'Request validation failed',
//           details: errors,
//         },
//       });
//     }

//     // Replace req properties with validated (and transformed) data
//     req.body = result.data.body ?? req.body;
//     req.query = result.data.query ?? req.query;
//     req.params = result.data.params ?? req.params;

//     next();
//   };
// }


export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
    }

    req.body = parsed.data;
    next();
  };
}
