/**
 * produccionController.js
 * 
 * Maneja todo el flujo de producción: tablero, inicio de órdenes,
 * avance de etapas y finalización. El inicio de producción y los
 * materiales extra usan el algoritmo PEPS para costeo real.
 */

const { Cofre, ModeloCofre, Etapa, Receta, MateriaPrima, Salida, HistorialProduccion, Trabajador, Entrada } = require('../models/asociaciones');
const sequelize = require('../config/database');
const { Op } = require('sequelize');


/**
 * Obtiene el tablero de producción con todas las órdenes,
 * incluyendo historial y costo total calculado desde PEPS.
 */
const obtenerProduccion = async (req, res) => {
    try {
        const produccion = await Cofre.findAll({
            include: [
                { model: ModeloCofre, attributes: ['nombre'] },
                { model: Etapa, attributes: ['nombre'] },
                {
                    model: HistorialProduccion,
                    as: 'historial',
                    include: [
                        { model: Trabajador, attributes: ['nombre'] },
                        { model: Etapa, attributes: ['nombre'] }
                    ]
                },
                // Traemos las salidas para sumar el costo real por PEPS
                { model: Salida, attributes: ['costo_calculado'] }
            ],
            order: [['id_cofre', 'DESC']]
        });

        // Transformamos la data para que el frontend la consuma fácil
        const datos = produccion.map(c => {
            const listaHistorial = c.historial || [];
            const ultimoEvento = listaHistorial.sort((a, b) => b.id_historial - a.id_historial)[0];

            // Costo total = suma de todas las salidas PEPS del cofre
            let costoTotal = 0;
            if (c.Salidas) {
                c.Salidas.forEach(s => {
                    costoTotal += parseFloat(s.costo_calculado || 0);
                });
            }

            return {
                id_cofre: c.id_cofre,
                modelo: c.ModeloCofre ? c.ModeloCofre.nombre : 'Desconocido',
                etapa: c.Etapa ? c.Etapa.nombre : 'Sin etapa',
                id_etapa_actual: c.id_etapa_actual,
                trabajador: (ultimoEvento && ultimoEvento.Trabajador) ? ultimoEvento.Trabajador.nombre : 'Sin asignar',
                estado: c.estado,
                costo_total: costoTotal,
                detalles_historial: listaHistorial.sort((a, b) => a.id_historial - b.id_historial).map(h => ({
                    etapa: h.Etapa ? h.Etapa.nombre : 'Etapa ' + h.id_etapa,
                    trabajador: h.Trabajador ? h.Trabajador.nombre : 'N/A',
                    fecha: h.fecha_cambio
                }))
            };
        });

        res.json(datos);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Error al cargar producción' });
    }
};

/**
 * Inicia una nueva orden de producción.
 * 
 * Flujo:
 * 1. Busca la receta del modelo seleccionado
 * 2. Verifica que haya stock suficiente de todos los materiales
 * 3. Crea el cofre y su primer registro de historial
 * 4. Descuenta inventario lote por lote siguiendo PEPS
 * 5. Registra cada salida con su costo real
 */
const iniciarProduccion = async (req, res) => {
    const { id_modelo, id_trabajador } = req.body;
    const t = await sequelize.transaction();

    try {
        // Traer la receta con los datos del material
        const ingredientes = await Receta.findAll({
            where: { id_modelo },
            include: [{ model: MateriaPrima, attributes: ['nombre', 'unidad_base', 'cantidad_total_base'] }],
            transaction: t
        });

        if (ingredientes.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Este modelo no tiene receta definida.' });
        }

        // FASE 1: Verificar stock antes de tocar nada
        // Si falta algo, paramos y le avisamos al usuario qué comprar
        const faltantes = [];

        for (const item of ingredientes) {
            const stockActual = parseFloat(item.MateriaPrima.cantidad_total_base);
            const cantidadRequerida = parseFloat(item.cantidad_estimada);

            if (stockActual < cantidadRequerida) {
                faltantes.push({
                    nombre: item.MateriaPrima.nombre,
                    disponible: stockActual,
                    requerido: cantidadRequerida,
                    unidad: item.MateriaPrima.unidad_base,
                    falta: (cantidadRequerida - stockActual).toFixed(2)
                });
            }
        }

        if (faltantes.length > 0) {
            await t.rollback();
            return res.status(409).json({
                error: 'STOCK_INSUFICIENTE',
                lista: faltantes
            });
        }

        // FASE 2: Todo OK, procedemos a crear la orden

        // Buscar la primera etapa del flujo
        const etapaInicial = await Etapa.findOne({ order: [['id_etapa', 'ASC']], transaction: t });
        const idEtapa = etapaInicial ? etapaInicial.id_etapa : 1;

        const nuevoCofre = await Cofre.create({
            id_modelo, id_etapa_actual: idEtapa, estado: 'En Proceso'
        }, { transaction: t });

        // Primer registro en el historial
        await HistorialProduccion.create({
            id_cofre: nuevoCofre.id_cofre, id_etapa: idEtapa, id_trabajador: id_trabajador, fecha_cambio: new Date()
        }, { transaction: t });

        // Descuento PEPS: recorrer lotes del más viejo al más nuevo
        for (const item of ingredientes) {
            let cantidadRequerida = parseFloat(item.cantidad_estimada);
            const materiaId = item.id_materia;

            // Lotes con stock disponible, ordenados por fecha de compra (PEPS)
            const lotesDisponibles = await Entrada.findAll({
                where: {
                    id_materia: materiaId,
                    stock_restante_lote: { [Op.gt]: 0 }
                },
                order: [['fecha', 'ASC']],
                transaction: t
            });

            // Ir consumiendo lotes hasta cubrir lo que pide la receta
            for (const lote of lotesDisponibles) {
                if (cantidadRequerida <= 0) break;

                const disponibleEnLote = parseFloat(lote.stock_restante_lote);
                const costoLote = parseFloat(lote.costo_unitario);

                let aDescontar = 0;

                if (disponibleEnLote >= cantidadRequerida) {
                    // El lote alcanza para todo
                    aDescontar = cantidadRequerida;
                    lote.stock_restante_lote = disponibleEnLote - aDescontar;
                    cantidadRequerida = 0;
                } else {
                    // Tomamos todo el lote y seguimos con el siguiente
                    aDescontar = disponibleEnLote;
                    lote.stock_restante_lote = 0;
                    cantidadRequerida -= aDescontar;
                }

                await lote.save({ transaction: t });

                // Cada fragmento de lote genera su propia salida con costo real
                await Salida.create({
                    id_materia: materiaId,
                    id_cofre: nuevoCofre.id_cofre,
                    cantidad_base_usada: aDescontar,
                    costo_calculado: (aDescontar * costoLote),
                    tipo_salida: 'Produccion'
                }, { transaction: t });
            }

            // Actualizar el stock global de la materia prima
            await MateriaPrima.decrement('cantidad_total_base', {
                by: item.cantidad_estimada,
                where: { id_materia: materiaId },
                transaction: t
            });
        }

        await t.commit();
        res.json({ message: 'Orden PEPS iniciada correctamente', id: nuevoCofre.id_cofre });

    } catch (error) {
        await t.rollback();
        console.error("Error Producción:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Avanza el cofre a la siguiente etapa o lo marca como terminado.
 * También procesa materiales extra que el trabajador haya usado
 * durante esa etapa (con descuento PEPS igual que al iniciar).
 */
const avanzarEtapa = async (req, res) => {
    const { id_cofre, id_etapa_nueva, id_trabajador, materialesExtra } = req.body;
    const t = await sequelize.transaction();

    try {
        // Si no hay etapa siguiente o viene "TERMINADO", cerramos la orden
        const esFin = (id_etapa_nueva === "TERMINADO" || !id_etapa_nueva);

        if (esFin) {
            await Cofre.update({
                estado: 'Terminado',
                fecha_finalizado: new Date()
            }, { where: { id_cofre }, transaction: t });
        } else {
            await Cofre.update({
                id_etapa_actual: id_etapa_nueva,
            }, { where: { id_cofre }, transaction: t });

            await HistorialProduccion.create({
                id_cofre,
                id_etapa: id_etapa_nueva,
                id_trabajador: id_trabajador,
                fecha_cambio: new Date()
            }, { transaction: t });
        }

        // Procesar materiales extra con PEPS (misma lógica que iniciarProduccion)
        if (materialesExtra && materialesExtra.length > 0) {
            for (const mat of materialesExtra) {
                let cantidadRequerida = parseFloat(mat.cantidad);
                const materiaId = mat.id_materia;

                const materiaGlobal = await MateriaPrima.findByPk(materiaId, { transaction: t });
                if (!materiaGlobal) {
                    throw new Error(`Materia prima ID ${materiaId} no existe.`);
                }

                // Buscar lotes con stock (PEPS)
                const lotesDisponibles = await Entrada.findAll({
                    where: {
                        id_materia: materiaId,
                        stock_restante_lote: { [Op.gt]: 0 }
                    },
                    order: [['fecha', 'ASC']],
                    transaction: t
                });

                const stockEnLotes = lotesDisponibles.reduce((sum, l) => sum + parseFloat(l.stock_restante_lote), 0);
                if (stockEnLotes < cantidadRequerida) {
                    throw new Error(`Stock insuficiente para ${materiaGlobal.nombre}. Disponible: ${stockEnLotes}, Requerido: ${cantidadRequerida}`);
                }

                // Consumir lotes PEPS
                let porDescontar = cantidadRequerida;
                let costoTotalSalida = 0;

                for (const lote of lotesDisponibles) {
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

                // Registrar salida y actualizar stock global
                await Salida.create({
                    id_materia: materiaId,
                    id_cofre: id_cofre,
                    cantidad_base_usada: cantidadRequerida,
                    costo_calculado: costoTotalSalida,
                    tipo_salida: 'Produccion'
                }, { transaction: t });

                await materiaGlobal.decrement('cantidad_total_base', {
                    by: cantidadRequerida,
                    transaction: t
                });
            }
        }

        await t.commit();
        res.json({ message: esFin ? 'Producción Finalizada' : 'Etapa Avanzada' });

    } catch (error) {
        await t.rollback();
        console.error("Error en avanzarEtapa:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Finaliza una orden de producción directamente (sin avanzar etapas).
 * Se usa como fallback desde el frontend.
 */
const finalizarProduccion = async (req, res) => {
    const { id_cofre } = req.body;
    try {
        await Cofre.update(
            {
                estado: 'Terminado',
                fecha_finalizado: new Date()
            },
            { where: { id_cofre } }
        );
        res.json({ message: 'Cofre terminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerProduccion, iniciarProduccion, avanzarEtapa, finalizarProduccion };