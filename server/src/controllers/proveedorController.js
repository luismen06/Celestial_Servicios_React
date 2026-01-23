const { Proveedor } = require('../models/asociaciones');

// Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll();
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo proveedor (ESTA ES LA FUNCIÓN QUE FALTABA)
const crearProveedor = async (req, res) => {
    try {
        // req.body contiene los datos enviados desde Postman o el Frontend
        const nuevoProveedor = await Proveedor.create(req.body); 
        res.status(201).json(nuevoProveedor); // Devuelve el proveedor creado con código 201
    } catch (error) {
        // Manejo de errores (ej. campos obligatorios faltantes)
        res.status(400).json({ error: error.message });
    }
};

// Exportamos ambas funciones
module.exports = { 
    obtenerProveedores,
    crearProveedor 
};