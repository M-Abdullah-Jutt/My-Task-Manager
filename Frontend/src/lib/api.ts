// src/lib/api.ts

import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const getAccessToken = () => Cookies.get('accessToken');
const getRefreshToken = () => Cookies.get('refreshToken');

const setTokens = (accessToken: string, refreshToken: string) => {
    const isProduction = process.env.NODE_ENV === 'production';
    Cookies.set('accessToken', accessToken, { expires: 1 / 24, secure: isProduction });
    Cookies.set('refreshToken', refreshToken, { expires: 7, secure: isProduction });
};

const clearAuthData = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: { resolve: (value: any) => void; reject: (reason?: any) => void; config: any }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(api(prom.config));
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;
        const isOriginalRequestRetry = (originalRequest as any)._isRetry || false;

        if (error.response?.status === 401 && originalRequest && !isOriginalRequestRetry) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                })
                    .then(() => api(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            (originalRequest as any)._isRetry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();

            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { // <-- Must have '/api/' here
                        refreshToken: refreshToken
                    });

                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

                    setTokens(newAccessToken, newRefreshToken);

                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);

                } catch (refreshError: any) {
                    processQueue(refreshError, null);
                    clearAuthData();
                    toast.error('Session expired. Please log in again.');
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                clearAuthData();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);