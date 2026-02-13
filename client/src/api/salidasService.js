import api from './axiosConfig';

export const salidasService = {
    // Obtener historial completo de consumos
    obtenerSalidas: async () => {
        const response = await api.get('/salidas');
        return response.data;
    },

    // (Opcional) Si quisieras registrar mermas manuales en el futuro
    registrarSalida: async (datos) => {
        const response = await api.post('/salidas', datos);
        return response.data;
    }
};