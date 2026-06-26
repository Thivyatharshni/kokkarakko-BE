import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String, // path to the uploaded image in /uploads/menu
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate category names for the same shop
categorySchema.index({ shopId: 1, name: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
