import mongoose from 'mongoose';

const productViewSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    sessionId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductView = mongoose.model('ProductView', productViewSchema);
export default ProductView;
