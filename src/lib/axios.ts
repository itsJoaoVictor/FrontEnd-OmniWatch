import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
    
    // Se receber 401, a requisição não for de login e ainda não tentou dar retry
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url !== '/api/auth/login' &&
      originalRequest.url !== '/api/auth/refresh'
    ) {
      if (isRefreshing) {
        // Se já está renovando, coloca na fila e aguarda
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenta renovar o token
        await api.post('/api/auth/refresh');
        
        isRefreshing = false;
        processQueue(null); // Resolve fila de espera
        
        // Se der certo, repete a requisição original
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError); // Rejeita fila de espera
        
        // Se falhar (ex: refresh_token expirado/inválido), apenas rejeita
        // Opcionalmente, pode redirecionar para o login aqui
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
