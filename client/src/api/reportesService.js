import api from './axiosConfig';

export const reportesService = {
    // Descargar el PDF (Esto abre una nueva pestaña con el archivo generado por el backend)
    descargarReporteCofre: (idCofre) => {
        // Asumiendo que tu backend corre en el puerto 3000
        const url = `http://localhost:3000/api/reportes/orden/${idCofre}`;
        window.open(url, '_blank');
    }
};