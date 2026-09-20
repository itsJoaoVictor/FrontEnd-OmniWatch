import { create } from 'zustand';
import { api } from '@/lib/axios';

export type ListStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped';

export interface SavedItem {
  id: string; // internal DB id
  tmdb_id: number;
  status: ListStatus;
  media_type: 'movie' | 'tv';
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  rating?: number;
  last_watched_at?: string;
}

export interface EpisodeProgress {
  season_number: number;
  episode_number: number;
}

interface MyListStore {
  items: Record<number, SavedItem>;
  episodeProgress: Record<number, EpisodeProgress[]>;
  isLoading: boolean;
  fetchMyList: () => Promise<void>;
  fetchProgress: (tmdb_id: number) => Promise<void>;
  toggleEpisode: (tmdb_id: number, season: number, episode: number, isWatched: boolean) => Promise<void>;
  addToList: (tmdb_id: number, media_type: 'movie' | 'tv') => Promise<void>;
  updateStatus: (tmdb_id: number, newStatus: ListStatus) => Promise<void>;
  updateRating: (tmdb_id: number, rating: number) => Promise<void>;
  removeFromList: (tmdb_id: number) => Promise<void>;
  bulkMarkEpisodes: (tmdb_id: number, season: number, episode: number) => Promise<void>;
}

export const useMyListStore = create<MyListStore>((set, get) => ({
  items: {},
  episodeProgress: {},
  isLoading: false,
  
  fetchMyList: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/api/my-list');
      const itemsMap: Record<number, SavedItem> = {};
      res.data.forEach((item: any) => {
        const tmdbId = item.media?.tmdb_id || item.tmdb_id; // Fallback just in case
        if (tmdbId) {
          itemsMap[tmdbId] = {
            id: item.id,
            tmdb_id: tmdbId,
            status: item.status,
            rating: item.rating,
            media_type: item.media?.media_type || item.media_type,
            title: item.media?.title || item.title,
            poster_path: item.media?.poster_path || item.poster_path,
            backdrop_path: item.media?.backdrop_path || item.backdrop_path,
            last_watched_at: item.last_watched_at,
          };
        }
      });
      set({ items: itemsMap });
    } catch (error) {
      console.error('Failed to fetch my list', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProgress: async (tmdb_id) => {
    const item = get().items[tmdb_id];
    if (!item) return;
    try {
      const res = await api.get(`/api/my-list/${item.id}/progress`);
      set((state) => ({
        episodeProgress: {
          ...state.episodeProgress,
          [tmdb_id]: res.data
        }
      }));
    } catch (error) {
      console.error('Failed to fetch progress', error);
    }
  },

  toggleEpisode: async (tmdb_id, season, episode, isWatched) => {
    let item = get().items[tmdb_id];
    if (!item) {
      if (!isWatched) return; // Can't unmark an episode if series isn't in list
      await get().addToList(tmdb_id, 'tv');
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) return; // Failed to add to list or stuck
      
      // Backend will automatically switch to watching, let's mirror it optimistically
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: { ...state.items[tmdb_id], status: 'watching' }
        }
      }));
    } else {
      if (item.id.startsWith('temp-')) {
        let retries = 0;
        while (get().items[tmdb_id]?.id?.startsWith('temp-') && retries < 50) {
          await new Promise(r => setTimeout(r, 100));
          retries++;
        }
        item = get().items[tmdb_id];
        if (!item || item.id.startsWith('temp-')) return;
      }
      
      if (item.status === 'plan_to_watch' && isWatched) {
        set((state) => ({
          items: {
            ...state.items,
            [tmdb_id]: { ...item, status: 'watching' }
          }
        }));
      }
    }

    // Optimistic update
    const prevProgress = get().episodeProgress[tmdb_id] || [];
    set((state) => ({
      episodeProgress: {
        ...state.episodeProgress,
        [tmdb_id]: isWatched 
          ? [...prevProgress, { season_number: season, episode_number: episode }]
          : prevProgress.filter(p => !(p.season_number === season && p.episode_number === episode))
      }
    }));

    try {
      if (isWatched) {
        await api.post(`/api/my-list/${item.id}/progress`, { season_number: season, episode_number: episode });
      } else {
        await api.delete(`/api/my-list/${item.id}/progress/${season}/${episode}`);
      }
    } catch (error) {
      console.error('Failed to toggle episode', error);
      // Revert
      set((state) => ({
        episodeProgress: {
          ...state.episodeProgress,
          [tmdb_id]: prevProgress
        }
      }));
    }
  },

  addToList: async (tmdb_id, media_type) => {
    const tempId = `temp-${Date.now()}`;
    // Optimistic update
    set((state) => ({
      items: {
        ...state.items,
        [tmdb_id]: {
          id: tempId,
          tmdb_id,
          status: 'plan_to_watch',
          media_type,
        }
      }
    }));

    try {
      const res = await api.post('/api/my-list', { tmdb_id, media_type, status: 'plan_to_watch' });
      // Update with the real internal ID from DB
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: { ...state.items[tmdb_id], id: res.data.id }
        }
      }));
    } catch (error) {
      console.error('Failed to add to list', error);
      // Revert optimistic update
      set((state) => {
        const newItems = { ...state.items };
        delete newItems[tmdb_id];
        return { items: newItems };
      });
    }
  },

  updateStatus: async (tmdb_id, newStatus) => {
    let item = get().items[tmdb_id];
    if (!item) return;

    if (item.id.startsWith('temp-')) {
      let retries = 0;
      while (get().items[tmdb_id]?.id?.startsWith('temp-') && retries < 50) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) return;
    }

    const oldStatus = item.status;
    
    // Optimistic update
    set((state) => ({
      items: {
        ...state.items,
        [tmdb_id]: { ...item, status: newStatus }
      }
    }));

    try {
      await api.patch(`/api/my-list/${item.id}`, { status: newStatus });
      if (newStatus === 'completed' && item.media_type === 'tv') {
        await get().fetchProgress(tmdb_id);
      }
    } catch (error) {
      console.error('Failed to update status', error);
      // Revert
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: { ...item, status: oldStatus }
        }
      }));
    }
  },

  updateRating: async (tmdb_id, rating) => {
    let item = get().items[tmdb_id];
    if (!item) return;

    if (item.id.startsWith('temp-')) {
      let retries = 0;
      while (get().items[tmdb_id]?.id?.startsWith('temp-') && retries < 50) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) return;
    }

    const oldRating = item.rating;
    set((state) => ({
      items: {
        ...state.items,
        [tmdb_id]: { ...item, rating }
      }
    }));

    try {
      await api.patch(`/api/my-list/${item.id}`, { rating });
    } catch (error) {
      console.error('Failed to update rating', error);
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: { ...item, rating: oldRating }
        }
      }));
    }
  },

  removeFromList: async (tmdb_id) => {
    let item = get().items[tmdb_id];
    if (!item) return;

    if (item.id.startsWith('temp-')) {
      let retries = 0;
      while (get().items[tmdb_id]?.id?.startsWith('temp-') && retries < 50) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) {
         // if it's still stuck or removed, just optimistically delete and return
         set((state) => {
           const newItems = { ...state.items };
           delete newItems[tmdb_id];
           return { items: newItems };
         });
         return;
      }
    }

    // Optimistic update
    set((state) => {
      const newItems = { ...state.items };
      delete newItems[tmdb_id];
      return { items: newItems };
    });

    try {
      await api.delete(`/api/my-list/${item.id}`);
    } catch (error) {
      console.error('Failed to remove from list', error);
      // Revert
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: item
        }
      }));
    }
  },

  bulkMarkEpisodes: async (tmdb_id, season, episode) => {
    let item = get().items[tmdb_id];
    if (!item) return;

    if (item.id.startsWith('temp-')) {
      let retries = 0;
      while (get().items[tmdb_id]?.id?.startsWith('temp-') && retries < 50) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) return;
    }

    try {
      await api.post(`/api/my-list/${item.id}/progress/bulk`, { season_number: season, episode_number: episode });
      // Sync progress
      await get().fetchProgress(tmdb_id);
    } catch (error) {
      console.error('Failed to bulk mark episodes', error);
    }
  }
}));
