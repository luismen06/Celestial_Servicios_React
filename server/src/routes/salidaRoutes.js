const express = require('express');
const router = express.Router();
const salidaController = require('../controllers/salidaController');

router.get('/', salidaController.obtenerSalidas);
router.post('/', salidaController.registrarSalida);

module.exports = router;