import { Document, ObjectId } from 'mongoose';

// User & Business Types
export interface IUser extends Document {
  _id: ObjectId;
  email: string;
  password: string;
    isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IBusiness extends Document {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  category: BusinessCategory;
  address?: string;
  phone?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  settings: IBusinessSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessSettings {
  lowStockAlert: boolean;
  lowStockThreshold: number;
  defaultTaxRate: number;
  fiscalYearStart: number; // Month (1-12)
  language: string;
  theme: 'light' | 'dark';
}

export enum BusinessCategory {
  RESTAURANT = 'restaurant',
  RETAIL = 'retail',
  SERVICE = 'service',
  MANUFACTURING = 'manufacturing',
  OTHER = 'other'
}

// Product Types
export interface IProduct extends Document {
  _id: ObjectId;
  businessId: ObjectId;
  name: string;
  description?: string;
  category: string;
  costPrice: number;
  salePrice: number;
  margin: number; // Calculated field
  sku?: string;
  variants: IProductVariant[];
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  name: string; // e.g., "Small", "Medium", "Large"
  costPrice: number;
  salePrice: number;
  sku?: string;
  stockQuantity: number;
}

// Transaction Types
export interface ITransaction extends Document {
  _id: ObjectId;
  businessId: ObjectId;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod: PaymentMethod;
  reference?: string;
  products?: ITransactionProduct[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  WITHDRAWAL = 'withdrawal' // Personal withdrawals
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other'
}

export interface ITransactionProduct {
  productId: ObjectId;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Analytics Types
export interface IFinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalWithdrawals: number;
  netProfit: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ISalesData {
  date: string;
  sales: number;
  transactions: number;
}

export interface IExpenseData {
  category: string;
  amount: number;
  percentage: number;
}

export interface IProductPerformance {
  productId: ObjectId;
  productName: string;
  unitsSold: number;
  revenue: number;
  profit: number;
}
export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}
// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
  validationErrors?: IValidationError[];
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Request Types
export interface IAuthRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest extends IAuthRequest {
  business: {
    name: string;
    description?: string;
    category: BusinessCategory;
    address?: string;
    phone?: string;
    currency: string;
    timezone: string;
  };
}

export interface ICreateProductRequest {
  name: string;
  description?: string;
  category: string;
  costPrice: number;
  salePrice: number;
  sku?: string;
  variants?: IProductVariant[];
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface ICreateTransactionRequest {
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod: PaymentMethod;
  reference?: string;
  products?: ITransactionProduct[];
  tags?: string[];
}

// JWT Payload
export interface IJwtPayload {
  userId: string;
  businessId: string;
  email: string;
    isAdmin: boolean;
  iat: number;
  exp: number;
}

// Express Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: {
        isAdmin: any;
        userId: string;
        businessId: string;
        email: string;
      };
    }
  }
}