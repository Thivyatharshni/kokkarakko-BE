import Shop from '../models/Shop.js';
import slugify from 'slugify';

// @desc    Create a new shop
// @route   POST /api/shop
// @access  Private/Owner
export const createShop = async (req, res) => {
  try {
    const { shopName, address } = req.body;

    // Check if user already has a shop
    const existingShop = await Shop.findOne({ ownerId: req.user._id });
    if (existingShop) {
      return res.status(400).json({ success: false, message: 'Owner already has a shop' });
    }

    // Generate slug
    const slug = slugify(shopName, { lower: true, strict: true });

    // Ensure slug is unique
    const slugExists = await Shop.findOne({ slug });
    if (slugExists) {
      return res.status(400).json({ success: false, message: 'Shop name already taken' });
    }

    // Generate dynamic QR URL based on slug
    const qrUrl = `/menu/${slug}`;

    const shop = await Shop.create({
      shopName,
      slug,
      ownerId: req.user._id,
      address,
      qrUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get owner's shop details
// @route   GET /api/shop/my-shop
// @access  Private/Owner
export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.json({
      success: true,
      message: 'Shop fetched successfully',
      data: shop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shop details
// @route   PUT /api/shop/:id
// @access  Private/Owner
export const updateShop = async (req, res) => {
  try {
    const { shopName, address, isActive } = req.body;

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Ensure only the owner can update
    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to update this shop' });
    }

    if (shopName) {
      shop.shopName = shopName;
      const newSlug = slugify(shopName, { lower: true, strict: true });
      
      // If slug changed, ensure it's unique
      if (newSlug !== shop.slug) {
        const slugExists = await Shop.findOne({ slug: newSlug });
        if (slugExists) {
          return res.status(400).json({ success: false, message: 'Shop name already taken' });
        }
        shop.slug = newSlug;
        shop.qrUrl = `/menu/${newSlug}`;
      }
    }

    if (address) shop.address = address;
    if (isActive !== undefined) shop.isActive = isActive;

    const updatedShop = await shop.save();

    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: updatedShop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public shop info by slug
// @route   GET /api/shop/slug/:slug
// @access  Public
export const getShopBySlug = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.json({
      success: true,
      data: {
        _id: shop._id,
        shopName: shop.shopName,
        name: shop.shopName,
        slug: shop.slug,
        qrUrl: shop.qrUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
