/**
 * salidaController.js
 * 
 * Gestiona las salidas de materia prima (consumos).
 * Usa algoritmo PEPS para calcular el costo real de cada salida
 * consumiendo lotes desde el más antiguo al más nuevo.
 */

const { Salida, MateriaPrima, Entrada, Cofre } = require('../models/asociaciones');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * Lista todas las salidas con el nombre del material y el cofre destino.
 */
const obtenerSalidas = async (req, res) => {
    try {
        const salidas = await Salida.findAll({
            include: [
                { model: MateriaPrima, attributes: ['nombre', 'unidad_base'] },
                { model: Cofre, attributes: ['id_cofre'] }
            ],
            order: [['fecha', 'DESC']]
        });

        const datos = salidas.map(s => ({
            id_salida: s.id_salida,
            materia: s.MateriaPrima ? s.MateriaPrima.nombre : 'Desconocido',
            unidad_base: s.MateriaPrima ? s.MateriaPrima.unidad_base : '',
            id_cofre: s.id_cofre || null,
            cantidad_base_usada: s.cantidad_base_usada,
            costo: s.costo_calculado,
            tipo_salida: s.tipo_salida,
            fecha: s.fecha
        }));

        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo salidas' });
    }
};

/**
 * Registra una salida manual consumiendo lotes PEPS.
 * 
 * Flujo:
 * 1. Verificar que la materia prima existe
 * 2. Buscar lotes con stock (ordenados por fecha ASC = PEPS)
 * 3. Ir tomando de cada lote hasta cubrir la cantidad requerida
 * 4. Crear registro de salida con costo real acumulado
 * 5. Decrementar el stock global
 */
const registrarSalida = async (req, res) => {
    const { id_materia, id_cofre, cantidad, tipo } = req.body;
    const t = await sequelize.transaction();

    try {
        const cantidadRequerida = parseFloat(cantidad);

        const materiaGlobal = await MateriaPrima.findByPk(id_materia, { transaction: t });

        if (!materiaGlobal) {
            throw new Error('La materia prima no existe.');
        }

        // Buscar lotes que aún tengan stock
        const lotes = await Entrada.findAll({
            where: {
                id_materia,
                stock_restante_lote: { [Op.gt]: 0 }
            },
            order: [['fecha', 'ASC']],    // Primero en entrar, primero en salir
            transaction: t
        });

        // Verificar que la suma de lotes cubre lo requerido
        const stockEnLotes = lotes.reduce((sum, l) => sum + parseFloat(l.stock_restante_lote), 0);
        if (stockEnLotes < cantidadRequerida) {
            throw new Error(`Inconsistencia PEPS: No hay suficientes lotes con stock para cubrir ${cantidadRequerida}.`);
        }

        // Consumir lotes y acumular costo real
        let porDescontar = cantidadRequerida;
        let costoTotalSalida = 0;

        for (const lote of lotes) {
            if (porDescontar <= 0) break;

            const disponible = parseFloat(lote.stock_restante_lote);
            const costoUnitarioLote = parseFloat(lote.costo_unitario || 0);

            let tomar = 0;

            if (disponible >= porDescontar) {
                tomar = porDescontar;
                lote.stock_restante_lote = disponible - tomar;
                porDescontar = 0;
            } else {
                tomar = disponible;
                lote.stock_restante_lote = 0;
                porDescontar -= tomar;
            }

            costoTotalSalida += (tomar * costoUnitarioLote);
            await lote.save({ transaction: t });
        }

        await Salida.create({
            id_materia,
            id_cofre: id_cofre || null,
            cantidad_base_usada: cantidadRequerida,
            costo_calculado: costoTotalSalida,
            tipo_salida: tipo
        }, { transaction: t });

        await materiaGlobal.decrement('cantidad_total_base', {
            by: cantidadRequerida,
            transaction: t
        });

        await t.commit();
        res.json({ message: 'Salida registrada correctamente' });

    } catch (error) {
        await t.rollback();
        console.error("Error en Salida:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerSalidas, registrarSalida };