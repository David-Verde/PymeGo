import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { asyncHandler } from '../middleware/errorHandler';
import { IApiResponse, ICreateProductRequest, IPagination } from '../types';

export const createProduct = asyncHandler(async (req: Request<{}, any, ICreateProductRequest>, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const productData = req.body; // Ya no necesitas la anotación de tipo aquí

  const product = await Product.create({
    ...productData,
    businessId,
  });

  const response: IApiResponse = {
    success: true,
    message: 'Product created successfully',
    data: product,
  };

  res.status(201).json(response);
});

export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { 
    page = 1, 
    limit = 10, 
    category, 
    search, 
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: any = { businessId };
  
  if (category) {
    query.category = category;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  // Build sort
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  const pagination: IPagination = {
    page: pageNum,
    limit: limitNum,
    total,
    pages: Math.ceil(total / limitNum),
  };

  const response: IApiResponse = {
    success: true,
    data: products,
    pagination,
  };

  res.status(200).json(response);
});

export const getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, businessId });

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    data: product,
  };

  res.status(200).json(response);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;
  const updateData = req.body;

  const product = await Product.findOneAndUpdate(
    { _id: id, businessId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    message: 'Product updated successfully',
    data: product,
  };

  res.status(200).json(response);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;

  const product = await Product.findOneAndDelete({ _id: id, businessId });

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    message: 'Product deleted successfully',
  };

  res.status(200).json(response);
});

export const getProductCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;

  const categories = await Product.distinct('category', { businessId, isActive: true });

  const response: IApiResponse = {
    success: true,
    data: categories,
  };

  res.status(200).json(response);
});

export const getLowStockProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = new mongoose.Types.ObjectId(req.user?.businessId);

  const products = await Product.find({
    businessId,
    isActive: true,
    $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
  }).sort({ stockQuantity: 1 });

  const response: IApiResponse = {
    success: true,
    data: products,
  };

  res.status(200).json(response);
});

export const updateStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;
  const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

  const product = await Product.findOne({ _id: id, businessId });

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }

  if (operation === 'add') {
    product.stockQuantity += quantity;
  } else if (operation === 'subtract') {
    product.stockQuantity = Math.max(0, product.stockQuantity - quantity);
  } else {
    product.stockQuantity = quantity;
  }

  await product.save();

  const response: IApiResponse = {
    success: true,
    message: 'Stock updated successfully',
    data: product,
  };

  res.status(200).json(response);
});