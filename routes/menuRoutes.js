import express from 'express';
import { check } from 'express-validator';
import { createMenuItem, getMenuByShopId, updateMenuItem, deleteMenuItem, getFeaturedMenuBySlug } from '../controllers/menuController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  upload.single('image'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('price', 'Price must be a valid number').isNumeric(),
  ],
  validateRequest,
  createMenuItem
);

router.get('/featured/:slug', getFeaturedMenuBySlug);

router.get('/:slug', getMenuByShopId);

router.put(
  '/:id',
  protect,
  upload.single('image'),
  updateMenuItem
);

router.delete('/:id', protect, deleteMenuItem);

export default router;
