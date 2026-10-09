import { create } from 'zustand';
import { friendsService } from '@/services/friendsService';

interface FriendsStoreState {
  pendingCount: number;
  isLoading: boolean;
  setPendingCount: (count: number) => void;
  fetchPendingCount: () => Promise<number>;
}

export const useFriendsStore = create<FriendsStoreState>((set) => ({
  pendingCount: 0,
  isLoading: false,

  setPendingCount: (count) => set({ pendingCount: count }),

  fetchPendingCount: async () => {
    try {
      const count = await friendsService.getPendingCount();
      set({ pendingCount: count });
      return count;
    } catch {
      return 0;
    }
  },
}));
