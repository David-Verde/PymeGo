import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  refreshToken 
} from '../controllers/authController';
import { 
  createProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct,
  getProductCategories,
  getLowStockProducts,
  updateStock
} from '../controllers/productController';
import { 
  createTransaction, 
  getTransactions, 
  getTransaction, 
  updateTransaction, 
  deleteTransaction,
  getTransactionCategories,
  getFinancialSummary,
  getSalesTrends
} from '../controllers/transactionController';
import { 
  getExpenseAnalysis, 
  getProductPerformance, 
  getCashFlow 
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { generalLimiter, authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Auth Routes
router.post('/auth/register', 
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('business.name').notEmpty().withMessage('Business name is required'),
    body('business.category').notEmpty().withMessage('Business category is required'),
    body('business.currency').notEmpty().withMessage('Currency is required'),
    body('business.timezone').notEmpty().withMessage('Timezone is required'),
  ]),
  register
);

router.post('/auth/login', 
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/auth/profile', authenticate, getProfile);
router.put('/auth/profile', authenticate, updateProfile);
router.post('/auth/refresh-token', authenticate, refreshToken);

// Product Routes
router.post('/products', 
  authenticate,
  validate([
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
    body('salePrice').isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  ]),
  createProduct
);

router.get('/products', authenticate, getProducts);
router.get('/products/:id', authenticate, getProduct);
router.put('/products/:id', authenticate, updateProduct);
router.delete('/products/:id', authenticate, deleteProduct);
router.get('/products/categories', authenticate, getProductCategories);
router.get('/products/low-stock', authenticate, getLowStockProducts);
router.patch('/products/:id/stock', 
  authenticate,
  validate([
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('operation').optional().isIn(['add', 'subtract']).withMessage('Operation must be "add" or "subtract"'),
  ]),
  updateStock
);

// Transaction Routes
router.post('/transactions', 
  authenticate,
  validate([
    body('type').isIn(['income', 'expense', 'withdrawal']).withMessage('Invalid transaction type'),
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('paymentMethod').isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'])
      .withMessage('Invalid payment method'),
  ]),
  createTransaction
);

router.get('/transactions', authenticate, getTransactions);

// Rutas específicas de transacciones primero
router.get('/transactions/summary', authenticate, getFinancialSummary);
router.get('/transactions/sales-trends', authenticate, getSalesTrends);
router.get('/transactions/categories', authenticate, getTransactionCategories);

// Rutas genéricas de transacciones después
router.get('/transactions/:id', authenticate, getTransaction);
router.put('/transactions/:id', authenticate, updateTransaction);
router.delete('/transactions/:id', authenticate, deleteTransaction);

// Analytics Routes
router.get('/analytics/expenses', authenticate, getExpenseAnalysis);
router.get('/analytics/product-performance', authenticate, getProductPerformance);
router.get('/analytics/cash-flow', authenticate, getCashFlow);

export default router;