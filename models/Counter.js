import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    businessDate: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure counter is unique per shop per business date
counterSchema.index({ shopId: 1, businessDate: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
