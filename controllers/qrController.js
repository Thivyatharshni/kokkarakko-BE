import QRScan from '../models/QRScan.js';
import Shop from '../models/Shop.js';

// @desc    Track QR scan
// @route   POST /api/qr/scan
// @access  Public
export const trackQRScan = async (req, res) => {
  try {
    const { shopId, source } = req.body;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const scan = await QRScan.create({
      shopId,
      source: source || 'QR',
    });

    res.status(201).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQRAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;

    const totalScans = await QRScan.countDocuments({ shopId });
    const lastScan = await QRScan.findOne({ shopId }).sort({ createdAt: -1 });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailyScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: oneDayAgo } });
    const weeklyScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: sevenDaysAgo } });

    // scansPerDay for last 7 days
    const scansPerDay = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const dayScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: start, $lte: end } });
      scansPerDay.push({ date: days[d.getDay()], scans: dayScans });
    }

    res.json({
      success: true,
      data: {
        totalScans,
        dailyScans,
        weeklyScans,
        lastScannedAt: lastScan ? lastScan.createdAt : null,
        scansPerDay,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
