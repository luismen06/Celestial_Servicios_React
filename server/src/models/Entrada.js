const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Entrada = sequelize.define('Entrada', {
    id_entrada: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Las FK se definen automáticas en las relaciones, pero es buena práctica declararlas si ya existen en BD
    id_materia: { type: DataTypes.INTEGER },
    id_proveedor: { type: DataTypes.INTEGER },
    
    cantidad_presentacion_comprada: { type: DataTypes.INTEGER },
    cantidad_base_total: { type: DataTypes.DECIMAL(12, 2) },
    stock_restante_lote: { type: DataTypes.DECIMAL(12, 2) }, // Veo esto en tu diagrama, útil para PEPS/UEPS
    costo_total_compra: { type: DataTypes.DECIMAL(10, 2) },
    costo_unitario: { type: DataTypes.DECIMAL(10, 2) },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'entradas',
    timestamps: false
});

module.exports = Entrada;