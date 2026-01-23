// client/src/api/axiosConfig.js
import axios from 'axios';

// Si existe la variable de entorno (Nube), úsala. Si no, usa localhost.
const baseURL = import.meta.env.VITE_API_URL || 'https://celestial-servicios-react.onrender.com';

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;