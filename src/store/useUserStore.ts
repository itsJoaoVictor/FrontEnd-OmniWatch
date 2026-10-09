import { create } from 'zustand';
import { UserProfile } from '@/types/user';
import { userService } from '@/services/userService';

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  fetchUser: () => Promise<UserProfile | null>;
  updateUsername: (username: string) => Promise<UserProfile>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user, isInitialized: true }),

  clearUser: () => set({ user: null, isInitialized: false, isLoading: false }),

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await userService.getMe();
      set({ user, isLoading: false, isInitialized: true });
      return user;
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
      return null;
    }
  },

  updateUsername: async (username: string) => {
    const updated = await userService.updateUsername(username);
    set({ user: updated });
    return updated;
  },
}));
