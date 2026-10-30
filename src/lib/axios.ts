import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se receber 401, a requisição não for de autenticação e ainda não tentou dar retry
    if (
      error.response?.status === 401 && 
      originalRequest &&
      !originalRequest._retry && 
      originalRequest.url !== '/api/auth/login' &&
      originalRequest.url !== '/api/auth/refresh' &&
      originalRequest.url !== '/api/auth/logout'
    ) {
      if (isRefreshing) {
        // Se já está renovando o token, enfileira a requisição
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          originalRequest._retry = true;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenta renovar a sessão silenciosamente
        await api.post('/api/auth/refresh');
        
        isRefreshing = false;
        processQueue(null); // Resolve requisições na fila de espera
        
        return api(originalRequest);
      } catch (refreshError: any) {
        isRefreshing = false;
        processQueue(refreshError); // Rejeita requisições pendentes
        
        // Se a sessão expirou de fato (401 no refresh), limpa estado e redireciona com segurança
        if (typeof window !== 'undefined') {
          document.cookie = 'is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax';
          const path = window.location.pathname;
          if (path !== '/login' && !path.startsWith('/login') && !path.startsWith('/forgot-password')) {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
