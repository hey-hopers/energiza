// backend/src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Standardized error response structure
interface ErrorResponse {
  success: false;
  message: string;
  details?: any;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  console.error(err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      // Fix: Explicitly cast err to ZodError to access the 'errors' property.
      details: (err as ZodError).errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }
  
  // Handle other known errors (e.g., custom AppError class)
  // if (err instanceof AppError) {
  //   return res.status(err.statusCode).json({ success: false, message: err.message });
  // }

  // Generic server error
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
  });
};
