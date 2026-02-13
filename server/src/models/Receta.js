const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receta = sequelize.define('Receta', {
    id_receta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_modelo: { type: DataTypes.INTEGER },
    id_materia: { type: DataTypes.INTEGER },
    cantidad_estimada: { type: DataTypes.DECIMAL(10, 2) }
}, {
    tableName: 'recetas_cofre',
    timestamps: false
});

module.exports = Receta;