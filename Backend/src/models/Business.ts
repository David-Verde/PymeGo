import mongoose, { Schema } from 'mongoose';
import { IBusiness, BusinessCategory } from '../types';

const businessSettingsSchema = new Schema({
  lowStockAlert: {
    type: Boolean,
    default: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0,
  },
  defaultTaxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  fiscalYearStart: {
    type: Number,
    default: 1,
    min: 1,
    max: 12,
  },
  language: {
    type: String,
    default: 'es',
    enum: ['es', 'en'],
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark'],
  },
});

const businessSchema = new Schema<IBusiness>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: Object.values(BusinessCategory),
      required: [true, 'Business category is required'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please provide a valid phone number'
      ],
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot exceed 50 characters'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      enum: ['USD', 'EUR', 'MXN', 'COP', 'PEN', 'CLP', 'ARG'],
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'America/New_York',
    },
    settings: {
      type: businessSettingsSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
businessSchema.index({ userId: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ createdAt: -1 });

// Ensure one business per user (for free tier)
businessSchema.index({ userId: 1 }, { unique: true });

export const Business = mongoose.model<IBusiness>('Business', businessSchema);