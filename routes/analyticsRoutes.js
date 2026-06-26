import express from 'express';
import { getDashboardAnalytics, getShopAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard/:shopId', protect, getDashboardAnalytics);
router.get('/:slug', getShopAnalytics);

export default router;
