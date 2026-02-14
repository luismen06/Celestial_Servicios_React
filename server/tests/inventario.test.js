/**
 * inventario.test.js - Tests del módulo de inventario
 * 
 * Cubre: listar materias primas, crear nuevos materiales,
 * y la verificación de stock antes de producción.
 */

const request = require('supertest');
const app = require('../app');
const { setupDatabase, teardownDatabase } = require('./setup');
const { authHeaders } = require('./helpers');

beforeAll(async () => {
    await setupDatabase();
});

afterAll(async () => {
    await teardownDatabase();
});

describe('GET /api/inventario', () => {
    test('debe retornar lista de materias primas', async () => {
        const res = await request(app)
            .get('/api/inventario')
            .set(authHeaders());

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // El setup crea al menos 1 materia prima
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('cada material debe tener los campos esperados', async () => {
        const res = await request(app)
            .get('/api/inventario')
            .set(authHeaders());

        const material = res.body[0];
        expect(material).toHaveProperty('id_materia');
        expect(material).toHaveProperty('nombre');
        expect(material).toHaveProperty('unidad_base');
        expect(material).toHaveProperty('cantidad_total_base');
    });
});

describe('POST /api/inventario', () => {
    test('debe crear una nueva materia prima', async () => {
        const res = await request(app)
            .post('/api/inventario')
            .set(authHeaders())
            .send({
                nombre: 'Pintura Azul',
                unidad_base: 'ml',
                cantidad_total_base: 0,
                presentacion: 'Galón',
                contenido_por_presentacion: 3785
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Guardado');
        expect(res.body).toHaveProperty('id');
    });
});

describe('POST /api/inventario/verificar', () => {
    test('debe confirmar stock suficiente', async () => {
        const res = await request(app)
            .post('/api/inventario/verificar')
            .set(authHeaders())
            .send({
                lista: [{ id_materia: 1, cantidad: 100 }]
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Stock suficiente');
    });

    test('debe retornar 409 si el stock no alcanza', async () => {
        const res = await request(app)
            .post('/api/inventario/verificar')
            .set(authHeaders())
            .send({
                lista: [{ id_materia: 1, cantidad: 99999 }]
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('STOCK_INSUFICIENTE');
        expect(res.body.lista.length).toBe(1);
    });
});
