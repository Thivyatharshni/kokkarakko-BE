import Category from '../models/Category.js';
import Shop from '../models/Shop.js';
import Menu from '../models/Menu.js';

// @desc    Get all categories for a shop by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoriesBySlug = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Find all categories for this shop
    let categories = await Category.find({ shopId: shop._id });

    // Fallback/Auto-sync: if no categories are stored in DB, look at Menu items and create categories
    if (categories.length === 0) {
      const distinctCategories = await Menu.distinct('category', { shopId: shop._id });
      for (const catName of distinctCategories) {
        if (catName) {
          try {
            await Category.create({
              shopId: shop._id,
              name: catName,
              description: `All items under ${catName}`,
            });
          } catch (e) {
            // Ignore duplicate errors in case of parallel execution/race conditions
            console.error('Failed to create fallback category:', e.message);
          }
        }
      }
      categories = await Category.find({ shopId: shop._id });
    }

    // Populate productCount for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Menu.countDocuments({
          shopId: shop._id,
          category: { $regex: new RegExp(`^${cat.name}$`, 'i') }, // Case insensitive match
        });
        return {
          ...cat.toObject(),
          productCount,
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

// @desc    Create a category
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
      imageUrl = `/uploads/menu/${req.file.filename}`;
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

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Owner
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Verify owner owns the shop that owns this category
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || shop._id.toString() !== category.shopId.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this category' });
    }

    const { name, description } = req.body;
    const oldName = category.name;

    if (name) category.name = name;
    if (description) category.description = description;

    if (req.file) {
      category.image = `/uploads/menu/${req.file.filename}`;
    }

    const updatedCategory = await category.save();

    // If category name changed, update the category string on all corresponding Menu items!
    if (name && name !== oldName) {
      await Menu.updateMany(
        { shopId: shop._id, category: oldName },
        { category: name }
      );
    }

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

    // Verify owner owns the shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || shop._id.toString() !== category.shopId.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this category' });
    }

    // Check if there are products under this category
    const productCount = await Menu.countDocuments({
      shopId: shop._id,
      category: category.name,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${productCount} products under this category.`,
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
