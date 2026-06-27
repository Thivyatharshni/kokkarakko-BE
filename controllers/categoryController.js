import Category from '../models/Category.js';
import Shop from '../models/Shop.js';
import Menu from '../models/Menu.js';

// @desc    Get categories by shop slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoriesBySlug = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const categories = await Category.find({ shopId: shop._id });

    // Include productCount for category deletion validation
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Menu.countDocuments({ shopId: shop._id, category: cat.name });
        return {
          ...cat.toObject(),
          productCount,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Owner
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create({
      shopId: shop._id,
      name,
      description,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category
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
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { name, description } = req.body;
    if (name) category.name = name;
    if (description) category.description = description;

    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    const updatedCategory = await category.save();

    res.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category
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
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Verify no menu items are under this category
    const productCount = await Menu.countDocuments({ shopId: shop._id, category: category.name });
    if (productCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with products' });
    }

    await Category.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Category removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
