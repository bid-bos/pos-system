const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route: Dapatkan info user yang sedang login
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
