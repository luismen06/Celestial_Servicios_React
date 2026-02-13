const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Salida = sequelize.define('Salida', {
    id_salida: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_materia: { type: DataTypes.INTEGER },
    id_cofre: { type: DataTypes.INTEGER },
    cantidad_base_usada: { type: DataTypes.DECIMAL(12, 2) },
    
    // --- ESTA COLUMNA ES VITAL PARA PEPS ---
    costo_calculado: { type: DataTypes.DECIMAL(10, 2) }, 
    // ---------------------------------------

    tipo_salida: { type: DataTypes.STRING },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'salidas',
    timestamps: false
});

module.exports = Salida;