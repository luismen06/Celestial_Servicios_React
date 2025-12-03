const express = require('express');
const router = express.Router();

// 1. Importamos el controlador y le ponemos el nombre "inventarioController"
const inventarioController = require('../controllers/inventarioController');

// 2. Usamos "inventarioController" en todas las líneas (ni "controller", ni otra cosa)
router.get('/', inventarioController.obtenerTodo);
router.post('/', inventarioController.crearMateria);
router.post('/verificar', inventarioController.verificarStock);

module.exports = router;