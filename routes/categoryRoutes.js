import express from 'express';
import { getCategoriesBySlug, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/:slug', getCategoriesBySlug);
router.post('/', protect, upload.single('image'), createCategory);
router.put('/:id', protect, upload.single('image'), updateCategory);
router.delete('/:id', protect, deleteCategory);

export default router;
