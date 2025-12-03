// Archivo: src/config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('celestial_db', 'root', 'Luismen5604@', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: console.log
});

module.exports = sequelize;