import api from './axiosConfig';

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },

    verificarSesion: async () => {
        const response = await api.get('/auth/verificar');
        return response.data;
    }
};
