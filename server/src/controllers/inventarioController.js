const { MateriaPrima } = require('../models/asociaciones');

// Función para obtener todo
const obtenerTodo = async (req, res) => {
    try {
        const lista = await MateriaPrima.findAll();
        res.json(lista);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Función para crear
const crearMateria = async (req, res) => {
    try {
        const nuevo = await MateriaPrima.create(req.body);
        res.json({ message: 'Guardado', id: nuevo.id_materia });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verificarStock = async (req, res) => {
    const { lista } = req.body; // Espera un array [{ id_materia, cantidad }]
    try {
        const faltantes = [];
        for (const item of lista) {
            const mat = await MateriaPrima.findByPk(item.id_materia);
            if (!mat || parseFloat(mat.cantidad_total_base) < parseFloat(item.cantidad)) {
                faltantes.push({
                    nombre: mat ? mat.nombre : 'Desconocido',
                    disponible: mat ? mat.cantidad_total_base : 0,
                    requerido: item.cantidad,
                    unidad: mat ? mat.unidad_base : '',
                    falta: mat ? (item.cantidad - mat.cantidad_total_base) : item.cantidad
                });
            }
        }
        
        if (faltantes.length > 0) {
            return res.status(409).json({ error: 'STOCK_INSUFICIENTE', lista: faltantes });
        }
        
        res.json({ message: 'Stock suficiente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerTodo, crearMateria, verificarStock };