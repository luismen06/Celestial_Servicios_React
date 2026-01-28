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

export default api;