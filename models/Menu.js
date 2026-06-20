import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a menu item name'],
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please add a category'],
    },
    image: {
      type: String, // path to the uploaded image in /uploads/menu
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    status: {
      type: String,
      enum: ['Available', 'Out Of Stock', 'Hidden'],
      default: 'Available',
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Menu = mongoose.model('Menu', menuSchema);
export default Menu;
