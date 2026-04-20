const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { verificarCajaAbierta } = require('../middlewares/caja.middleware');
const ventasController = require('../controllers/ventas.controller');

router.post('/', verificarToken, verificarCajaAbierta, ventasController.crearVenta);
router.get('/reimprimir', verificarToken, ventasController.reimprimirUltimo);

module.exports = router;