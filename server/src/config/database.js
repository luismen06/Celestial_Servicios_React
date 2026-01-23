const { Sequelize } = require('sequelize');
require('dotenv').config(); // Aseguramos cargar las variables de entorno

let sequelize;

if (process.env.DATABASE_URL) {
    // Configuración para Producción (Render / Internet)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres', // <--- ESTO ES CRÍTICO
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necesario para conexiones externas en Render
            }
        },
        logging: false
    });
} else {
    // Configuración para Desarrollo (Tu PC)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: false
    });
}

module.exports = sequelize;