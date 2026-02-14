/**
 * app.js - Express app exportable para testing
 * 
 * Misma configuración que server.js pero sin app.listen()
 * para que supertest pueda manejar el ciclo de vida.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { ModeloCofre, Etapa, Trabajador } = require('./src/models/asociaciones');

// Rutas
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

app.use(cors());
app.use(express.json());

// Auth público
app.use('/api/auth', authRoutes);

// Middleware JWT para todo lo demás
app.use('/api', authMiddleware);

// Rutas protegidas
app.use('/api/inventario', inventarioRoutes);
app.use('/api/entradas', entradaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/salidas', salidaRoutes);
app.use('/api/recetas', recetaRoutes);
app.use('/api/reportes', reportesRoutes);

// Catálogos rápidos
app.get('/api/modelos', async (req, res) => {
    const lista = await ModeloCofre.findAll();
    res.json(lista);
});

app.get('/api/etapas', async (req, res) => {
    const lista = await Etapa.findAll({ order: [['id_etapa', 'ASC']] });
    res.json(lista);
});

app.get('/api/trabajadores', async (req, res) => {
    const lista = await Trabajador.findAll({ where: { activo: true } });
    res.json(lista);
});

// Configuración
app.get('/api/configuracion', configuracionController.obtenerTodosLosMaestros);
app.post('/api/config/modelos', configuracionController.guardarModelo);
app.delete('/api/config/modelos/:id', configuracionController.eliminarModelo);
app.post('/api/config/trabajadores', configuracionController.guardarTrabajador);
app.post('/api/config/proveedores', configuracionController.guardarProveedor);

// Avanzar etapa (alias)
const produccionController = require('./src/controllers/produccionController');
app.post('/api/avanzar', produccionController.avanzarEtapa);

module.exports = app;
