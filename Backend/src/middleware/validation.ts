import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { IJwtPayload } from '../types';

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