import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function useAuth() {
  const store = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    store.setAuth(result.user as Parameters<typeof store.setAuth>[0], result.tenant, result.access_token, result.refresh_token);
    navigate('/dashboard');
  }, [store, navigate]);

  const logout = useCallback(async () => {
    await authService.logout();
    store.clearAuth();
    navigate('/login');
  }, [store, navigate]);

  return { ...store, login, logout };
}
