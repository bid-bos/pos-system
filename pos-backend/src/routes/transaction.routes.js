const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Terapkan middleware auth untuk semua route transaksi
router.use(authenticateToken);

// Kasir & Admin bisa memproses checkout transaksi
router.post('/checkout', transactionController.createTransaction);

// Kasir & Admin bisa melihat riwayat transaksi
router.get('/', transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
