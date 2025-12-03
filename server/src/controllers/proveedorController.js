const { Proveedor } = require('../models/asociaciones');

const obtenerProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll();
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerProveedores };