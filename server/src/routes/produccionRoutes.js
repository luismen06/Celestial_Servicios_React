const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionController');

router.get('/', produccionController.obtenerProduccion);
router.post('/', produccionController.iniciarProduccion);
router.post('/avanzar', produccionController.avanzarEtapa); // Ojo: en tu HTML usas /api/avanzar, pero aquí será /api/produccion/avanzar. Ver nota abajo.
router.post('/finalizar', produccionController.finalizarProduccion);

module.exports = router;