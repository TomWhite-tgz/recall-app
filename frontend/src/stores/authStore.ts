import { create } from 'zustand';
import { authAPI } from '../api/services';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loadToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      set({ token, isLoggedIn: true, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('登录失败');
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true });
    try {
      await authAPI.register({ email, username, password });
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('注册失败');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  loadToken: () => {
    const token = localStorage.getItem('token');
    set({ token, isLoggedIn: !!token });
  },
}));