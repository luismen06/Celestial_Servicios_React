import api from './axiosConfig';

export const inventarioService = {
    // Obtener toda la lista
    obtenerTodo: async () => {
        const response = await api.get('/inventario');
        return response.data;
    },

    // Crear nueva materia prima
    crearMateria: async (datos) => {
        const response = await api.post('/inventario', datos);
        return response.data;
    },

    // Verificar stock (útil para validaciones futuras)
    verificarStock: async (lista) => {
        const response = await api.post('/inventario/verificar', { lista });
        return response.data;
    }
};