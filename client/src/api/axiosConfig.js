import axios from 'axios';

// Creamos una instancia configurada apuntando a tu servidor Express
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Tu backend actual
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;