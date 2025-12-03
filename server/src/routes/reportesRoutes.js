const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// 1. Reporte Individual (Ya lo tenías)
router.get('/orden/:idCofre', reportesController.generarReporteCofre);

// 2. Reportes Generales (ESTOS SON LOS QUE FALTABAN)
//router.get('/inventario', reportesController.generarReporteInventario);
router.get('/consumo', reportesController.generarReporteConsumo);
router.get('/financiero', reportesController.generarReporteFinanciero);

module.exports = router;