import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  // Attach JWT to every request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Auto-refresh on 401
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiResponse<null>>) => {
      const original = error.config as typeof error.config & { _retry?: boolean };
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post<ApiResponse<{ access_token: string }>>(
              `${BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );
            if (data.data?.access_token) {
              localStorage.setItem('access_token', data.data.access_token);
              instance.defaults.headers.common.Authorization = `Bearer ${data.data.access_token}`;
              return instance(original);
            }
          } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const api = createApiClient();

// Helper to unwrap ApiResponse
export async function apiCall<T>(fn: () => Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data: response } = await fn();
  if (response.status === 'error' || !response.data) {
    throw new Error(response.error?.message || 'API error');
  }
  return response.data;
}
