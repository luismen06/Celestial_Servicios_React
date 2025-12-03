const { Cofre, ModeloCofre, Etapa, Receta, MateriaPrima, Salida, HistorialProduccion, Trabajador, Entrada } = require('../models/asociaciones');
const sequelize = require('../config/database');
const { Op } = require('sequelize');


// 1. VER TABLERO
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
                // Incluimos Salidas para sumar los costos ya calculados
                { model: Salida, attributes: ['costo_calculado'] }
            ],
            order: [['id_cofre', 'DESC']]
        });

        const datos = produccion.map(c => {
            const listaHistorial = c.historial || [];
            const ultimoEvento = listaHistorial.sort((a, b) => b.id_historial - a.id_historial)[0];
            
            // --- CÁLCULO DE COSTO REAL (MUCHO MÁS FÁCIL) ---
            let costoTotal = 0;
            if (c.Salidas) {
                c.Salidas.forEach(s => {
                    // Simplemente sumamos lo que guardó el algoritmo PEPS
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
                
                costo_total: costoTotal, // <--- COSTO REAL PEPS
                
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

// 2. INICIAR PRODUCCIÓN 
const iniciarProduccion = async (req, res) => {
    const { id_modelo, id_trabajador } = req.body;
    const t = await sequelize.transaction();

    try {
        // A. Buscar Receta
        const ingredientes = await Receta.findAll({
            where: { id_modelo },
            include: [{ model: MateriaPrima, attributes: ['nombre', 'unidad_base', 'cantidad_total_base'] }],
            transaction: t
        });

        if (ingredientes.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Este modelo no tiene receta definida.' });
        }

        // ============================================================
        // FASE 1: EL ESCUDO (Verificación Previa)
        // Revisamos TODO antes de crear el cofre o tocar el inventario
        // ============================================================
        const faltantes = [];

        for (const item of ingredientes) {
            const stockActual = parseFloat(item.MateriaPrima.cantidad_total_base);
            const cantidadRequerida = parseFloat(item.cantidad_estimada);

            // Validamos contra el stock global (que es la suma de todas las entradas)
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

        // Si la lista de faltantes tiene algo, DETENEMOS TODO AQUÍ.
        if (faltantes.length > 0) {
            await t.rollback(); // No se crea el cofre, no se toca nada.
            return res.status(409).json({ 
                error: 'STOCK_INSUFICIENTE',
                lista: faltantes 
            });
        }

        // ============================================================
        // FASE 2: EJECUCIÓN (Si llegamos aquí, hay stock seguro)
        // ============================================================

        // B. Crear Cofre y Etapa Inicial
        const etapaInicial = await Etapa.findOne({ order: [['id_etapa', 'ASC']], transaction: t });
        const idEtapa = etapaInicial ? etapaInicial.id_etapa : 1;

        const nuevoCofre = await Cofre.create({
            id_modelo, id_etapa_actual: idEtapa, estado: 'En Proceso'
        }, { transaction: t });

        await HistorialProduccion.create({
            id_cofre: nuevoCofre.id_cofre, id_etapa: idEtapa, id_trabajador: id_trabajador, fecha_cambio: new Date()
        }, { transaction: t });

        // C. PROCESO DE DESCUENTO PEPS
        for (const item of ingredientes) {
            let cantidadRequerida = parseFloat(item.cantidad_estimada);
            const materiaId = item.id_materia;

            // 1. Buscamos lotes disponibles en Entradas
            const lotesDisponibles = await Entrada.findAll({
                where: {
                    id_materia: materiaId,
                    stock_restante_lote: { [Op.gt]: 0 }
                },
                order: [['fecha', 'ASC']], // Primero en entrar, primero en salir
                transaction: t
            });

            // 2. Consumir lotes
            for (const lote of lotesDisponibles) {
                if (cantidadRequerida <= 0) break;

                const disponibleEnLote = parseFloat(lote.stock_restante_lote);
                const costoLote = parseFloat(lote.costo_unitario);
                
                let aDescontar = 0;

                if (disponibleEnLote >= cantidadRequerida) {
                    aDescontar = cantidadRequerida;
                    lote.stock_restante_lote = disponibleEnLote - aDescontar;
                    cantidadRequerida = 0;
                } else {
                    aDescontar = disponibleEnLote;
                    lote.stock_restante_lote = 0;
                    cantidadRequerida -= aDescontar;
                }

                await lote.save({ transaction: t });

                // Registro de Salida con Costo Real
                await Salida.create({
                    id_materia: materiaId,
                    id_cofre: nuevoCofre.id_cofre,
                    cantidad_base_usada: aDescontar,
                    costo_calculado: (aDescontar * costoLote),
                    tipo_salida: 'Produccion'
                }, { transaction: t });
            }

            // 3. Actualizar Stock Global (MateriaPrima)
            // Esto mantiene sincronizado el global con la suma de entradas
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

// 3. AVANZAR ETAPA 
const avanzarEtapa = async (req, res) => {
    const { id_cofre, id_etapa_nueva, id_trabajador } = req.body;
    const t = await sequelize.transaction();

    try {
        // DETECTAR SI ES EL FINAL
        // Si el frontend nos manda "TERMINADO" o null en la etapa nueva
        const esFin = (id_etapa_nueva === "TERMINADO" || !id_etapa_nueva);

        if (esFin) {
            // --- LÓGICA DE FINALIZACIÓN ---
            await Cofre.update({ 
                estado: 'Terminado',
                fecha_finalizado: new Date()
            }, { where: { id_cofre }, transaction: t });

            // (Opcional) Registrar en historial que se finalizó
            // Podríamos dejar id_etapa como la última que tuvo o null
        } else {
            // --- LÓGICA DE AVANCE NORMAL ---
            await Cofre.update({ 
                id_etapa_actual: id_etapa_nueva,
                // Opcional: Actualizar trabajador actual si usas esa lógica
            }, { where: { id_cofre }, transaction: t });

            // Guardar Historial del cambio
            await HistorialProduccion.create({
                id_cofre,
                id_etapa: id_etapa_nueva,
                id_trabajador: id_trabajador,
                fecha_cambio: new Date()
            }, { transaction: t });
        }

        await t.commit();
        res.json({ message: esFin ? 'Producción Finalizada' : 'Etapa Avanzada' });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
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