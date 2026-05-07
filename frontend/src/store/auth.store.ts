import { create } from 'zustand';

export type UserRole =
  | 'STUDENT'
  | 'TRAINER'
  | 'INSTITUTION'
  | 'PROGRAMME_MANAGER'
  | 'MONITORING_OFFICER';

export interface AppUser {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
}

interface AuthStore {
  user: AppUser | null;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));