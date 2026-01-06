import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customer: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      size: String,
      price: Number,
      quantity: Number,
      image: String,
    }
  ],
  total_amount: { type: Number, required: true },
  shipping_cost: { type: Number, required: true, default: 500 },
  payment_method: { type: String, default: 'cod' }, 
  payment_status: { type: String, default: 'pending' }, 
  order_status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] 
  }
}, { timestamps: true });

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) { 
    delete ret._id; 
  }
});

export default mongoose.model('Order', orderSchema);