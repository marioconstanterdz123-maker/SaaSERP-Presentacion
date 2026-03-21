import axios from 'axios';

const API_URL = 'http://localhost:5202/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: inyectar el Token JWT en cada request automáticamente
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('saas_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: si el servidor dice 401, limpiamos sesión y mandamos al Login
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('saas_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

