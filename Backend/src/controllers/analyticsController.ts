import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { asyncHandler } from '../middleware/errorHandler';
import { IApiResponse, TransactionType } from '../types';

export const getExpenseAnalysis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { startDate, endDate } = req.query;

  const dateFilter: any = { 
    businessId, 
    type: TransactionType.EXPENSE 
  };
  
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = new Date(startDate as string);
    if (endDate) dateFilter.date.$lte = new Date(endDate as string);
  }

  const expenseData = await Transaction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.totalAmount, 0);

  const result = expenseData.map(item => ({
    category: item._id,
    amount: item.totalAmount,
    percentage: totalExpenses > 0 ? (item.totalAmount / totalExpenses) * 100 : 0
  }));

  const response: IApiResponse = {
    success: true,
    data: result,
  };

  res.status(200).json(response);
});

export const getProductPerformance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { startDate, endDate } = req.query;

  const dateFilter: any = { 
    businessId, 
    type: TransactionType.INCOME,
    "products.0": { $exists: true } // Only transactions with products
  };
  
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = new Date(startDate as string);
    if (endDate) dateFilter.date.$lte = new Date(endDate as string);
  }

  const performanceData = await Transaction.aggregate([
    { $match: dateFilter },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.productId",
        productName: { $first: "$products.productName" },
        unitsSold: { $sum: "$products.quantity" },
        revenue: { $sum: "$products.totalPrice" },
        profit: {
          $sum: {
            $subtract: [
              "$products.totalPrice",
              { $multiply: ["$products.quantity", "$products.costPrice"] }
            ]
          }
        }
      }
    },
    { $sort: { revenue: -1 } },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        productId: "$_id",
        productName: "$productDetails.name",
        unitsSold: 1,
        revenue: 1,
        profit: 1,
        profitMargin: {
          $cond: [
            { $eq: ["$revenue", 0] },
            0,
            { $multiply: [{ $divide: ["$profit", "$revenue"] }, 100] }
          ]
        }
      }
    }
  ]);

  const response: IApiResponse = {
    success: true,
    data: performanceData,
  };

  res.status(200).json(response);
});

export const getCashFlow = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const businessId = req.user?.businessId;
  const { period = 'monthly', startDate, endDate } = req.query;

  const dateFilter: any = { businessId };
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

  const cashFlowData = await Transaction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: groupBy,
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
          }
        },
        withdrawals: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionType.WITHDRAWAL] }, "$amount", 0]
          }
        }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
    {
      $project: {
        _id: 0,
        period: "$_id",
        income: 1,
        expenses: 1,
        withdrawals: 1,
        netCashFlow: {
          $subtract: [
            "$income",
            { $add: ["$expenses", "$withdrawals"] }
          ]
        }
      }
    }
  ]);

  const formattedData = cashFlowData.map(item => ({
    date: formatDate(item.period, period),
    income: item.income,
    expenses: item.expenses,
    withdrawals: item.withdrawals,
    netCashFlow: item.netCashFlow
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