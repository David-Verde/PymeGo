import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { config } from '../config/config';
import { asyncHandler } from '../middleware/errorHandler';
import { IApiResponse, IAuthRequest, IRegisterRequest, IJwtPayload } from '../types';

const generateToken = (payload: Omit<IJwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    payload as object,  // Asegurar que payload sea tratado como object
    config.jwt.secret,  // Esto debería ser string | Buffer
    {
      expiresIn: config.jwt.expiresIn  // Esto debería ser string | number
    } as jwt.SignOptions  // Asegurar que las opciones sean del tipo correcto
  );
};

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, business: businessData }: IRegisterRequest = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
    return;
  }

  // Create user
  const user = await User.create({
    email,
    password,
  });

  // Create business
  const business = await Business.create({
    userId: user._id,
    ...businessData,
  });

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    businessId: business._id.toString(),
    email: user.email,
  });

  const response: IApiResponse = {
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      business: {
        id: business._id,
        name: business.name,
        category: business.category,
        currency: business.currency,
        timezone: business.timezone,
        createdAt: business.createdAt,
      },
    },
  };

  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password }: IAuthRequest = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }

  // Find business
  const business = await Business.findOne({ userId: user._id });
  if (!business) {
    res.status(404).json({
      success: false,
      message: 'Business not found',
    });
    return;
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    businessId: business._id.toString(),
    email: user.email,
  });

  const response: IApiResponse = {
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      business: {
        id: business._id,
        name: business.name,
        category: business.category,
        currency: business.currency,
        timezone: business.timezone,
        settings: business.settings,
        createdAt: business.createdAt,
      },
    },
  };

  res.status(200).json(response);
});

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  
  const user = await User.findById(userId);
  const business = await Business.findOne({ userId });

  if (!user || !business) {
    res.status(404).json({
      success: false,
      message: 'User or business not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      business: {
        id: business._id,
        name: business.name,
        description: business.description,
        category: business.category,
        address: business.address,
        phone: business.phone,
        taxId: business.taxId,
        currency: business.currency,
        timezone: business.timezone,
        settings: business.settings,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
    },
  };

  res.status(200).json(response);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { business: businessData } = req.body;

  const business = await Business.findOneAndUpdate(
    { userId },
    businessData,
    { new: true, runValidators: true }
  );

  if (!business) {
    res.status(404).json({
      success: false,
      message: 'Business not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    message: 'Profile updated successfully',
    data: {
      business,
    },
  };

  res.status(200).json(response);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const businessId = req.user?.businessId;
  const email = req.user?.email;

  if (!userId || !businessId || !email) {
    res.status(401).json({
      success: false,
      message: 'Invalid token data',
    });
    return;
  }

  const token = generateToken({
    userId,
    businessId,
    email,
  });

  const response: IApiResponse = {
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token,
    },
  };

  res.status(200).json(response);
});