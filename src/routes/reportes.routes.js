const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');

router.get('/categorias', reportesController.reporteDiarioPorCategoria);

module.exports = router;