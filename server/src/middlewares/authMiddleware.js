/**
 * authMiddleware.js
 * 
 * Middleware que protege las rutas de la API verificando
 * el token JWT del header Authorization.
 * Se aplica globalmente a /api/* excepto /api/auth/login.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'celestial_servicios_secret_key_dev';

const authMiddleware = (req, res, next) => {
    // La ruta de login es pública, no necesita token
    if (req.path === '/auth/login') {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Extraer el token del header "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Adjuntar los datos del usuario al request para usarlos en los controllers
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = authMiddleware;
