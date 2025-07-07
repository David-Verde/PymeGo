import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Configuración dinámica de la URL base
const isProduction = window.location.hostname !== 'localhost';
const baseURL = isProduction
  ? 'https://pymego-backend.onrender.com/api' 
  : 'http://localhost:3000/api';               

const apiClient = axios.create({
  baseURL, // Usa la URL condicional
  headers: {
    'Content-Type': 'application/json',
  },
});



// Interceptor para añadir el token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores 401 (no autorizado)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;