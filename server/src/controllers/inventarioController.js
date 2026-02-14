/**
 * inventarioController.js
 * 
 * Operaciones básicas sobre materias primas: listar, crear
 * y verificar stock antes de producción.
 */

const { MateriaPrima } = require('../models/asociaciones');

/** Lista todas las materias primas con su stock actual */
const obtenerTodo = async (req, res) => {
    try {
        const lista = await MateriaPrima.findAll();
        res.json(lista);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/** Crea o registra una nueva materia prima en el catálogo */
const crearMateria = async (req, res) => {
    try {
        const nuevo = await MateriaPrima.create(req.body);
        res.json({ message: 'Guardado', id: nuevo.id_materia });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verifica si hay stock suficiente para una lista de materiales.
 * Recibe un array [{id_materia, cantidad}] y devuelve los faltantes.
 * Se usa antes de iniciar producción para validar sin tocar nada.
 */
const verificarStock = async (req, res) => {
    const { lista } = req.body;
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