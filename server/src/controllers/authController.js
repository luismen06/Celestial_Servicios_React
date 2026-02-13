const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'celestial_servicios_secret_key_dev';

const authController = {
    // POST /api/auth/login
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
            }

            // Buscar usuario
            const usuario = await Usuario.findOne({ where: { username } });
            if (!usuario) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Comparar contraseña
            const passwordValido = await bcrypt.compare(password, usuario.password);
            if (!passwordValido) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Generar token JWT (expira en 24 horas)
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

    // GET /api/auth/verificar
    verificarSesion: async (req, res) => {
        try {
            // req.usuario viene del middleware de autenticación
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
