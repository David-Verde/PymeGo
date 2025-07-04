import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { asyncHandler } from '../middleware/errorHandler';
import mongoose from 'mongoose'; // Importación añadida
import { 
  IApiResponse, 
  ICreateTransactionRequest, 
  IPagination, 
  TransactionType,
  ITransactionProduct 
} from '../types';

export const createTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const transactionData: ICreateTransactionRequest = req.body;

  if (transactionData.products && transactionData.products.length > 0) {
    for (const productData of transactionData.products) {
      const product = await Product.findOne({ 
        _id: productData.productId, 
        businessId 
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: `Product with ID ${productData.productId} not found`,
        });
        return;
      }

      if (transactionData.type === TransactionType.INCOME) {
        if (product.stockQuantity < productData.quantity) {
          res.status(400).json({
            success: false,
            message: `Insufficient stock for product ${product.name}`,
          });
          return;
        }
        product.stockQuantity -= productData.quantity;
        await product.save();
      }
    }
  }

  const transaction = await Transaction.create({
    ...transactionData,
    businessId,
  });

  const populatedTransaction = await Transaction.findById(transaction._id)
    .populate('products.productId', 'name sku');

  const response: IApiResponse = {
    success: true,
    message: 'Transaction created successfully',
    data: populatedTransaction,
  };

  res.status(201).json(response);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { 
    page = 1, 
    limit = 10, 
    type,
    category,
    paymentMethod,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const query: any = { businessId };
  
  if (type) {
    query.type = type;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate as string);
    }
  }

  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate('products.productId', 'name sku')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Transaction.countDocuments(query),
  ]);

  const pagination: IPagination = {
    page: pageNum,
    limit: limitNum,
    total,
    pages: Math.ceil(total / limitNum),
  };

  const response: IApiResponse = {
    success: true,
    data: transactions,
    pagination,
  };

  res.status(200).json(response);
});

export const getTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;

  const transaction = await Transaction.findOne({ _id: id, businessId })
    .populate('products.productId', 'name sku');

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    data: transaction,
  };

  res.status(200).json(response);
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;
  const updateData = req.body;

  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, businessId },
    updateData,
    { new: true, runValidators: true }
  ).populate('products.productId', 'name sku');

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
    return;
  }

  const response: IApiResponse = {
    success: true,
    message: 'Transaction updated successfully',
    data: transaction,
  };

  res.status(200).json(response);
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { id } = req.params;

  const transaction = await Transaction.findOneAndDelete({ _id: id, businessId });

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
    return;
  }

  if (transaction.type === TransactionType.INCOME && transaction.products) {
    for (const productData of transaction.products) {
      const product = await Product.findOne({ 
        _id: productData.productId, 
        businessId 
      });

      if (product) {
        product.stockQuantity += productData.quantity;
        await product.save();
      }
    }
  }

  const response: IApiResponse = {
    success: true,
    message: 'Transaction deleted successfully',
  };

  res.status(200).json(response);
});

export const getTransactionCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { type } = req.query;

  const query: any = { businessId };
  if (type) {
    query.type = type;
  }

  const categories = await Transaction.distinct('category', query);

  const response: IApiResponse = {
    success: true,
    data: categories,
  };

  res.status(200).json(response);
});

export const getFinancialSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = new mongoose.Types.ObjectId(req.user?.businessId); // Convertido a ObjectId
  const { startDate, endDate } = req.query;

  const dateFilter: any = { businessId }; // Ahora businessId es ObjectId
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = new Date(startDate as string);
    if (endDate) dateFilter.date.$lte = new Date(endDate as string);
  }

  const result = await Transaction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0]
          }
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
          }
        },
        totalWithdrawals: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionType.WITHDRAWAL] }, "$amount", 0]
          }
        },
      }
    },
    {
      $project: {
        _id: 0,
        totalIncome: 1,
        totalExpenses: 1,
        totalWithdrawals: 1,
        netProfit: {
          $subtract: [
            "$totalIncome",
            { $add: ["$totalExpenses", "$totalWithdrawals"] }
          ]
        }
      }
    }
  ]);

  const summary = result[0] || {
    totalIncome: 0,
    totalExpenses: 0,
    totalWithdrawals: 0,
    netProfit: 0
  };

  const response: IApiResponse = {
    success: true,
    data: {
      ...summary,
      period: {
        start: startDate ? new Date(startDate as string) : null,
        end: endDate ? new Date(endDate as string) : null
      }
    },
  };

  res.status(200).json(response);
});

export const getSalesTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = new mongoose.Types.ObjectId(req.user?.businessId); // Convertido a ObjectId
  const { period = 'monthly', startDate, endDate } = req.query;

  const dateFilter: any = { businessId, type: TransactionType.INCOME }; // Ahora businessId es ObjectId
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = new Date(startDate as string);
    if (endDate) dateFilter.date.$lte = new Date(endDate as string);
  }

  let groupBy: any;
  let format: string;

  switch (period) {
    case 'daily':
      groupBy = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" }
      };
      format = '%Y-%m-%d';
      break;
    case 'weekly':
      groupBy = {
        year: { $year: "$date" },
        week: { $week: "$date" }
      };
      format = '%Y-W%U';
      break;
    case 'monthly':
    default:
      groupBy = {
        year: { $year: "$date" },
        month: { $month: "$date" }
      };
      format = '%Y-%m';
      break;
  }

  const salesData = await Transaction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: groupBy,
        totalSales: { $sum: "$amount" },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
  ]);

  const formattedData = salesData.map(item => ({
    date: formatDate(item._id, period),
    sales: item.totalSales,
    transactions: item.transactionCount
  }));

  const response: IApiResponse = {
    success: true,
    data: formattedData,
  };

  res.status(200).json(response);
});

function formatDate(dateParts: any, period: string): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  switch (period) {
    case 'daily':
      return `${dateParts.year}-${pad(dateParts.month)}-${pad(dateParts.day)}`;
    case 'weekly':
      return `${dateParts.year}-W${pad(dateParts.week)}`;
    case 'monthly':
    default:
      return `${dateParts.year}-${pad(dateParts.month)}`;
  }
}