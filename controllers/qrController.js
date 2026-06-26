import QRScan from '../models/QRScan.js';

// @desc    Track QR Scan
// @route   POST /api/qr/scan
// @access  Public
export const trackScan = async (req, res) => {
  try {
    const { shopId, source } = req.body;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop ID is required' });
    }

    const scan = await QRScan.create({
      shopId,
      source: source || 'QR',
    });

    res.status(201).json({
      success: true,
      message: 'QR scan tracked successfully',
      data: scan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get QR scan analytics
// @route   GET /api/qr/analytics/:shopId
// @access  Private/Owner
export const getQRAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Total Scans
    const totalScans = await QRScan.countDocuments({ shopId });

    // Scans in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: oneDayAgo } });

    // Scans in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScans = await QRScan.countDocuments({ shopId, createdAt: { $gte: sevenDaysAgo } });

    // Last scanned time
    const lastScan = await QRScan.findOne({ shopId }).sort({ createdAt: -1 });
    const lastScannedAt = lastScan ? lastScan.createdAt : null;

    // Scans per day (last 7 days)
    const scansPerDay = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await QRScan.countDocuments({
        shopId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      scansPerDay.push({
        date: days[startOfDay.getDay()],
        scans: count,
      });
    }

    res.json({
      success: true,
      message: 'QR analytics fetched successfully',
      data: {
        totalScans,
        dailyScans,
        weeklyScans,
        lastScannedAt,
        scansPerDay,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
