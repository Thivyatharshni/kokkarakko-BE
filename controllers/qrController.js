import QRScan from '../models/QRScan.js';
import Shop from '../models/Shop.js';
import mongoose from 'mongoose';

// @desc    Track a new QR scan
// @route   POST /api/qr/scan
// @access  Public
export const trackQRScan = async (req, res) => {
  try {
    const { shopId, source = 'QR', sessionId } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, message: 'shopId is required' });
    }

    // Generate a simple fallback session ID if none provided
    const scanSession = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await QRScan.create({
      shopId,
      sessionId: scanSession,
      source,
      scannedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Scan tracked successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get QR analytics for dashboard
// @route   GET /api/qr/analytics/:shopId
// @access  Private/Owner
export const getQRAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Verify shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // JS dates for the start of the week (assuming Monday start)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    // 1. Total Scans
    const totalScans = await QRScan.countDocuments({ shopId });

    if (totalScans === 0) {
      return res.json({
        success: true,
        data: {
          totalScans: 0,
          dailyScans: 0,
          weeklyScans: 0,
          lastScannedAt: null,
          scansPerDay: []
        }
      });
    }

    // 2. Daily Scans
    const dailyScans = await QRScan.countDocuments({
      shopId,
      scannedAt: { $gte: startOfToday }
    });

    // 3. Weekly Scans
    const weeklyScans = await QRScan.countDocuments({
      shopId,
      scannedAt: { $gte: startOfWeek }
    });

    // 4. Last Scanned At
    const lastScan = await QRScan.findOne({ shopId }).sort({ scannedAt: -1 });
    const lastScannedAt = lastScan ? lastScan.scannedAt : null;

    // 5. Scans Per Day (Last 7 days via Aggregation)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const aggregationResult = await QRScan.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          scannedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
          scans: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for Recharts
    const scansPerDay = aggregationResult.map(item => ({
      date: item._id,
      scans: item.scans
    }));

    res.json({
      success: true,
      data: {
        totalScans,
        dailyScans,
        weeklyScans,
        lastScannedAt,
        scansPerDay
      }
    });
  } catch (error) {
    // Return empty state rather than 500 for safety per requirements
    res.json({
      success: true,
      data: {
        totalScans: 0,
        dailyScans: 0,
        weeklyScans: 0,
        lastScannedAt: null,
        scansPerDay: []
      }
    });
  }
};
