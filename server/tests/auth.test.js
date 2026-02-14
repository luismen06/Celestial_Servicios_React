/**
 * auth.test.js - Tests del módulo de autenticación
 * 
 * Cubre: login con credenciales válidas/inválidas,
 * verificación de sesión, y protección de rutas sin token.
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { setupDatabase, teardownDatabase } = require('./setup');
const { generarToken } = require('./helpers');
const Usuario = require('../src/models/Usuario');

beforeAll(async () => {
    await setupDatabase();

    // Crear usuario de prueba con contraseña hasheada
    const hash = await bcrypt.hash('password123', 10);
    await Usuario.create({ username: 'testuser', password: hash });
});

afterAll(async () => {
    await teardownDatabase();
});

describe('POST /api/auth/login', () => {
    test('debe retornar token con credenciales válidas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('usuario');
        expect(res.body.usuario.username).toBe('testuser');
    });

    test('debe retornar 401 con contraseña incorrecta', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    test('debe retornar 401 con usuario inexistente', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'noexiste', password: 'password123' });

        expect(res.status).toBe(401);
    });

    test('debe retornar 400 si faltan campos', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser' }); // Sin password

        expect(res.status).toBe(400);
    });
});

describe('GET /api/auth/verificar', () => {
    test('debe confirmar sesión con token válido', async () => {
        const token = generarToken({ id: 1, username: 'testuser' });
        const res = await request(app)
            .get('/api/auth/verificar')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.autenticado).toBe(true);
    });

    test('debe rechazar petición sin token', async () => {
        const res = await request(app)
            .get('/api/auth/verificar');

        expect(res.status).toBe(401);
    });

    test('debe rechazar token inválido', async () => {
        const res = await request(app)
            .get('/api/auth/verificar')
            .set('Authorization', 'Bearer tokenfalso123');

        expect(res.status).toBe(401);
    });
});

describe('Protección de rutas', () => {
    test('rutas /api/* deben rechazar peticiones sin token', async () => {
        const res = await request(app).get('/api/inventario');
        expect(res.status).toBe(401);
    });

    test('rutas /api/* deben aceptar peticiones con token válido', async () => {
        const token = generarToken();
        const res = await request(app)
            .get('/api/inventario')
            .set('Authorization', `Bearer ${token}`);

        // 200 = ruta accesible (aunque no haya datos devuelve [])
        expect(res.status).toBe(200);
    });
});
