const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');

// Terapkan middleware auth untuk semua route kategori
router.use(authenticateToken);

// Semua role yang sudah login bisa melihat kategori
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Hanya ADMIN yang bisa menambah, mengedit, dan menghapus kategori
router.post('/', authorizeRole(['ADMIN']), categoryController.createCategory);
router.put('/:id', authorizeRole(['ADMIN']), categoryController.updateCategory);
router.delete('/:id', authorizeRole(['ADMIN']), categoryController.deleteCategory);

module.exports = router;
