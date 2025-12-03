const { Receta, MateriaPrima } = require('../models/asociaciones');

// OBTENER RECETA POR MODELO
const obtenerPorModelo = async (req, res) => {
    try {
        const { idModelo } = req.params;
        const recetas = await Receta.findAll({
            where: { id_modelo: idModelo },
            include: [{ model: MateriaPrima, attributes: ['nombre', 'unidad_base'] }]
        });

        const datos = recetas.map(r => ({
            id_receta: r.id_receta,
            materia: r.MateriaPrima ? r.MateriaPrima.nombre : 'Desconocido',
            unidad_base: r.MateriaPrima ? r.MateriaPrima.unidad_base : '',
            cantidad_estimada: r.cantidad_estimada
        }));

        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// AGREGAR INGREDIENTE
const agregarIngrediente = async (req, res) => {
    try {
        await Receta.create({
            id_modelo: req.body.id_modelo,
            id_materia: req.body.id_materia,
            cantidad_estimada: req.body.cantidad
        });
        res.json({ message: 'Ingrediente agregado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ELIMINAR INGREDIENTE
const eliminarIngrediente = async (req, res) => {
    try {
        await Receta.destroy({ where: { id_receta: req.params.id } });
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerPorModelo, agregarIngrediente, eliminarIngrediente };