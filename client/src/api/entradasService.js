import api from './axiosConfig';

export const entradasService = {
    // Obtener historial de compras
    obtenerEntradas: async () => {
        const response = await api.get('/entradas');
        return response.data;
    },

    // Registrar una compra (Esto aumenta el stock y crea el lote PEPS)
    registrarEntrada: async (datos) => {
        // datos: { id_materia, id_proveedor, cantidad, costo }
        const response = await api.post('/entradas', datos);
        return response.data;
    }
};