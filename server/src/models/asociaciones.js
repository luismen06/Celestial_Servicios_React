/**
 * asociaciones.js
 * 
 * Centraliza todos los modelos de Sequelize y define las relaciones
 * entre ellos. Cada módulo importa los modelos desde aquí para
 * asegurar que las asociaciones ya están configuradas.
 * 
 * Diagrama de relaciones:
 * 
 *   Proveedor ──1:N──> Entrada <──N:1── MateriaPrima
 *   MateriaPrima ──1:N──> Salida <──N:1── Cofre
 *   ModeloCofre ──1:N──> Cofre <──N:1── Etapa
 *   ModeloCofre ──1:N──> Receta <──N:1── MateriaPrima
 *   Cofre ──1:N──> HistorialProduccion
 *   Etapa ──1:N──> HistorialProduccion
 *   Trabajador ──1:N──> HistorialProduccion
 */

const MateriaPrima = require('./MateriaPrima');
const Proveedor = require('./Proveedor');
const Entrada = require('./Entrada');
const Salida = require('./Salida');
const ModeloCofre = require('./ModeloCofre');
const Etapa = require('./Etapa');
const Cofre = require('./Cofre');
const Receta = require('./Receta');
const Trabajador = require('./Trabajador');
const HistorialProduccion = require('./HistorialProduccion');

// --- Entradas (Compras) ---
Proveedor.hasMany(Entrada, { foreignKey: 'id_proveedor' });
Entrada.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });

MateriaPrima.hasMany(Entrada, { foreignKey: 'id_materia' });
Entrada.belongsTo(MateriaPrima, { foreignKey: 'id_materia' });

// --- Salidas (Consumos) ---
MateriaPrima.hasMany(Salida, { foreignKey: 'id_materia' });
Salida.belongsTo(MateriaPrima, { foreignKey: 'id_materia' });

Cofre.hasMany(Salida, { foreignKey: 'id_cofre' });
Salida.belongsTo(Cofre, { foreignKey: 'id_cofre' });

// --- Cofres (Ordenes de producción) ---
ModeloCofre.hasMany(Cofre, { foreignKey: 'id_modelo' });
Cofre.belongsTo(ModeloCofre, { foreignKey: 'id_modelo' });

Etapa.hasMany(Cofre, { foreignKey: 'id_etapa_actual' });
Cofre.belongsTo(Etapa, { foreignKey: 'id_etapa_actual' });

// --- Recetas (Ingredientes por modelo) ---
ModeloCofre.hasMany(Receta, { foreignKey: 'id_modelo' });
Receta.belongsTo(ModeloCofre, { foreignKey: 'id_modelo' });

MateriaPrima.hasMany(Receta, { foreignKey: 'id_materia' });
Receta.belongsTo(MateriaPrima, { foreignKey: 'id_materia' });

// --- Historial de producción ---
// Registra cada cambio de etapa con trabajador y fecha
Cofre.hasMany(HistorialProduccion, { foreignKey: 'id_cofre', as: 'historial' });
HistorialProduccion.belongsTo(Cofre, { foreignKey: 'id_cofre' });

Etapa.hasMany(HistorialProduccion, { foreignKey: 'id_etapa' });
HistorialProduccion.belongsTo(Etapa, { foreignKey: 'id_etapa' });

Trabajador.hasMany(HistorialProduccion, { foreignKey: 'id_trabajador' });
HistorialProduccion.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

module.exports = {
    MateriaPrima,
    Proveedor,
    Entrada,
    Salida,
    ModeloCofre,
    Etapa,
    Cofre,
    Receta,
    Trabajador,
    HistorialProduccion
};