const express = require('express');
const router = express.Router();
const entradaController = require('../controllers/entradaController');

// Definimos los endpoints
router.get('/', entradaController.obtenerEntradas);
router.post('/', entradaController.registrarEntrada);

module.exports = router;