import mongoose from 'mongoose';
import Menu from '../models/Menu.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import QRScan from '../models/QRScan.js';
import Shop from '../models/Shop.js';
import ProductView from '../models/ProductView.js';
import { getISTDateRange } from '../utils/timezoneHelper.js';

// @desc    Track product view event
// @route   POST /api/analytics/view
// @access  Public
export const trackProductView = async (req, res) => {
  try {
    const { shopId, productId, sessionId } = req.body;
    if (!shopId || !productId) {
      return res.status(400).json({ success: false, message: 'Shop ID and Product ID are required' });
    }
    
    const sessId = sessionId || `session_${Math.random().toString(36).substr(2, 9)}`;

    // Duplicate Prevention (5 minutes cooldown for same product in same session)
    const cooldownTime = new Date(Date.now() - 5 * 60 * 1000);
    const recentView = await ProductView.findOne({
      sessionId: sessId,
      productId,
      $or: [
        { viewedAt: { $gte: cooldownTime } },
        { createdAt: { $gte: cooldownTime } }
      ]
    });

    if (recentView) {
      return res.status(200).json({ success: true, message: 'Duplicate view ignored (cooldown)', data: recentView });
    }

    const view = await ProductView.create({
      shopId,
      productId,
      sessionId: sessId,
    });
    res.status(201).json({ success: true, data: view });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track multiple product view events in batch
// @route   POST /api/analytics/view/batch
// @access  Public
export const trackProductViewBatch = async (req, res) => {
  try {
    const { shopId, productIds, sessionId } = req.body;
    if (!shopId || !productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: 'Shop ID and productIds array are required' });
    }

    const sessId = sessionId || `session_${Math.random().toString(36).substr(2, 9)}`;
    const cooldownTime = new Date(Date.now() - 5 * 60 * 1000);

    const newViews = [];
    for (const productId of productIds) {
      const recentView = await ProductView.findOne({
        sessionId: sessId,
        productId,
        $or: [
          { viewedAt: { $gte: cooldownTime } },
          { createdAt: { $gte: cooldownTime } }
        ]
      });
      if (!recentView) {
        newViews.push({
          shopId,
          productId,
          sessionId: sessId
        });
      }
    }

    if (newViews.length > 0) {
      await ProductView.insertMany(newViews);
    }

    res.status(201).json({ success: true, message: `${newViews.length} views tracked.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & weekly chart data
// @route   GET /api/analytics/dashboard/:shopId
// @access  Private/Owner
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Concurrently fetch counts and ranges to optimize performance
    const totalProductsPromise = Menu.countDocuments({ shopId });
    const totalCategoriesPromise = Category.countDocuments({ shopId });

    // Today's Orders & Revenue in IST
    const { start: startOfToday, end: endOfToday } = getISTDateRange();
    const todayOrdersQueryPromise = Order.find({
      shopId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const pendingOrdersPromise = Order.countDocuments({ shopId, status: 'Pending' });
    const latestOrderPromise = Order.findOne({ shopId }).sort({ createdAt: -1 }).select('orderNumber');

    // Most Viewed Product from actual ProductView collection
    const mostViewedQueryPromise = ProductView.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Weekly Orders & Revenue Chart Data in IST (single batch query)
    const startOfWeeklyRange = new Date();
    startOfWeeklyRange.setDate(startOfWeeklyRange.getDate() - 6);
    const { start: weeklyStart } = getISTDateRange(startOfWeeklyRange);
    const { end: weeklyEnd } = getISTDateRange(new Date());

    const weeklyOrdersPromise = Order.find({
      shopId,
      createdAt: { $gte: weeklyStart, $lte: weeklyEnd }
    });

    const [
      totalProducts,
      totalCategories,
      todayOrdersQuery,
      pendingOrders,
      latestOrder,
      mostViewedQuery,
      allWeeklyOrders
    ] = await Promise.all([
      totalProductsPromise,
      totalCategoriesPromise,
      todayOrdersQueryPromise,
      pendingOrdersPromise,
      latestOrderPromise,
      mostViewedQueryPromise,
      weeklyOrdersPromise
    ]);

    const todayOrders = todayOrdersQuery.length;
    const completedTodayOrders = todayOrdersQuery.filter(order => order.status === 'Completed');
    const todayRevenue = completedTodayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    let mostViewedProduct = 'N/A';
    let topCategory = 'N/A';

    if (mostViewedQuery.length > 0) {
      const topProd = await Menu.findById(mostViewedQuery[0]._id).populate('category');
      if (topProd) {
        mostViewedProduct = topProd.name;
        if (topProd.category) {
          topCategory = topProd.category.name;
        }
      }
    }

    if (topCategory === 'N/A') {
      const firstCat = await Category.findOne({ shopId });
      if (firstCat) {
        topCategory = firstCat.name;
      }
    }

    const weeklyOrdersChart = [];
    const weeklyRevenueChart = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const { start, end } = getISTDateRange(d);

      // Get day name in IST
      const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
      const istDate = new Date(utcTime + (330 * 60000));
      const dayName = days[istDate.getDay()];

      const dayOrders = allWeeklyOrders.filter(order => {
        const orderTime = new Date(order.createdAt).getTime();
        return orderTime >= start.getTime() && orderTime <= end.getTime();
      });

      const orderCount = dayOrders.length;
      const completedDayOrders = dayOrders.filter(o => o.status === 'Completed');
      const revenue = completedDayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      weeklyOrdersChart.push({ name: dayName, value: orderCount });
      weeklyRevenueChart.push({ name: dayName, value: revenue });
    }

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        todayOrders,
        todayRevenue,
        pendingOrders,
        latestOrder,
        mostViewedProduct,
        topCategory,
        weeklyOrdersChart,
        weeklyRevenueChart
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed shop analytics & QR scans
// @route   GET /api/analytics/:slug
// @access  Private/Owner
export const getShopAnalytics = async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    const shopId = shop._id;

    // Concurrently trigger setup counts and queries to optimize speed
    const totalScansPromise = QRScan.countDocuments({ shopId });

    // Daily scans (Today in IST)
    const { start: dailyStart } = getISTDateRange();
    const dailyScansPromise = QRScan.countDocuments({ shopId, createdAt: { $gte: dailyStart } });

    // Weekly scans (Last 7 days in IST)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const { start: weeklyStart } = getISTDateRange(sevenDaysAgo);
    const weeklyScansPromise = QRScan.countDocuments({ shopId, createdAt: { $gte: weeklyStart } });

    // Monthly scans (Current calendar month in IST)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istNow = new Date(utcTime + (330 * 60000));
    const startOfMonth = new Date(istNow.getFullYear(), istNow.getMonth(), 1, 0, 0, 0, 0);
    const monthlyStart = new Date(startOfMonth.getTime() - (330 * 60000));
    const monthlyScansPromise = QRScan.countDocuments({ shopId, createdAt: { $gte: monthlyStart } });

    // Traffic trend: Fetch all today's scans in a single query
    const todayScansPromise = QRScan.find({ shopId, createdAt: { $gte: dailyStart } }).select('createdAt');

    // Completed orders for products & categories metrics
    const allCompletedOrdersPromise = Order.find({ shopId, status: 'Completed' });

    // Most viewed views
    const mostViewedQueryPromise = ProductView.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Menu category maps for in-memory resolution (prevents N+1 query loops)
    const allProductsPromise = Menu.find({ shopId }).populate('category').select('name category');

    const [
      totalScans,
      dailyScans,
      weeklyScans,
      monthlyScans,
      todayScans,
      allCompletedOrders,
      mostViewedQuery,
      allProducts
    ] = await Promise.all([
      totalScansPromise,
      dailyScansPromise,
      weeklyScansPromise,
      monthlyScansPromise,
      todayScansPromise,
      allCompletedOrdersPromise,
      mostViewedQueryPromise,
      allProductsPromise
    ]);

    // 2. Traffic trend in memory
    const trafficTrend = [];
    for (let hour = 8; hour <= 22; hour += 2) {
      const start = new Date(dailyStart.getTime() + (hour * 60 * 60 * 1000));
      const end = new Date(dailyStart.getTime() + ((hour + 2) * 60 * 60 * 1000) - 1);

      const count = todayScans.filter(scan => {
        const scanTime = new Date(scan.createdAt).getTime();
        return scanTime >= start.getTime() && scanTime <= end.getTime();
      }).length;

      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      trafficTrend.push({ time: timeStr, traffic: count });
    }

    // 3. Most ordered products in memory
    const itemCounts = {};
    allCompletedOrders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    const mostOrdered = Object.entries(itemCounts)
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    // 4. Most viewed products using in-memory product mapping (1 query instead of 10)
    const productMap = new Map(allProducts.map(p => [p._id.toString(), p.name]));
    const mostViewed = mostViewedQuery.map(item => ({
      name: productMap.get(item._id.toString()) || 'Unknown Product',
      views: item.count
    }));

    // 5. Peak traffic hour
    let peakHour = '20:00 (8 PM)';
    let maxTraffic = -1;
    trafficTrend.forEach(t => {
      if (t.traffic > maxTraffic) {
        maxTraffic = t.traffic;
        peakHour = `${t.time} (${t.time.startsWith('12') ? '12 PM' : parseInt(t.time) > 12 ? (parseInt(t.time) - 12) + ' PM' : parseInt(t.time) + ' AM'})`;
      }
    });

    // 6. Category Performance using in-memory category mapping (prevents hundreds of queries)
    const productCategoryMap = new Map(
      allProducts.map(p => [p.name, p.category ? p.category.name : null])
    );

    const categoryPerformanceMap = {};
    allCompletedOrders.forEach(order => {
      order.items.forEach(item => {
        const catName = productCategoryMap.get(item.name);
        if (catName) {
          categoryPerformanceMap[catName] = (categoryPerformanceMap[catName] || 0) + item.quantity;
        }
      });
    });

    const categoryPerformance = Object.entries(categoryPerformanceMap).map(([name, value]) => ({
      name,
      value
    }));

    if (categoryPerformance.length === 0) {
      const categories = await Category.find({ shopId });
      categories.forEach(cat => {
        categoryPerformance.push({ name: cat.name, value: 0 });
      });
    }

    // 7. Scan Source Analytics
    const scanSourcesQuery = await QRScan.aggregate([
      { $match: { shopId } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const scanSource = scanSourcesQuery.map(item => ({
      name: item._id === 'QR' ? 'QR Code' : item._id === 'Direct' ? 'Direct Link' : item._id,
      value: item.count
    }));

    res.json({
      success: true,
      data: {
        metrics: {
          dailyScans,
          weeklyScans,
          monthlyScans,
          peakHour
        },
        charts: {
          mostOrdered,
          mostViewed,
          trafficTrend,
          categoryPerformance,
          scanSource
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
