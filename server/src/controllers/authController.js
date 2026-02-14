/**
 * authController.js
 * 
 * Maneja login y verificación de sesión con JWT.
 * Las contraseñas se hashean con bcrypt.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// TODO: mover a variable de entorno en producción
const JWT_SECRET = process.env.JWT_SECRET || 'celestial_servicios_secret_key_dev';

const authController = {
    /**
     * POST /api/auth/login
     * Valida credenciales y retorna un JWT con expiración de 24h.
     */
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
            }

            const usuario = await Usuario.findOne({ where: { username } });
            if (!usuario) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Comparar la contraseña contra el hash almacenado
            const passwordValido = await bcrypt.compare(password, usuario.password);
            if (!passwordValido) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Token válido por 24 horas
            const token = jwt.sign(
                { id: usuario.id, username: usuario.username },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login exitoso',
                token,
                usuario: { id: usuario.id, username: usuario.username }
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    /**
     * GET /api/auth/verificar
     * Verifica que el token JWT sea válido. El middleware ya decodificó
     * el token y lo puso en req.usuario.
     */
    verificarSesion: async (req, res) => {
        try {
            res.json({
                autenticado: true,
                usuario: req.usuario
            });
        } catch (error) {
            res.status(500).json({ error: 'Error verificando sesión' });
        }
    }
};

module.exports = authController;
