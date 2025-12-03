const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trabajador = sequelize.define('Trabajador', {
    id_trabajador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true } // TINYINT(1) se traduce a Boolean
}, {
    tableName: 'trabajadores',
    timestamps: false
});

module.exports = Trabajador;