import express from 'express';
import { getDashboardAnalytics, getShopAnalytics, trackProductView, trackProductViewBatch } from '../controllers/analyticsController.js';
import { viewRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/dashboard/:shopId', getDashboardAnalytics);
router.get('/:slug', getShopAnalytics);
router.post('/view', viewRateLimiter, trackProductView);
router.post('/view/batch', viewRateLimiter, trackProductViewBatch);

export default router;
