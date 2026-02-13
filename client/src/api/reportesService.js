import api from './axiosConfig';

export const reportesService = {
    // Descargar el PDF con autenticación JWT
    descargarReporteCofre: async (idCofre) => {
        try {
            const response = await api.get(`/reportes/orden/${idCofre}`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Liberar el objeto URL después de un tiempo
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Error descargando reporte:', error);
            throw error;
        }
    },

    descargarReporteConsumo: async () => {
        try {
            const response = await api.get('/reportes/consumo', {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Error descargando reporte de consumo:', error);
            throw error;
        }
    },

    descargarReporteFinanciero: async () => {
        try {
            const response = await api.get('/reportes/financiero', {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Error descargando reporte financiero:', error);
            throw error;
        }
    }
};