/**
 * configuracionController.js
 * 
 * Gestiona los catálogos maestros: Modelos de cofre,
 * Trabajadores y Proveedores. Incluye validación para
 * no borrar modelos que ya tienen historial de producción.
 */

const { ModeloCofre, Trabajador, Proveedor, Cofre, Receta } = require('../models/asociaciones');

// --- MODELOS DE COFRES ---

/** Crea o actualiza un modelo de cofre por su ID */
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

/**
 * Elimina un modelo solo si no tiene cofres producidos ni recetas.
 * Esto evita dejar registros huérfanos en la BD.
 */
const eliminarModelo = async (req, res) => {
    try {
        const { id } = req.params;
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

/** Crea o actualiza un trabajador. Normaliza el campo "activo" de distintos formatos */
const guardarTrabajador = async (req, res) => {
    try {
        const { nombre, activo, id_trabajador } = req.body;
        // El frontend manda diferentes formatos: true, "true", 1, "on"...
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

/** Crea o actualiza un proveedor por su ID */
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

/**
 * Retorna todos los catálogos maestros para la página de configuración.
 * Incluye trabajadores inactivos para que se puedan reactivar desde el frontend.
 */
const obtenerTodosLosMaestros = async (req, res) => {
    const modelos = await ModeloCofre.findAll();
    const trabajadores = await Trabajador.findAll();
    const proveedores = await Proveedor.findAll();
    res.json({ modelos, trabajadores, proveedores });
};

module.exports = { guardarModelo, eliminarModelo, guardarTrabajador, guardarProveedor, obtenerTodosLosMaestros };