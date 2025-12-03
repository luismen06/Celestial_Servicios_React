// Importamos todos los modelos
const MateriaPrima = require('./MateriaPrima');
const Proveedor = require('./Proveedor');
const Entrada = require('./Entrada');
const Salida = require('./Salida');
const ModeloCofre = require('./ModeloCofre');
const Etapa = require('./Etapa');
const Cofre = require('./Cofre');
const Receta = require('./Receta');
const Trabajador = require('./Trabajador');
const HistorialProduccion = require('./HistorialProduccion'); // <--- NUEVO

// --- DEFINIR RELACIONES (Basado en tu diagrama) ---

// 1. Relaciones de ENTRADAS
// Un proveedor tiene muchas entradas, una entrada pertenece a un proveedor
Proveedor.hasMany(Entrada, { foreignKey: 'id_proveedor' });
Entrada.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });

// Una materia tiene muchas entradas
MateriaPrima.hasMany(Entrada, { foreignKey: 'id_materia' });
Entrada.belongsTo(MateriaPrima, { foreignKey: 'id_materia' });

// 2. Relaciones de SALIDAS
MateriaPrima.hasMany(Salida, { foreignKey: 'id_materia' });
Salida.belongsTo(MateriaPrima, { foreignKey: 'id_materia' });

Cofre.hasMany(Salida, { foreignKey: 'id_cofre' });
Salida.belongsTo(Cofre, { foreignKey: 'id_cofre' });

// 3. Relaciones de COFRES
ModeloCofre.hasMany(Cofre, { foreignKey: 'id_modelo' });
Cofre.belongsTo(ModeloCofre, { foreignKey: 'id_modelo' });

Etapa.hasMany(Cofre, { foreignKey: 'id_etapa_actual' });
Cofre.belongsTo(Etapa, { foreignKey: 'id_etapa_actual' });

// 4. Relaciones de RECETAS
ModeloCofre.hasMany(Receta, { foreignKey: 'id_modelo' });
Receta.belongsTo(ModeloCofre, { foreignKey: 'id_modelo' });

MateriaPrima.hasMany(Receta, { foreignKey: 'id_materia' });
Receta.belongsTo(MateriaPrima, { foreignKey: 'id_materia' });

// --- NUEVAS RELACIONES PARA HISTORIAL ---
// Un cofre tiene mucho historial
Cofre.hasMany(HistorialProduccion, { foreignKey: 'id_cofre', as: 'historial' });
HistorialProduccion.belongsTo(Cofre, { foreignKey: 'id_cofre' });

// Una etapa tiene mucho historial
Etapa.hasMany(HistorialProduccion, { foreignKey: 'id_etapa' });
HistorialProduccion.belongsTo(Etapa, { foreignKey: 'id_etapa' });

// Un trabajador aparece en muchos historiales
Trabajador.hasMany(HistorialProduccion, { foreignKey: 'id_trabajador' });
HistorialProduccion.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });


// Exportamos todo junto en un objeto para usarlo en el server.js
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