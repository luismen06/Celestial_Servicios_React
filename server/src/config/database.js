// server/src/config/database.js
require('dotenv').config(); // <--- Carga las variables del archivo .env
const { Sequelize } = require('sequelize');

// Detectamos si estamos en producción (Railway) para activar SSL
const useSSL = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
    process.env.DB_NAME || 'celestial_db', // Nombre BD
    process.env.DB_USER || 'root',         // Usuario
    process.env.DB_PASS || '',             // Contraseña
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: false,
        dialectOptions: useSSL ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {} // En local no usamos SSL
    }
);

module.exports = sequelize;