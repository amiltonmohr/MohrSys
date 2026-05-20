import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant } from '../types';

interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, tenant, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, tenant: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'offsetcalc-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
