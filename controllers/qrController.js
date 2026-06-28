import QRScan from '../models/QRScan.js';
import Shop from '../models/Shop.js';
import { getISTDateRange } from '../utils/timezoneHelper.js';

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

    // Daily scans in IST (Today IST)
    const { start: dailyStart } = getISTDateRange();
    const dailyScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: dailyStart } });

    // Weekly scans in IST (Last 7 days in IST)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const { start: weeklyStart } = getISTDateRange(sevenDaysAgo);
    const weeklyScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: weeklyStart } });

    // scansPerDay for last 7 days in IST
    const scansPerDay = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const { start, end } = getISTDateRange(d);

      const dayScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: start, $lte: end } });
      
      // Day name in IST
      const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
      const istDate = new Date(utcTime + (330 * 60000));
      
      scansPerDay.push({ date: days[istDate.getDay()], scans: dayScans });
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
