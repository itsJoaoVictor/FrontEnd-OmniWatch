import { create } from 'zustand';
import { friendsService } from '@/services/friendsService';
import { FriendFeedItem } from '@/types/friends';

export type FeedFilterType = 'all' | 'movie' | 'tv';

interface FeedStoreState {
  items: FriendFeedItem[];
  page: number;
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  filter: FeedFilterType;
  friendFilter: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  lastFetched: number | null;
  fetchFeed: (
    pageNum?: number,
    append?: boolean,
    newFilter?: FeedFilterType,
    force?: boolean,
    cursor?: string | null,
    newFriend?: string | null
  ) => Promise<void>;
  setFilter: (filter: FeedFilterType) => Promise<void>;
  setFriendFilter: (friend: string | null) => Promise<void>;
  setFilters: (filter: FeedFilterType, friend: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useFeedStore = create<FeedStoreState>((set, get) => ({
  items: [],
  page: 1,
  nextCursor: null,
  hasMore: false,
  total: 0,
  filter: 'all',
  friendFilter: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  lastFetched: null,

  fetchFeed: async (pageNum = 1, append = false, newFilter, force = false, cursor = null, newFriend) => {
    const state = get();
    const activeFilter = newFilter !== undefined ? newFilter : state.filter;
    const activeFriend = newFriend !== undefined ? newFriend : state.friendFilter;

    // Se já temos dados em cache para os mesmos filtros, não bloqueia com skeleton
    const hasCachedData = state.items.length > 0 && state.filter === activeFilter && state.friendFilter === activeFriend;
    const isStale = !state.lastFetched || Date.now() - state.lastFetched > 30_000; // 30s cache TTL

    if (!append && pageNum === 1) {
      if (!hasCachedData || force) {
        set({ isLoading: !hasCachedData, filter: activeFilter, friendFilter: activeFriend });
      } else if (!isStale) {
        // Cache válido e fresco, não precisa revalidar imediatamente
        return;
      }
    } else {
      set({ isLoadingMore: true });
    }

    try {
      const res = await friendsService.getFeed(pageNum, 15, activeFilter, cursor, activeFriend);
      set((prev) => ({
        items: append ? [...prev.items, ...res.items] : res.items,
        page: pageNum,
        nextCursor: res.next_cursor || null,
        hasMore: res.has_more,
        total: res.total,
        filter: activeFilter,
        friendFilter: activeFriend,
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
    set({ filter, items: [], nextCursor: null, isLoading: true });
    await get().fetchFeed(1, false, filter, true, null, current.friendFilter);
  },

  setFriendFilter: async (friend: string | null) => {
    const current = get();
    if (current.friendFilter === friend && current.items.length > 0) return;
    set({ friendFilter: friend, items: [], nextCursor: null, isLoading: true });
    await get().fetchFeed(1, false, current.filter, true, null, friend);
  },

  setFilters: async (filter: FeedFilterType, friend: string | null) => {
    const current = get();
    if (current.filter === filter && current.friendFilter === friend && current.items.length > 0) return;
    set({ filter, friendFilter: friend, items: [], nextCursor: null, isLoading: true });
    await get().fetchFeed(1, false, filter, true, null, friend);
  },

  refresh: async () => {
    const { filter, friendFilter } = get();
    set({ isRefreshing: true, nextCursor: null });
    await get().fetchFeed(1, false, filter, true, null, friendFilter);
  },

  loadMore: async () => {
    const { hasMore, isLoadingMore, page, nextCursor, filter, friendFilter } = get();
    if (hasMore && !isLoadingMore) {
      await get().fetchFeed(page + 1, true, filter, false, nextCursor, friendFilter);
    }
  },
}));
