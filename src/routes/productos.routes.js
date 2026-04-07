const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const verificarToken = require('../middlewares/auth.middleware');

router.get('/', productosController.obtenerTodos);
router.get('/:codigo', productosController.obtenerPorCodigo);

router.post('/', verificarToken, productosController.crear);
router.put('/:id', verificarToken, productosController.actualizar);
router.delete('/:id', verificarToken, productosController.eliminar);

module.exports = router;