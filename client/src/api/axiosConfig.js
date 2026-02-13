// client/src/api/axiosConfig.js
import axios from 'axios';

// Si existe la variable de entorno (Nube), úsala. Si no, usa localhost.
const baseURL = 'https://celestial-servicios-react.onrender.com/api';

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor de REQUEST: adjuntar token JWT a cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de RESPONSE: redirigir a /login si recibe 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Solo redirigir si no estamos ya en /login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;