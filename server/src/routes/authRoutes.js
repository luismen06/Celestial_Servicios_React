const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ruta pública
router.post('/login', authController.login);

// Ruta protegida
router.get('/verificar', authMiddleware, authController.verificarSesion);

module.exports = router;
