import express from 'express';
import { check } from 'express-validator';
import { createOrder, getShopOrders, updateOrderStatus, getLiveOrders, getHistoryOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post(
  '/',
  [
    check('shopId', 'Shop ID is required').not().isEmpty(),
    check('customerName', 'Customer name is required').not().isEmpty(),
    check('customerMobile', 'Customer mobile is required').not().isEmpty(),
    check('items', 'Items array must not be empty').isArray({ min: 1 }),
    check('totalAmount', 'Total amount is required').isNumeric(),
  ],
  validateRequest,
  createOrder
);

router.get('/live/:shopId', protect, getLiveOrders);
router.get('/history/:shopId', protect, getHistoryOrders);
router.get('/shop/:shopId', protect, getShopOrders);


router.put(
  '/:id/status',
  protect,
  [
    check('status', 'Status is required').not().isEmpty(),
    check('status', 'Invalid status').isIn(['Pending', 'Preparing', 'Ready', 'Completed']),
  ],
  validateRequest,
  updateOrderStatus
);

export default router;
