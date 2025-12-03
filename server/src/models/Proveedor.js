const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
    id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    direccion: { type: DataTypes.STRING },
    telefono: { type: DataTypes.STRING }
}, {
    tableName: 'proveedores',
    timestamps: false
});

module.exports = Proveedor;