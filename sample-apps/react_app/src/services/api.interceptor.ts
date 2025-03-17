import axios, { AxiosError } from 'axios';
import authService from './auth.service';

const apiInterceptor = axios.create();

apiInterceptor.interceptors.request.use(
    config => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

apiInterceptor.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            //authService.clearToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiInterceptor;
