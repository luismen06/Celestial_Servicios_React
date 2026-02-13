/**
 * ======================================================
 *  SCRIPT DE UN SOLO USO - HASHEAR CONTRASEÑAS
 * ======================================================
 * 
 *  Instrucciones:
 *  1. Inserta tu usuario y contraseña directamente en la
 *     tabla "users" de la base de datos (texto plano).
 *  2. Ejecuta este script: node hashPassword.js
 *  3. BORRA este archivo después de ejecutarlo.
 * 
 * ======================================================
 */

const bcrypt = require('bcryptjs');
const sequelize = require('./src/config/database');
const Usuario = require('./src/models/Usuario');

async function hashearContraseñas() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos.\n');

        const usuarios = await Usuario.findAll();

        if (usuarios.length === 0) {
            console.log('⚠️  No se encontraron usuarios en la tabla "users".');
            console.log('   Inserta al menos un usuario antes de ejecutar este script.');
            process.exit(0);
        }

        let hasheados = 0;
        for (const user of usuarios) {
            // Detectar si ya está hasheada (bcrypt siempre empieza con $2a$ o $2b$)
            if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
                const hash = await bcrypt.hash(user.password, 10);
                user.password = hash;
                await user.save();
                console.log(`🔐 Contraseña de "${user.username}" hasheada correctamente.`);
                hasheados++;
            } else {
                console.log(`✔️  "${user.username}" ya tiene contraseña hasheada, se omite.`);
            }
        }

        console.log(`\n✅ Proceso completado. ${hasheados} contraseña(s) hasheada(s).`);
        console.log('🗑️  IMPORTANTE: Ahora borra este archivo (hashPassword.js).');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

hashearContraseñas();
