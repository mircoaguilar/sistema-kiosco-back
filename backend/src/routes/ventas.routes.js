const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { verificarCajaAbierta } = require('../middlewares/caja.middleware');
const ventasController = require('../controllers/ventas.controller');

router.post('/', verificarToken, verificarCajaAbierta, ventasController.crearVenta);

router.get('/reimprimir', verificarToken, ventasController.reimprimirUltimo);

router.get('/historial', verificarToken, ventasController.historialVentas);

router.get('/:id', verificarToken, ventasController.detalleVenta);

router.put('/:id/corregir', verificarToken, verificarCajaAbierta, ventasController.corregirVenta);

router.put('/:id/anular', verificarToken, ventasController.anularVenta);

module.exports = router;