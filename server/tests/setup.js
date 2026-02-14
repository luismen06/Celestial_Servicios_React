/**
 * setup.js - Configuración global para los tests
 * 
 * Crea una BD SQLite en memoria antes de cada suite,
 * y la cierra al terminar. Así los tests no tocan la BD real.
 */

const sequelize = require('../src/config/database');
const {
    MateriaPrima, Proveedor, Entrada, Salida,
    ModeloCofre, Etapa, Cofre, Receta,
    Trabajador, HistorialProduccion
} = require('../src/models/asociaciones');

/**
 * Sincroniza la BD en memoria y crea los datos semilla
 * necesarios para que los tests funcionen.
 */
const setupDatabase = async () => {
    await sequelize.sync({ force: true });

    // Datos semilla mínimos para testing
    await Etapa.bulkCreate([
        { id_etapa: 1, nombre: 'Corte' },
        { id_etapa: 2, nombre: 'Armado' },
        { id_etapa: 3, nombre: 'Acabado' }
    ]);

    await Trabajador.create({ id_trabajador: 1, nombre: 'Test Worker', activo: true });

    await Proveedor.create({ id_proveedor: 1, nombre: 'Proveedor Test' });

    await ModeloCofre.create({ id_modelo: 1, nombre: 'Cofre Clásico' });

    await MateriaPrima.create({
        id_materia: 1,
        nombre: 'Madera Test',
        unidad_base: 'cm',
        cantidad_total_base: 500,
        presentacion: 'Tabla',
        contenido_por_presentacion: 100
    });

    // Receta: Cofre Clásico necesita 200cm de Madera
    await Receta.create({
        id_receta: 1,
        id_modelo: 1,
        id_materia: 1,
        cantidad_estimada: 200
    });

    // Lote PEPS con stock
    await Entrada.create({
        id_entrada: 1,
        id_materia: 1,
        id_proveedor: 1,
        cantidad_presentacion_comprada: 5,
        cantidad_base_total: 500,
        stock_restante_lote: 500,
        costo_unitario: 10,
        costo_total_compra: 5000
    });
};

const teardownDatabase = async () => {
    await sequelize.close();
};

module.exports = { setupDatabase, teardownDatabase };
