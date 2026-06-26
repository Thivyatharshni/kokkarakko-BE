import express from 'express';
import { check } from 'express-validator';
import { getCategoriesBySlug, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/:slug', getCategoriesBySlug);

router.post(
  '/',
  protect,
  upload.single('image'),
  [
    check('name', 'Name is required').not().isEmpty(),
  ],
  validateRequest,
  createCategory
);

router.put(
  '/:id',
  protect,
  upload.single('image'),
  updateCategory
);

router.delete('/:id', protect, deleteCategory);

export default router;
