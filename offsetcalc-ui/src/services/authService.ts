import { api, apiCall } from './api';
import { LoginResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiCall(() => api.post('/auth/login', { email, password }));
  },

  async getMe(): Promise<User> {
    return apiCall(() => api.get('/auth/me'));
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
