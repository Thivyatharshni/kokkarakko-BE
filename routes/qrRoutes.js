import express from 'express';
import { trackQRScan, getQRAnalytics } from '../controllers/qrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/scan', trackQRScan);
router.get('/analytics/:shopId', protect, getQRAnalytics);

export default router;
