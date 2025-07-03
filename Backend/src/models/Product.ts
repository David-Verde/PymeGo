import mongoose, { Schema } from 'mongoose';
import { IProduct, IProductVariant } from '../types';

const productVariantSchema = new Schema<IProductVariant>({
  name: {
    type: String,
    required: [true, 'Variant name is required'],
    trim: true,
    maxlength: [50, 'Variant name cannot exceed 50 characters'],
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price must be positive'],
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required'],
    min: [0, 'Sale price must be positive'],
    validate: {
      validator: function(this: IProductVariant, value: number) {
        return value >= this.costPrice;
      },
      message: 'Sale price must be greater than or equal to cost price',
    },
  },
  sku: {
    type: String,
    trim: true,
    maxlength: [50, 'SKU cannot exceed 50 characters'],
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity must be non-negative'],
    default: 0,
  },
});

const productSchema = new Schema<IProduct>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price must be positive'],
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Sale price must be positive'],
      validate: {
        validator: function(this: IProduct, value: number) {
          return value >= this.costPrice;
        },
        message: 'Sale price must be greater than or equal to cost price',
      },
    },
    margin: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      maxlength: [50, 'SKU cannot exceed 50 characters'],
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity must be non-negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold must be non-negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
productSchema.index({ businessId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1 });
productSchema.index({ stockQuantity: 1 });

// Calculate margin before saving
productSchema.pre('save', function (next) {
  if (this.salePrice && this.costPrice) {
    this.margin = ((this.salePrice - this.costPrice) / this.salePrice) * 100;
  }
  next();
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function () {
  return this.stockQuantity <= this.lowStockThreshold;
});

// Ensure unique SKU per business
productSchema.index(
  { businessId: 1, sku: 1 },
  { 
    unique: true,
    partialFilterExpression: { sku: { $exists: true, $ne: null } }
  }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);