const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Terapkan middleware auth
router.use(authenticateToken);

// Mengambil statistik dashboard
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
