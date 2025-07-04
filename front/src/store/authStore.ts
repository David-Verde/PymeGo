import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUser, IBusiness } from '@/types';

interface AuthState {
  token: string | null;
  user: IUser | null;
  business: IBusiness | null;
  isAuthenticated: boolean;
  setAuth: (data: { token: string; user: IUser; business: IBusiness }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      business: null,
      isAuthenticated: false,
      setAuth: (data) =>
        set({
          token: data.token,
          user: data.user,
          business: data.business,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          business: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // Nombre para el localStorage
    }
  )
);