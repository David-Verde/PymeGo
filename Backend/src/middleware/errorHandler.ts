import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { isDevelopment } from '../config/config';
import { IApiResponse } from '../types';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  path?: string;
  value?: any;
  keyValue?: Record<string, any>;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // MongoDB/Mongoose errors
  if (error instanceof MongooseError.ValidationError) {
    statusCode = 400;
    const errors = Object.values(error.errors).map(err => err.message);
    message = `Validation Error: ${errors.join(', ')}`;
  } else if (error instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  } else if (error.code === 11000) {
    // Duplicate key error
    statusCode = 400;
    const field = Object.keys(error.keyValue || {})[0];
    message = `Duplicate value for ${field}. Please use another value.`;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  const response: IApiResponse = {
    success: false,
    message,
    error: isDevelopment ? error.stack : undefined,
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: IApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};