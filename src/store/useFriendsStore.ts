import { create } from 'zustand';
import { friendsService } from '@/services/friendsService';

interface FriendsStoreState {
  pendingCount: number;
  isLoading: boolean;
  setPendingCount: (count: number) => void;
  fetchPendingCount: () => Promise<number>;
}

let inFlightPendingCount: Promise<number> | null = null;

export const useFriendsStore = create<FriendsStoreState>((set) => ({
  pendingCount: 0,
  isLoading: false,

  setPendingCount: (count) => set({ pendingCount: count }),

  fetchPendingCount: async () => {
    if (inFlightPendingCount) {
      return inFlightPendingCount;
    }

    inFlightPendingCount = (async () => {
      try {
        const count = await friendsService.getPendingCount();
        set({ pendingCount: count });
        return count;
      } catch {
        return 0;
      } finally {
        inFlightPendingCount = null;
      }
    })();

    return inFlightPendingCount;
  },
}));
