/**
 * entradaController.js
 * 
 * Gestiona las compras de materia prima (Entradas).
 * Cada compra crea un lote PEPS con su costo unitario calculado
 * y actualiza el stock global del material.
 */

const { Entrada, MateriaPrima, Proveedor } = require('../models/asociaciones');
const sequelize = require('../config/database');

/**
 * Lista todas las entradas (compras) ordenadas por fecha.
 * Incluye nombre del material y proveedor para mostrar en la tabla.
 */
const obtenerEntradas = async (req, res) => {
    try {
        const entradas = await Entrada.findAll({
            include: [
                { model: MateriaPrima, attributes: ['nombre'] },
                { model: Proveedor, attributes: ['nombre'] }
            ],
            order: [['fecha', 'DESC']]
        });

        const datos = entradas.map(e => ({
            id_entrada: e.id_entrada,
            cantidad: e.cantidad_presentacion_comprada,
            costo: e.costo_total_compra,
            fecha: e.fecha,
            materia: e.MateriaPrima ? e.MateriaPrima.nombre : 'Desconocido',
            proveedor: e.Proveedor ? e.Proveedor.nombre : 'Desconocido'
        }));

        res.json(datos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener entradas' });
    }
};

/**
 * Registra una nueva compra y actualiza el inventario.
 * 
 * Convierte la cantidad de presentaciones (ej: 5 canecas) a unidad base
 * (ej: 1000 ml) y calcula el costo unitario por unidad base para PEPS.
 */
const registrarEntrada = async (req, res) => {
    const id_materia = parseInt(req.body.id_materia);
    const id_proveedor = parseInt(req.body.id_proveedor);
    const cantidad = parseFloat(req.body.cantidad);   // Presentaciones compradas (ej: 5 canecas)
    const costo = parseFloat(req.body.costo);         // Costo total de la factura

    const t = await sequelize.transaction();

    try {
        // Buscar el material para saber la conversión de presentación a unidad base
        const materia = await MateriaPrima.findByPk(id_materia, { transaction: t });

        if (!materia) {
            await t.rollback();
            return res.status(404).json({ error: 'Material no encontrado' });
        }

        // Si el contenido por presentación es 0, la conversión falla y el stock nunca sube
        const contenido = parseFloat(materia.contenido_por_presentacion);
        if (!contenido || contenido <= 0) {
            await t.rollback();
            return res.status(400).json({ error: 'El material tiene "Contenido por presentación" en 0. Edítalo en Inventario primero.' });
        }

        // Conversión: 5 canecas * 200ml/caneca = 1000ml
        const totalBase = cantidad * contenido;
        // Costo por unidad base: $50000 / 1000ml = $50/ml
        const costoUnitarioCalculado = costo / totalBase;

        // Crear el lote PEPS (nace con stock_restante_lote = totalBase)
        await Entrada.create({
            id_materia,
            id_proveedor,
            cantidad_presentacion_comprada: cantidad,
            cantidad_base_total: totalBase,
            stock_restante_lote: totalBase,
            costo_unitario: costoUnitarioCalculado,
            costo_total_compra: costo
        }, { transaction: t });

        // Actualizar stock global manualmente (más seguro que increment)
        const stockActual = parseFloat(materia.cantidad_total_base) || 0;
        const nuevoStock = stockActual + totalBase;

        materia.cantidad_total_base = nuevoStock;
        await materia.save({ transaction: t });

        await t.commit();
        res.json({ message: 'Entrada registrada y stock actualizado', nuevoStock });

    } catch (error) {
        await t.rollback();
        console.error("Error en Compra:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerEntradas, registrarEntrada };