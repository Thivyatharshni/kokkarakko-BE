import express from 'express';
import {
  createCategory,
  getCategoriesByShopSlug,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.single('image'), createCategory);

router.route('/:slug')
  .get(getCategoriesByShopSlug);

router.route('/:id')
  .put(protect, upload.single('image'), updateCategory)
  .delete(protect, deleteCategory);

export default router;
