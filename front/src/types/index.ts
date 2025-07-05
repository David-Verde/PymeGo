
export interface IUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessSettings {
  lowStockAlert: boolean;
  lowStockThreshold: number;
  defaultTaxRate: number;
  fiscalYearStart: number;
  language: string;
  theme: 'light' | 'dark';
}

export interface IBusiness {
  id: string;
  name: string;
  category: string;
  currency: string;
  timezone: string;
  settings: IBusinessSettings;
  createdAt: string;
}

// Para las respuestas de la API
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Tipos para Analíticas (muy importantes para los gráficos)
export interface IFinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalWithdrawals: number;
  netProfit: number;
}

export interface ISalesTrend {
  date: string;
  sales: number;
  transactions: number;
}

export interface IExpenseAnalysis {
  category: string;
  amount: number;
  percentage: number;
}


export interface IProduct {
id?: string;
    _id?: string;
  name: string;
  description?: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  WITHDRAWAL = 'withdrawal'
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
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number; // Calculado (quantity * unitPrice)
}

// Actualiza ITransaction para incluir los productos
export interface ITransaction {
  _id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: PaymentMethod;
  products?: ITransactionProduct[]; // <-- AÑADIR ESTO
}

// Añade el tipo para la petición de crear transacción
export interface ICreateTransactionRequest {
    type: TransactionType;
    category: string;
    amount: number;
    description?: string;
    date: string;
    paymentMethod: PaymentMethod;
    products?: ITransactionProduct[];
    tags?: string[];
}
