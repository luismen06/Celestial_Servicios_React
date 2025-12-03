const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Etapa = sequelize.define('Etapa', {
    id_etapa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'etapas',
    timestamps: false
});

module.exports = Etapa;