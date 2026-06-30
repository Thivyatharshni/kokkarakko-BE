import Menu from '../models/Menu.js';
import Shop from '../models/Shop.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Create a new menu item
// @route   POST /api/menu
// @access  Private/Owner
export const createMenuItem = async (req, res) => {
  try {
    const { name, description, category, price, status, featured, quantity } = req.body;

    // Verify owner has a shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found for this user' });
    }

    // Validate quantity
    const qty = quantity !== undefined ? Number(quantity) : 0;
    if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a non-negative whole number' });
    }

    // Automatically sync status based on quantity
    let finalStatus = status || 'Available';
    if (qty === 0) {
      finalStatus = 'Out Of Stock';
    } else if (qty > 0 && finalStatus === 'Out Of Stock') {
      finalStatus = 'Available';
    }

    let imageUrl = '';
    let cloudinaryPublicId = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'menu');
      imageUrl = result.secure_url;
      cloudinaryPublicId = result.public_id;
    }

    const menuItem = await Menu.create({
      shopId: shop._id,
      name,
      description,
      category,
      price,
      status: finalStatus,
      quantity: qty,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : false,
      image: imageUrl,
      cloudinaryPublicId,
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all menu items for a shop by slug
// @route   GET /api/menu/:slug
// @access  Public (Customers need to see this)
export const getMenuByShopId = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const menuItems = await Menu.find({ shopId: shop._id }).populate('category');

    res.json({
      success: true,
      message: 'Menu items fetched successfully',
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private/Owner
export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Verify owner owns the shop that owns this menu item
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || shop._id.toString() !== menuItem.shopId.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to update this item' });
    }

    const { name, description, category, price, status, featured, quantity } = req.body;

    if (name) menuItem.name = name;
    if (description) menuItem.description = description;
    if (category) menuItem.category = category;
    if (price) menuItem.price = price;
    if (status !== undefined) menuItem.status = status;
    if (featured !== undefined) menuItem.featured = featured === 'true' || featured === true;

    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a non-negative whole number' });
      }
      menuItem.quantity = qty;
      if (qty === 0) {
        menuItem.status = 'Out Of Stock';
      } else if (qty > 0 && menuItem.status === 'Out Of Stock') {
        menuItem.status = 'Available';
      }
    }

    if (req.file) {
      if (menuItem.cloudinaryPublicId) {
        await deleteFromCloudinary(menuItem.cloudinaryPublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'menu');
      menuItem.image = result.secure_url;
      menuItem.cloudinaryPublicId = result.public_id;
    }

    const updatedMenuItem = await menuItem.save();

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private/Owner
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Verify owner owns the shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || shop._id.toString() !== menuItem.shopId.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this item' });
    }

    if (menuItem.cloudinaryPublicId) {
      await deleteFromCloudinary(menuItem.cloudinaryPublicId);
    }

    await Menu.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Menu item removed successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured menu items for a shop by slug
// @route   GET /api/menu/featured/:slug
// @access  Public
export const getFeaturedMenuByShopSlug = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Query for featured items, or fallback to first 4 items if none exist
    let featuredItems = await Menu.find({ shopId: shop._id, featured: true }).populate('category');
    if (featuredItems.length === 0) {
      featuredItems = await Menu.find({ shopId: shop._id }).limit(4).populate('category');
    }

    res.json({
      success: true,
      message: 'Featured menu items fetched successfully',
      data: featuredItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
