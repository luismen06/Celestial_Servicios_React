const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/recetaController');

router.get('/:idModelo', recetaController.obtenerPorModelo);
router.post('/', recetaController.agregarIngrediente);
router.delete('/:id', recetaController.eliminarIngrediente);

module.exports = router;