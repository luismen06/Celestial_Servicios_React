/**
 * produccion.test.js - Tests del módulo de producción
 * 
 * Cubre: obtener tablero, iniciar producción con descuento PEPS,
 * verificar insuficiencia de stock, y avanzar etapas.
 * 
 * Estos tests son los más importantes porque validan el flujo
 * completo de negocios: receta -> verificación -> descuento -> costeo.
 */

const request = require('supertest');
const app = require('../app');
const { setupDatabase, teardownDatabase } = require('./setup');
const { authHeaders } = require('./helpers');
const { MateriaPrima, Cofre, Salida, Entrada } = require('../src/models/asociaciones');

beforeAll(async () => {
    await setupDatabase();
});

afterAll(async () => {
    await teardownDatabase();
});

describe('GET /api/produccion', () => {
    test('debe retornar el tablero de producción', async () => {
        const res = await request(app)
            .get('/api/produccion')
            .set(authHeaders());

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('POST /api/produccion (iniciar)', () => {
    test('debe iniciar producción y descontar inventario PEPS', async () => {
        // Stock antes: 500 unidades (del setup)
        const materiaBefore = await MateriaPrima.findByPk(1);
        const stockAntes = parseFloat(materiaBefore.cantidad_total_base);

        const res = await request(app)
            .post('/api/produccion')
            .set(authHeaders())
            .send({
                id_modelo: 1,
                id_trabajador: 1
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('PEPS');
        expect(res.body).toHaveProperty('id');

        // Verificar que se descontó la cantidad de la receta (200 unidades)
        const materiaAfter = await MateriaPrima.findByPk(1);
        const stockDespues = parseFloat(materiaAfter.cantidad_total_base);
        expect(stockDespues).toBe(stockAntes - 200);

        // Verificar que se crearon salidas PEPS
        const salidas = await Salida.findAll({ where: { id_cofre: res.body.id } });
        expect(salidas.length).toBeGreaterThan(0);

        // Verificar que el costo se calculó correctamente (200 * $10 = $2000)
        const costoTotal = salidas.reduce((sum, s) => sum + parseFloat(s.costo_calculado), 0);
        expect(costoTotal).toBe(2000);
    });

    test('debe rechazar producción sin stock suficiente', async () => {
        // El test anterior consumió 200, quedan 300
        // La receta pide 200, así que intentamos iniciar muchas hasta que no alcance
        // Primero llenamos para agotar: necesitamos consumir todo el stock restante

        // Forzamos stock bajo directamente
        await MateriaPrima.update(
            { cantidad_total_base: 50 },  // Solo 50, receta pide 200
            { where: { id_materia: 1 } }
        );

        const res = await request(app)
            .post('/api/produccion')
            .set(authHeaders())
            .send({
                id_modelo: 1,
                id_trabajador: 1
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('STOCK_INSUFICIENTE');
        expect(res.body.lista).toBeDefined();
        expect(res.body.lista[0]).toHaveProperty('falta');
    });

    test('debe rechazar modelo sin receta', async () => {
        // Crear modelo sin receta
        const { ModeloCofre } = require('../src/models/asociaciones');
        await ModeloCofre.create({ id_modelo: 99, nombre: 'Modelo Sin Receta' });

        const res = await request(app)
            .post('/api/produccion')
            .set(authHeaders())
            .send({
                id_modelo: 99,
                id_trabajador: 1
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('receta');
    });
});

describe('POST /api/avanzar', () => {
    let cofreId;

    beforeAll(async () => {
        // Restaurar stock y crear un cofre para avanzar
        await MateriaPrima.update(
            { cantidad_total_base: 1000 },
            { where: { id_materia: 1 } }
        );

        // Rellenar lotes PEPS
        await Entrada.create({
            id_materia: 1,
            id_proveedor: 1,
            cantidad_presentacion_comprada: 10,
            cantidad_base_total: 1000,
            stock_restante_lote: 1000,
            costo_unitario: 15,
            costo_total_compra: 15000
        });

        // Iniciar producción para tener un cofre
        const res = await request(app)
            .post('/api/produccion')
            .set(authHeaders())
            .send({ id_modelo: 1, id_trabajador: 1 });

        cofreId = res.body.id;
    });

    test('debe avanzar a la siguiente etapa', async () => {
        const res = await request(app)
            .post('/api/avanzar')
            .set(authHeaders())
            .send({
                id_cofre: cofreId,
                id_etapa_nueva: 2,
                id_trabajador: 1,
                materialesExtra: []
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Etapa Avanzada');
    });

    test('debe finalizar producción con TERMINADO', async () => {
        const res = await request(app)
            .post('/api/avanzar')
            .set(authHeaders())
            .send({
                id_cofre: cofreId,
                id_etapa_nueva: 'TERMINADO',
                id_trabajador: 1,
                materialesExtra: []
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Producción Finalizada');

        // Verificar que el cofre quedó como Terminado en la BD
        const cofre = await Cofre.findByPk(cofreId);
        expect(cofre.estado).toBe('Terminado');
    });
});
