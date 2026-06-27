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

// @desc    Get QR analytics
// @route   GET /api/qr/analytics/:shopId
// @access  Private/Owner
export const getQRAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;

    const totalScans = await QRScan.countDocuments({ shopId });
    const lastScan = await QRScan.findOne({ shopId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        totalScans,
        lastScannedAt: lastScan ? lastScan.createdAt : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
