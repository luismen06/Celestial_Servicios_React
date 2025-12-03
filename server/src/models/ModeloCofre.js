const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModeloCofre = sequelize.define('ModeloCofre', {
    id_modelo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'modelo_cofres',
    timestamps: false
});

module.exports = ModeloCofre;