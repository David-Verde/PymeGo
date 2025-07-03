import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult, ValidationChain } from 'express-validator';
import { config } from '../config/config';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { IJwtPayload, IApiResponse } from '../types';

// Authentication Middlewares

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as IJwtPayload;
    
    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Token is no longer valid.'
      });
      return;
    }

    // Verify business still exists
    const business = await Business.findById(decoded.businessId);
    if (!business) {
      res.status(401).json({
        success: false,
        message: 'Business no longer exists.'
      });
      return;
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      businessId: decoded.businessId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as IJwtPayload;
    
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = {
        userId: decoded.userId,
        businessId: decoded.businessId,
        email: decoded.email,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Validation Middlewares

/**
 * Main validation function that runs all validation chains
 * @param validations Array of validation chains
 * @returns Middleware function
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    const response: IApiResponse = {
      success: false,
      message: 'Validation failed',
      error: formattedErrors.map(err => `${err.field}: ${err.message}`).join(', '),
      validationErrors: formattedErrors,
    };

    res.status(400).json(response);
  };
};

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: IApiResponse = {
      success: false,
      message: 'Validation failed',
      error: errors.array().map(error => 
        `${error.type === 'field' ? error.path : 'field'}: ${error.msg}`
      ).join(', '),
      validationErrors: errors.array(),
    };

    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Middleware to check if the authenticated user is an admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
    return;
  }
  next();
};

/**
 * Middleware to check if the authenticated user is the owner of the resource
 */
export const requireOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.userId !== req.params.userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You are not the owner of this resource.',
    });
    return;
  }
  next();
};