const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
    // Configuración para Producción (Internet)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres', // O 'mysql' dependiendo de lo que uses en la nube
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
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