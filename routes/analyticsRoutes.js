import express from 'express';
import { getDashboardAnalytics, getShopAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard/:shopId', getDashboardAnalytics);
router.get('/:slug', getShopAnalytics);

export default router;
