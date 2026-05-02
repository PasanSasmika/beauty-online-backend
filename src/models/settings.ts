import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  image: { type: String, required: true },       // stored filename/path
  description: { type: String, default: '' },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

const settingSchema = new mongoose.Schema({
  shipping_cost: {
    type: Number,
    required: true,
    default: 500
  },
  banners: { type: [bannerSchema], default: [] },
}, { timestamps: true });

settingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    delete ret._id;
  }
});

export default mongoose.model('Setting', settingSchema);