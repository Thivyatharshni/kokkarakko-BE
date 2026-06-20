import express from 'express';
import { trackQRScan, getQRAnalytics } from '../controllers/qrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/scan')
  .post(trackQRScan);

router.route('/analytics/:shopId')
  .get(protect, getQRAnalytics);

export default router;
