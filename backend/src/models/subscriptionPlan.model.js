
import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },        
  price: { type: Number, required: true },
  duration: { type: Number, required: true },    
  features: [{ type: String }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('SubscriptionPlan', planSchema);