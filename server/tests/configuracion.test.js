/**
 * configuracion.test.js - Tests de la configuración general
 * 
 * Cubre: CRUD de modelos, trabajadores y proveedores.
 * También verifica la protección contra borrado de modelos en uso.
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

describe('GET /api/configuracion', () => {
    test('debe retornar modelos, trabajadores y proveedores', async () => {
        const res = await request(app)
            .get('/api/configuracion')
            .set(authHeaders());

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('modelos');
        expect(res.body).toHaveProperty('trabajadores');
        expect(res.body).toHaveProperty('proveedores');
        expect(Array.isArray(res.body.modelos)).toBe(true);
    });
});

describe('Modelos de Cofre', () => {
    test('debe crear un nuevo modelo', async () => {
        const res = await request(app)
            .post('/api/config/modelos')
            .set(authHeaders())
            .send({ nombre: 'Cofre Premium' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Creado');
    });

    test('debe actualizar un modelo existente', async () => {
        const res = await request(app)
            .post('/api/config/modelos')
            .set(authHeaders())
            .send({ nombre: 'Cofre Premium XL', id_modelo: 1 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Actualizado');
    });

    test('NO debe eliminar modelo con receta asociada', async () => {
        // El modelo 1 tiene una receta en el setup
        const res = await request(app)
            .delete('/api/config/modelos/1')
            .set(authHeaders());

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('No se puede eliminar');
    });
});

describe('Trabajadores', () => {
    test('debe crear un trabajador activo', async () => {
        const res = await request(app)
            .post('/api/config/trabajadores')
            .set(authHeaders())
            .send({ nombre: 'Carlos Pérez', activo: true });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Creado');
    });

    test('debe actualizar estado de un trabajador', async () => {
        const res = await request(app)
            .post('/api/config/trabajadores')
            .set(authHeaders())
            .send({ nombre: 'Test Worker', activo: false, id_trabajador: 1 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Actualizado');
    });
});

describe('Proveedores', () => {
    test('debe crear un proveedor', async () => {
        const res = await request(app)
            .post('/api/config/proveedores')
            .set(authHeaders())
            .send({ nombre: 'Maderas del Norte' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Creado');
    });
});

describe('Catálogos rápidos', () => {
    test('GET /api/modelos debe retornar lista', async () => {
        const res = await request(app)
            .get('/api/modelos')
            .set(authHeaders());

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/etapas debe retornar etapas ordenadas', async () => {
        const res = await request(app)
            .get('/api/etapas')
            .set(authHeaders());

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3); // Setup crea 3 etapas
        // Verificar orden ascendente
        expect(res.body[0].nombre).toBe('Corte');
        expect(res.body[2].nombre).toBe('Acabado');
    });

    test('GET /api/trabajadores solo debe retornar activos', async () => {
        const res = await request(app)
            .get('/api/trabajadores')
            .set(authHeaders());

        expect(res.status).toBe(200);
        // El test anterior desactivó al worker 1, pero creó a Carlos como activo
        res.body.forEach(t => {
            // Este endpoint filtra por activo=true
            expect(t.activo).toBeTruthy();
        });
    });
});
