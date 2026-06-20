import express from 'express';
import { getShopAnalytics, getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/dashboard/:shopId')
  .get(protect, getDashboardAnalytics);

router.route('/:slug')
  .get(protect, getShopAnalytics);

export default router;
