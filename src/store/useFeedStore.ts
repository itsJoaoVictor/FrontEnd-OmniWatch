import { create } from 'zustand';
import { friendsService } from '@/services/friendsService';
import { FriendFeedItem } from '@/types/friends';

export type FeedFilterType = 'all' | 'movie' | 'tv';

interface FeedStoreState {
  items: FriendFeedItem[];
  page: number;
  hasMore: boolean;
  total: number;
  filter: FeedFilterType;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  lastFetched: number | null;
  fetchFeed: (pageNum?: number, append?: boolean, newFilter?: FeedFilterType, force?: boolean) => Promise<void>;
  setFilter: (filter: FeedFilterType) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useFeedStore = create<FeedStoreState>((set, get) => ({
  items: [],
  page: 1,
  hasMore: false,
  total: 0,
  filter: 'all',
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  lastFetched: null,

  fetchFeed: async (pageNum = 1, append = false, newFilter, force = false) => {
    const state = get();
    const activeFilter = newFilter !== undefined ? newFilter : state.filter;

    // Se já temos dados em cache para o mesmo filtro, não bloqueia com skeleton
    const hasCachedData = state.items.length > 0 && state.filter === activeFilter;
    const isStale = !state.lastFetched || Date.now() - state.lastFetched > 30_000; // 30s cache TTL

    if (!append && pageNum === 1) {
      if (!hasCachedData || force) {
        set({ isLoading: !hasCachedData, filter: activeFilter });
      } else if (!isStale) {
        // Cache válido e fresco, não precisa revalidar imediatamente
        return;
      }
    } else {
      set({ isLoadingMore: true });
    }

    try {
      const res = await friendsService.getFeed(pageNum, 15, activeFilter);
      set((prev) => ({
        items: append ? [...prev.items, ...res.items] : res.items,
        page: pageNum,
        hasMore: res.has_more,
        total: res.total,
        filter: activeFilter,
        lastFetched: Date.now(),
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      }));
    } catch (error) {
      console.error('Error in useFeedStore.fetchFeed:', error);
      set({ isLoading: false, isLoadingMore: false, isRefreshing: false });
    }
  },

  setFilter: async (filter: FeedFilterType) => {
    const current = get();
    if (current.filter === filter && current.items.length > 0) return;
    set({ filter, items: [], isLoading: true });
    await get().fetchFeed(1, false, filter, true);
  },

  refresh: async () => {
    set({ isRefreshing: true });
    await get().fetchFeed(1, false, undefined, true);
  },

  loadMore: async () => {
    const { hasMore, isLoadingMore, page } = get();
    if (hasMore && !isLoadingMore) {
      await get().fetchFeed(page + 1, true);
    }
  },
}));
