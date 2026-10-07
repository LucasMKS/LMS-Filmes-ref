import { create } from 'zustand';
import Cookies from 'js-cookie';
import { User } from '../types';
import { authApi } from '../services/api';
import { useUserRatingsStore } from './useUserRatingsStore';
import { useFavoritesStore } from './useFavoritesStore';
import { useWatchlistStore } from './useWatchlistStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const getInitialAuth = () => {
  const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('user_data');
  if (token && storedUser) {
    try {
      return { token, user: JSON.parse(storedUser), isAuthenticated: true };
    } catch {
      return { token: null, user: null, isAuthenticated: false };
    }
  }
  return { token: null, user: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialAuth(),

  initialize: () => {
    const auth = getInitialAuth();
    set(auth);
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, id, name, nickname, role } = res.data;
    const user: User = { id, name, email, nickname, role };

    Cookies.set('auth_token', token, { expires: 7, path: '/' });
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  register: async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    const { token, id, nickname, role } = res.data;
    const user: User = { id, name, email, nickname, role };

    Cookies.set('auth_token', token, { expires: 7, path: '/' });
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    set({ token: null, user: null, isAuthenticated: false });
    useUserRatingsStore.getState().clearRatings();
    useFavoritesStore.getState().clearFavorites();
    useWatchlistStore.getState().clearWatchlist();
  },

  updateUser: (fields) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...fields };
      localStorage.setItem('user_data', JSON.stringify(updated));
      return { user: updated };
    }),
}));
