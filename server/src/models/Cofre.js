const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cofre = sequelize.define('Cofre', {
    id_cofre: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_modelo: { type: DataTypes.INTEGER },
    id_etapa_actual: { type: DataTypes.INTEGER },
    
    // --- IMPORTANTE: AQUÍ NO DEBE HABER NINGÚN 'id_trabajador_actual' ---
    
    fecha_comienzo: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_finalizado: { type: DataTypes.DATE },
    estado: { type: DataTypes.STRING } 
}, {
    tableName: 'cofres',
    timestamps: false
});

module.exports = Cofre;