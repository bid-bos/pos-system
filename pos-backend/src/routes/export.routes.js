const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.get('/pdf', exportController.exportPDF);
router.get('/excel', exportController.exportExcel);

module.exports = router;
