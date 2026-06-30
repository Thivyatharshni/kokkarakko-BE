import Order from '../models/Order.js';
import Shop from '../models/Shop.js';
import Menu from '../models/Menu.js';
import { getIo } from '../sockets/index.js';
import { getISTDateRange } from '../utils/timezoneHelper.js';

// Generate Order Number Utility (e.g., KKR-1001)
const generateOrderNumber = async (shopId) => {
  const count = await Order.countDocuments({ shopId });
  const paddedCount = String(count + 1).padStart(4, '0');
  return `KKR-${paddedCount}`;
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public (Customer)
export const createOrder = async (req, res) => {
  try {
    const { shopId, customerName, customerMobile, items, totalAmount } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Backend Validation for Customer Name
    const trimmedName = (customerName || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }
    if (trimmedName.length < 3) {
      return res.status(400).json({ success: false, message: 'Name must be at least 3 characters.' });
    }
    if (trimmedName.length > 50) {
      return res.status(400).json({ success: false, message: 'Name must be at most 50 characters.' });
    }
    const lettersAndSpaces = /^[a-zA-Z\s]+$/;
    if (!lettersAndSpaces.test(trimmedName)) {
      return res.status(400).json({ success: false, message: 'Name must contain only letters and spaces.' });
    }

    // Backend Validation for Customer Mobile
    const cleanedMobile = (customerMobile || '').trim();
    if (!cleanedMobile) {
      return res.status(400).json({ success: false, message: 'Please enter your mobile number.' });
    }
    const digitsOnly = /^\d+$/;
    if (!digitsOnly.test(cleanedMobile)) {
      return res.status(400).json({ success: false, message: 'Only numbers are allowed.' });
    }
    if (cleanedMobile.length !== 10) {
      return res.status(400).json({ success: false, message: 'Mobile number must contain exactly 10 digits.' });
    }

    // Validate stock for all items first
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array must not be empty' });
    }

    const menuItemsToUpdate = [];
    for (const item of items) {
      const menuItem = await Menu.findById(item.menuId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item '${item.name}' not found` });
      }
      if (menuItem.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${menuItem.quantity} items of ${menuItem.name} are available. Please reduce the quantity.`
        });
      }
      menuItemsToUpdate.push({ menuItem, quantityToReduce: item.quantity });
    }

    // Reduce stock and save
    for (const update of menuItemsToUpdate) {
      update.menuItem.quantity -= update.quantityToReduce;
      if (update.menuItem.quantity === 0) {
        update.menuItem.status = 'Out Of Stock';
      }
      await update.menuItem.save();
    }

    const orderNumber = await generateOrderNumber(shopId);

    const order = await Order.create({
      orderNumber,
      shopId,
      customerName: trimmedName,
      customerMobile: cleanedMobile,
      items,
      totalAmount,
    });

    // Emit socket event to the shop owner's room
    const io = getIo();
    io.to(shopId.toString()).emit('new-order', order);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get live orders (Pending, Preparing, Ready) for a shop
// @route   GET /api/orders/live/:shopId
// @access  Private/Owner
export const getLiveOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, ownerId: req.user._id });
    
    if (!shop) {
      return res.status(401).json({ success: false, message: 'User not authorized to view these orders' });
    }

    const { start: startOfToday, end: endOfToday } = getISTDateRange();

    const orders = await Order.find({
      shopId: req.params.shopId,
      status: { $in: ['Pending', 'Preparing', 'Ready'] },
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Live orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get historical orders (Completed) for a shop
// @route   GET /api/orders/history/:shopId
// @access  Private/Owner
export const getHistoryOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, ownerId: req.user._id });
    
    if (!shop) {
      return res.status(401).json({ success: false, message: 'User not authorized to view these orders' });
    }

    const { fromDate, toDate } = req.query;
    const query = {
      shopId: req.params.shopId,
      status: 'Completed'
    };

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const { start } = getISTDateRange(fromDate);
        query.createdAt.$gte = start;
      }
      if (toDate) {
        const { end } = getISTDateRange(toDate);
        query.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Order history fetched successfully',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders for a shop
// @route   GET /api/orders/shop/:shopId
// @access  Private/Owner
export const getShopOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(401).json({ success: false, message: 'User not authorized to view these orders' });
    }

    const orders = await Order.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Shop orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Owner
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ _id: order.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(401).json({ success: false, message: 'User not authorized to update this order' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    // Emit socket event to notify customers
    const io = getIo();
    io.emit('order-status-updated', updatedOrder);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
