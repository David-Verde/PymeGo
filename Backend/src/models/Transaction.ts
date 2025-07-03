import mongoose, { Schema } from 'mongoose';
import { ITransaction, TransactionType, PaymentMethod, ITransactionProduct } from '../types';

const transactionProductSchema = new Schema<ITransactionProduct>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantName: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be positive'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price must be positive'],
  },
});

const transactionSchema = new Schema<ITransaction>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required'],
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference cannot exceed 100 characters'],
    },
    products: {
      type: [transactionProductSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
transactionSchema.index({ businessId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ businessId: 1, date: -1 });
transactionSchema.index({ businessId: 1, type: 1, date: -1 });

// Validate total price matches sum of products
transactionSchema.pre('save', function (next) {
  if (this.products && this.products.length > 0) {
    const calculatedTotal = this.products.reduce((sum, product) => {
      return sum + (product.quantity * product.unitPrice);
    }, 0);
    
    // Allow small floating point differences
    if (Math.abs(this.amount - calculatedTotal) > 0.01) {
      return next(new Error('Amount must match sum of products'));
    }
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);