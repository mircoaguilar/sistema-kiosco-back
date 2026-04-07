const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');
const verificarToken = require('../middlewares/auth.middleware'); 

router.post('/', verificarToken, ventasController.crearVenta);

module.exports = router;