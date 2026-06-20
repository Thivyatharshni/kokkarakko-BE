import Category from '../models/Category.js';
import Shop from '../models/Shop.js';
import Menu from '../models/Menu.js';

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Owner
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found for this user' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/category/${req.file.filename}`;
    }

    const category = await Category.create({
      shopId: shop._id,
      name,
      description,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories for a shop (with product count)
// @route   GET /api/categories/:slug
// @access  Public (also used by admin)
export const getCategoriesByShopSlug = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const categories = await Category.find({ shopId: shop._id });
    
    // Fetch product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Menu.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          productCount: count,
        };
      })
    );

    res.json({
      success: true,
      message: 'Categories fetched successfully',
      data: categoriesWithCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Owner
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || shop._id.toString() !== category.shopId.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to update this category' });
    }

    const { name, description } = req.body;

    if (name) category.name = name;
    if (description !== undefined) category.description = description;

    if (req.file) {
      category.image = `/uploads/category/${req.file.filename}`;
    }

    const updatedCategory = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Owner
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || shop._id.toString() !== category.shopId.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this category' });
    }

    // Check if products exist under this category
    const productCount = await Menu.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. There are ${productCount} products associated with it. Please move or delete the products first.` 
      });
    }

    await Category.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
