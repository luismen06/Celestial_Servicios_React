// Archivo: src/controllers/entradaController.js
const { Entrada, MateriaPrima, Proveedor } = require('../models/asociaciones');
const sequelize = require('../config/database');

// 1. OBTENER LISTA DE ENTRADAS
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

// 2. REGISTRAR UNA ENTRADA (COMPRA)
const registrarEntrada = async (req, res) => {
    // Convertimos todo a números para evitar errores de texto
    const id_materia = parseInt(req.body.id_materia);
    const id_proveedor = parseInt(req.body.id_proveedor);
    const cantidad = parseFloat(req.body.cantidad); // Cantidad de presentaciones (ej: 5 canecas)
    const costo = parseFloat(req.body.costo);       // Costo total $$$

    const t = await sequelize.transaction();

    try {
        // 1. Buscar la materia prima para saber cuánto trae cada presentación
        const materia = await MateriaPrima.findByPk(id_materia, { transaction: t });
        
        if (!materia) {
            await t.rollback();
            return res.status(404).json({ error: 'Material no encontrado' });
        }

        // VALIDACIÓN IMPORTANTE: Si contenido_por_presentacion es 0, el stock nunca subirá
        const contenido = parseFloat(materia.contenido_por_presentacion);
        if (!contenido || contenido <= 0) {
            await t.rollback();
            return res.status(400).json({ error: 'El material tiene "Contenido por presentación" en 0. Edítalo en Inventario primero.' });
        }

        // 2. Cálculos Matemáticos
        const totalBase = cantidad * contenido; // Ej: 5 canecas * 200ml = 1000ml
        const costoUnitarioCalculado = costo / totalBase; // Precio por ml/gr

        // 3. Crear registro de entrada (Lote PEPS)
       await Entrada.create({
            id_materia,
            id_proveedor,
            cantidad_presentacion_comprada: cantidad,
            cantidad_base_total: totalBase,
            stock_restante_lote: totalBase,  // El lote nace lleno
            costo_unitario: costoUnitarioCalculado,
            costo_total_compra: costo
        }, { transaction: t });

        // 4. ACTUALIZAR STOCK GLOBAL (MANUALMENTE PARA MAYOR SEGURIDAD)
        // En lugar de materia.increment, sumamos y guardamos explícitamente.
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