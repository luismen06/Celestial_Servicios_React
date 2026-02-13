const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./src/config/database');
const { ModeloCofre, Etapa, Trabajador } = require('./src/models/asociaciones'); // Importar modelos extra

// --- IMPORTAR RUTAS ---
const authRoutes = require('./src/routes/authRoutes');
const authMiddleware = require('./src/middlewares/authMiddleware');
const inventarioRoutes = require('./src/routes/inventarioRoutes');
const entradaRoutes = require('./src/routes/entradaRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');
const produccionRoutes = require('./src/routes/produccionRoutes');
const salidaRoutes = require('./src/routes/salidaRoutes');
const recetaRoutes = require('./src/routes/recetaRoutes');
const configuracionController = require('./src/controllers/configuracionController');
const reportesRoutes = require('./src/routes/reportesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===============================
// RUTA DE AUTENTICACIÓN (pública)
// ===============================
app.use('/api/auth', authRoutes);

// ===============================
// MIDDLEWARE DE AUTENTICACIÓN (protege todo lo demás)
// ===============================
app.use('/api', authMiddleware);

// ===============================
// RUTAS PRINCIPALES (Controladores)
// ===============================
app.use('/api/inventario', inventarioRoutes);
app.use('/api/entradas', entradaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/salidas', salidaRoutes); // <--- CONECTADO
app.use('/api/recetas', recetaRoutes); // <--- CONECTADO
app.use('/api/reportes', reportesRoutes); // <--- AGREGAR ESTA LÍNEA

// ===============================
// RUTAS RÁPIDAS (Catálogos)
// ===============================
// Estas son pequeñas, las dejamos aquí para no llenar de archivos
app.get('/api/modelos', async (req, res) => {
    const lista = await ModeloCofre.findAll();
    res.json(lista);
});

app.get('/api/etapas', async (req, res) => {
    const lista = await Etapa.findAll({ order: [['id_etapa', 'ASC']] });
    res.json(lista);
});

app.get('/api/trabajadores', async (req, res) => {
    // CORRECCIÓN: Solo enviamos los que tengan activo = true (o 1)
    const lista = await Trabajador.findAll({
        where: { activo: true }
    });
    res.json(lista);
});

// 1. Obtener todo
app.get('/api/configuracion', configuracionController.obtenerTodosLosMaestros);

// 2. Gestión Modelos
app.post('/api/config/modelos', configuracionController.guardarModelo);
app.delete('/api/config/modelos/:id', configuracionController.eliminarModelo);

// 3. Gestión Trabajadores
app.post('/api/config/trabajadores', configuracionController.guardarTrabajador);

// 4. Gestión Proveedores
app.post('/api/config/proveedores', configuracionController.guardarProveedor);

// Redirección especial para la función "Avanzar" (HTML llama a /api/avanzar)
const produccionController = require('./src/controllers/produccionController');
app.post('/api/avanzar', produccionController.avanzarEtapa);

// ===============================
// INICIAR SERVIDOR
// ===============================
app.listen(PORT, async () => {
    console.log(`🚀 Servidor completo en http://localhost:${PORT}`);
    try {
        await sequelize.sync({ alter: true }); // Esto asegura que las tablas existan
        console.log("✅ Base de datos sincronizada y lista.");
    } catch (error) {
        console.error("❌ Error conectando a BD:", error);
    }
});

