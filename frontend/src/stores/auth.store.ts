'use client';

import { create } from 'zustand';
import type { UserType } from '@/types/domain.types';

interface AuthUser {
  id: string;
  email: string | null;
  role?: string;
  userType?: UserType;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export function useAuth() {
  const { user, isLoading, setUser, clearUser, setLoading } = useAuthStore();
  const userType = user?.userType;
  const isAdmin = user?.role === 'ADMIN' && userType === 'SYSTEM_ADMIN';
  const isLandlord = userType === 'LANDLORD';
  return {
    user,
    isLoading,
    setUser,
    clearUser,
    setLoading,
    userType,
    isAdmin,
    isLandlord,
  };
}
