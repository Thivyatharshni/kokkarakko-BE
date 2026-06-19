import express from 'express';
import { check } from 'express-validator';
import { createShop, getMyShop, updateShop, getShopBySlug } from '../controllers/shopController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  [
    check('shopName', 'Shop name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
  ],
  validateRequest,
  createShop
);

router.get('/my-shop', protect, getMyShop);
router.get('/slug/:slug', getShopBySlug);

router.put(
  '/:id',
  protect,
  updateShop
);

export default router;
