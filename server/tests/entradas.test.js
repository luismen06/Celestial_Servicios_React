/**
 * entradas.test.js - Tests del módulo de compras (entradas)
 * 
 * Cubre: listar entradas, registrar una compra nueva,
 * y verificar que el stock se actualice correctamente.
 */

const request = require('supertest');
const app = require('../app');
const { setupDatabase, teardownDatabase } = require('./setup');
const { authHeaders } = require('./helpers');
const { MateriaPrima } = require('../src/models/asociaciones');

beforeAll(async () => {
    await setupDatabase();
});

afterAll(async () => {
    await teardownDatabase();
});

describe('GET /api/entradas', () => {
    test('debe retornar lista de entradas', async () => {
        const res = await request(app)
            .get('/api/entradas')
            .set(authHeaders());

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // El setup crea 1 entrada semilla
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('cada entrada debe tener campos transformados', async () => {
        const res = await request(app)
            .get('/api/entradas')
            .set(authHeaders());

        const entrada = res.body[0];
        expect(entrada).toHaveProperty('id_entrada');
        expect(entrada).toHaveProperty('cantidad');
        expect(entrada).toHaveProperty('costo');
        expect(entrada).toHaveProperty('materia');
        expect(entrada).toHaveProperty('proveedor');
    });
});

describe('POST /api/entradas', () => {
    test('debe registrar compra y actualizar stock', async () => {
        // Stock antes de la compra
        const materiaBefore = await MateriaPrima.findByPk(1);
        const stockAntes = parseFloat(materiaBefore.cantidad_total_base);

        const res = await request(app)
            .post('/api/entradas')
            .set(authHeaders())
            .send({
                id_materia: 1,
                id_proveedor: 1,
                cantidad: 3,          // 3 presentaciones
                costo: 3000           // $3000 total
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('registrada');

        // Stock después: 3 presentaciones * 100 unidades/presentación = +300
        const materiaAfter = await MateriaPrima.findByPk(1);
        const stockDespues = parseFloat(materiaAfter.cantidad_total_base);
        expect(stockDespues).toBe(stockAntes + 300);
    });

    test('debe rechazar material inexistente', async () => {
        const res = await request(app)
            .post('/api/entradas')
            .set(authHeaders())
            .send({
                id_materia: 9999,
                id_proveedor: 1,
                cantidad: 1,
                costo: 100
            });

        expect(res.status).toBe(404);
    });
});
