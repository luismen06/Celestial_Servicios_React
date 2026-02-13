const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MateriaPrima = sequelize.define('MateriaPrima', {
    id_materia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    unidad_base: { type: DataTypes.STRING, allowNull: false },
    presentacion_compra: { type: DataTypes.STRING },
    contenido_por_presentacion: { type: DataTypes.FLOAT, defaultValue: 1 },
    nivel_minimo_base: { type: DataTypes.FLOAT, defaultValue: 0 },
    
    cantidad_total_base: { 
        type: DataTypes.FLOAT, 
        defaultValue: 0,
        // --- AGREGAR ESTA VALIDACIÓN ---
        validate: {
            min: 0 // ¡Esto impide números negativos!
        }
    }
}, {
    tableName: 'materias_primas',
    timestamps: false
});

module.exports = MateriaPrima;