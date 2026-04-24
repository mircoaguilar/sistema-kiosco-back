const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');

router.get('/productos-dia', reportesController.reporteProductosDia);
router.get('/top-productos', reportesController.topProductos);

module.exports = router;