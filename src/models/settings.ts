import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  shipping_cost: { 
    type: Number, 
    required: true, 
    default: 500 
  }
  // You can easily add more settings here in the future
  // store_name: { type: String },
  // tax_rate: { type: Number },
}, { timestamps: true });

// Ensure we remove _id when returning JSON
settingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    delete ret._id;
  }
});

export default mongoose.model('Setting', settingSchema);