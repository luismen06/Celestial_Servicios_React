import api from './axiosConfig';

export const configService = {
    // 1. Obtener todas las tablas maestras de una vez
    obtenerTodo: async () => {
        const response = await api.get('/configuracion');
        return response.data; // Retorna { modelos, trabajadores, proveedores }
    },

    // --- MODELOS ---
    guardarModelo: async (datos) => {
        const response = await api.post('/config/modelos', datos);
        return response.data;
    },
    eliminarModelo: async (id) => {
        const response = await api.delete(`/config/modelos/${id}`);
        return response.data;
    },

    // --- TRABAJADORES ---
    guardarTrabajador: async (datos) => {
        const response = await api.post('/config/trabajadores', datos);
        return response.data;
    },

    // --- PROVEEDORES ---
    guardarProveedor: async (datos) => {
        const response = await api.post('/config/proveedores', datos);
        return response.data;
    }
};