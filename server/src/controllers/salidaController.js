const { Salida, MateriaPrima, Entrada, Cofre } = require('../models/asociaciones');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// 1. OBTENER LISTA DE SALIDAS
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
            costo: s.costo_calculado, // Mostrar el costo real
            tipo_salida: s.tipo_salida,
            fecha: s.fecha
        }));

        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo salidas' });
    }
};

// 2. REGISTRAR SALIDA (LÓGICA PEPS + DESCUENTO GLOBAL)
const registrarSalida = async (req, res) => {
    const { id_materia, id_cofre, cantidad, tipo } = req.body;
    const t = await sequelize.transaction();

    try {
        const cantidadRequerida = parseFloat(cantidad);

        // PASO 1: Obtener la Materia Prima (Vital para descontar el global al final)
        const materiaGlobal = await MateriaPrima.findByPk(id_materia, { transaction: t });
        
        if (!materiaGlobal) {
            throw new Error('La materia prima no existe.');
        }

        // PASO 2: Buscar lotes disponibles (PEPS)
        const lotes = await Entrada.findAll({
            where: { 
                id_materia, 
                stock_restante_lote: { [Op.gt]: 0 } // Solo lotes con algo de vida
            },
            order: [['fecha', 'ASC']], // Primero en entrar, primero en salir
            transaction: t
        });

        // Validar si la suma de lotes alcanza (Doble seguridad)
        const stockEnLotes = lotes.reduce((sum, l) => sum + parseFloat(l.stock_restante_lote), 0);
        if (stockEnLotes < cantidadRequerida) {
            // Si los lotes están vacíos pero el global decía que había, hay inconsistencia.
            // Aún así, detenemos para no romper PEPS.
            throw new Error(`Inconsistencia PEPS: No hay suficientes lotes con stock para cubrir ${cantidadRequerida}.`);
        }

        // PASO 3: Consumir Lotes (Cálculo de Costo Real)
        let porDescontar = cantidadRequerida;
        let costoTotalSalida = 0;

        for (const lote of lotes) {
            if (porDescontar <= 0) break;

            const disponible = parseFloat(lote.stock_restante_lote);
            const costoUnitarioLote = parseFloat(lote.costo_unitario || 0);
            
            let tomar = 0;

            if (disponible >= porDescontar) {
                // Este lote alcanza para todo lo que falta
                tomar = porDescontar;
                lote.stock_restante_lote = disponible - tomar;
                porDescontar = 0;
            } else {
                // Nos acabamos este lote y seguimos al siguiente
                tomar = disponible;
                lote.stock_restante_lote = 0;
                porDescontar -= tomar;
            }

            costoTotalSalida += (tomar * costoUnitarioLote);
            await lote.save({ transaction: t }); // Guardamos el lote actualizado
        }

        // PASO 4: Crear el registro de Salida
        await Salida.create({
            id_materia, 
            id_cofre: id_cofre || null,
            cantidad_base_usada: cantidadRequerida,
            costo_calculado: costoTotalSalida,
            tipo_salida: tipo
        }, { transaction: t });

        // PASO 5: Actualizar Stock Global (MateriaPrima)
        // Usamos la instancia que buscamos en el Paso 1. Esto es infalible.
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