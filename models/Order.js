import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    businessDate: {
      type: String,
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    customerName: {
      type: String,
      required: [true, 'Please add customer name'],
    },
    customerMobile: {
      type: String,
      required: [true, 'Please add customer mobile'],
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure token/orderNumber is unique per shop per business date
orderSchema.index({ shopId: 1, businessDate: 1, orderNumber: 1 }, { unique: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
