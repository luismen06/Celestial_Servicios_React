import api from './axiosConfig';

export const produccionService = {
    // --- RECETAS ---
    obtenerReceta: async (idModelo) => {
        const response = await api.get(`/recetas/${idModelo}`);
        return response.data;
    },
    agregarIngrediente: async (datos) => {
        // datos: { id_modelo, id_materia, cantidad }
        const response = await api.post('/recetas', datos);
        return response.data;
    },
    eliminarIngrediente: async (idReceta) => {
        const response = await api.delete(`/recetas/${idReceta}`);
        return response.data;
    },

    // --- ETAPAS (Auxiliar) ---
    obtenerEtapas: async () => {
        const response = await api.get('/etapas'); // Endpoint definido en server.js
        return response.data;
    },

    // --- PRODUCCIÓN (Tablero) ---
    obtenerProduccion: async () => {
        const response = await api.get('/produccion');
        return response.data;
    },
    iniciarProduccion: async (datos) => {
        // datos: { id_modelo, id_trabajador }
        const response = await api.post('/produccion', datos);
        return response.data;
    },
    avanzarEtapa: async (datos) => {
        // datos: { id_cofre, id_etapa_nueva, id_trabajador }
        const response = await api.post('/produccion/avanzar', datos);
        return response.data;
    }
};
