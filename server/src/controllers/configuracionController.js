const { ModeloCofre, Trabajador, Proveedor, Cofre, Receta } = require('../models/asociaciones');

// --- MODELOS DE COFRES ---
const guardarModelo = async (req, res) => {
    try {
        const { nombre, id_modelo } = req.body;
        if (id_modelo) {
            await ModeloCofre.update({ nombre }, { where: { id_modelo } });
            res.json({ message: 'Actualizado' });
        } else {
            await ModeloCofre.create({ nombre });
            res.json({ message: 'Creado' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const eliminarModelo = async (req, res) => {
    try {
        const { id } = req.params;
        // VALIDACIÓN: No borrar si ya se usó en producción o tiene receta
        const usoCofres = await Cofre.count({ where: { id_modelo: id } });
        const usoRecetas = await Receta.count({ where: { id_modelo: id } });

        if (usoCofres > 0 || usoRecetas > 0) {
            return res.status(400).json({ error: 'No se puede eliminar: Este modelo ya tiene recetas o historial de producción.' });
        }

        await ModeloCofre.destroy({ where: { id_modelo: id } });
        res.json({ message: 'Eliminado' });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// --- TRABAJADORES ---
const guardarTrabajador = async (req, res) => {
    try {
        const { nombre, activo, id_trabajador } = req.body;
        // Convertir "on" o true a booleano 1/0
        const estadoActivo = (activo === true || activo === 'true' || activo === 1);

        if (id_trabajador) {
            await Trabajador.update({ nombre, activo: estadoActivo }, { where: { id_trabajador } });
            res.json({ message: 'Actualizado' });
        } else {
            await Trabajador.create({ nombre, activo: estadoActivo });
            res.json({ message: 'Creado' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// --- PROVEEDORES ---
const guardarProveedor = async (req, res) => {
    try {
        const { nombre, id_proveedor } = req.body;
        if (id_proveedor) {
            await Proveedor.update({ nombre }, { where: { id_proveedor } });
            res.json({ message: 'Actualizado' });
        } else {
            await Proveedor.create({ nombre });
            res.json({ message: 'Creado' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// GETTERS GENERALES (Para llenar las tablas de configuración)
const obtenerTodosLosMaestros = async (req, res) => {
    const modelos = await ModeloCofre.findAll();
    // Traemos TODOS los trabajadores (activos e inactivos) para poder editarlos
    const trabajadores = await Trabajador.findAll(); 
    const proveedores = await Proveedor.findAll();
    res.json({ modelos, trabajadores, proveedores });
};

module.exports = { guardarModelo, eliminarModelo, guardarTrabajador, guardarProveedor, obtenerTodosLosMaestros };