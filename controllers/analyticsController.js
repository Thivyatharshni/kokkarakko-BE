import Menu from '../models/Menu.js';
import Order from '../models/Order.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Total Products
    const totalProducts = await Menu.countDocuments({ shopId });

    // Total Categories
    const menus = await Menu.find({ shopId }).select('category name');
    const categories = new Set(menus.map((m) => m.category));
    const totalCategories = categories.size;

    // Today's Orders & Revenue
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrdersQuery = await Order.find({
      shopId,
      createdAt: { $gte: startOfToday },
    });

    const todayOrders = todayOrdersQuery.length;
    const todayRevenue = todayOrdersQuery.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get Top Category and Most Ordered Product from orders to make it realistic
    const categoryCounts = {};
    const itemCounts = {};

    // For better analytics, we would look at historical orders
    const allOrders = await Order.find({ shopId }).populate('items.menuId');
    allOrders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    // Simple top items
    let mostViewedProduct = 'N/A';
    let maxItemCount = 0;
    for (const [name, count] of Object.entries(itemCounts)) {
      if (count > maxItemCount) {
        maxItemCount = count;
        mostViewedProduct = name;
      }
    }

    let topCategory = 'N/A';
    if (categories.size > 0) {
      topCategory = Array.from(categories)[0]; // fallback
    }

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        todayOrders,
        todayRevenue,
        mostViewedProduct,
        topCategory,
        chartData: [],
        orderStats: []
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShopAnalytics = async (req, res) => {
  try {
     res.json({ success: true, data: {} });
  } catch (error) {
     res.status(500).json({ success: false, message: error.message });
  }
};
