const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialProduccion = sequelize.define('HistorialProduccion', {
    id_historial: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cofre: { type: DataTypes.INTEGER, allowNull: false },
    id_etapa: { type: DataTypes.INTEGER, allowNull: false },
    id_trabajador: { type: DataTypes.INTEGER, allowNull: false },
    fecha_cambio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'historial_produccion',
    timestamps: false
});

module.exports = HistorialProduccion;