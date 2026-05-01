import mongoose from 'mongoose';

// 1. Variant Schema
const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
  original_price: { type: Number },
  quantity: { type: Number, required: true, default: 0 }
});

// Fix: Ensure Variants also use 'id' instead of '_id'
variantSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) { 
    delete ret._id; 
  }
});

// 2. Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  howToUse: { type: String },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  country: { type: String },
  is_koko_enabled: { type: Boolean, default: false },
  images: [{ type: String }],
  variants: [variantSchema], 
}, { timestamps: true });

productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    delete ret._id;
  }
});

export default mongoose.model('Product', productSchema);