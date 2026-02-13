const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Ajusta la ruta según tu estructura real

const Proveedor = sequelize.define('Proveedor', {
    id_proveedor: { // O id_proveedor, según como lo tengas
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false, // ¡Esto impide valores nulos!
        validate: {
            notEmpty: { msg: "El nombre del proveedor no puede estar vacío" } // ¡Esto impide cadenas vacías ""!
        }
    },
    
    direccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
}, {
    tableName: 'proveedores',
    timestamps: false 
});

module.exports = Proveedor;