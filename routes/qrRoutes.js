import express from 'express';
import { trackScan, getQRAnalytics } from '../controllers/qrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/scan', trackScan);
router.get('/analytics/:shopId', protect, getQRAnalytics);

export default router;
