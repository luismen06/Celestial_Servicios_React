/**
 * helpers.js - Utilidades compartidas para los tests
 * 
 * Funciones auxiliares para generar tokens JWT de prueba
 * y headers de autenticación.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'celestial_servicios_secret_key_dev';

/**
 * Genera un token JWT válido para usar en los tests.
 * Simula un usuario autenticado sin necesidad de hacer login.
 */
const generarToken = (payload = { id: 1, username: 'testuser' }) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Retorna los headers necesarios para peticiones autenticadas.
 * Uso: .set(authHeaders())
 */
const authHeaders = () => ({
    Authorization: `Bearer ${generarToken()}`
});

module.exports = { generarToken, authHeaders };
