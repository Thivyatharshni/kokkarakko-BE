import Order from '../models/Order.js';
import Shop from '../models/Shop.js';
import { getIo } from '../sockets/index.js';

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

    const orderNumber = await generateOrderNumber(shopId);

    const order = await Order.create({
      orderNumber,
      shopId,
      customerName,
      customerMobile,
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

// @desc    Get live orders (today's orders) for a shop
// @route   GET /api/orders/live/:shopId
// @access  Private/Owner
export const getLiveOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, ownerId: req.user._id });
    
    if (!shop) {
      return res.status(401).json({ success: false, message: 'User not authorized to view these orders' });
    }

    // Calculate today's date bounds in IST (Asia/Kolkata)
    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    // Set to 00:00:00 IST
    const startOfDayIst = new Date(istTime);
    startOfDayIst.setUTCHours(0, 0, 0, 0);
    const startOfDayUtc = new Date(startOfDayIst.getTime() - istOffset);

    // Set to 23:59:59.999 IST
    const endOfDayIst = new Date(istTime);
    endOfDayIst.setUTCHours(23, 59, 59, 999);
    const endOfDayUtc = new Date(endOfDayIst.getTime() - istOffset);

    const orders = await Order.find({ 
      shopId: req.params.shopId,
      createdAt: { $gte: startOfDayUtc, $lte: endOfDayUtc }
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

// @desc    Get historical orders for a shop
// @route   GET /api/orders/history/:shopId
// @access  Private/Owner
export const getHistoryOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, ownerId: req.user._id });
    
    if (!shop) {
      return res.status(401).json({ success: false, message: 'User not authorized to view these orders' });
    }

    const { fromDate, toDate } = req.query;
    
    let query = { 
      shopId: req.params.shopId,
      status: 'Completed' // Historical orders generally mean completed
    };

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Set end of day for the toDate
        const toDateObj = new Date(toDate);
        toDateObj.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = toDateObj;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Historical orders fetched successfully',
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
