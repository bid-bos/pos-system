const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');

// Terapkan middleware auth untuk semua route produk
router.use(authenticateToken);

// Semua role (termasuk KASIR) bisa melihat produk
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Hanya ADMIN yang bisa menambah, mengubah, dan menghapus produk
router.post('/', authorizeRole(['ADMIN']), productController.createProduct);
router.put('/:id', authorizeRole(['ADMIN']), productController.updateProduct);
router.delete('/:id', authorizeRole(['ADMIN']), productController.deleteProduct);

module.exports = router;
