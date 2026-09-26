import { create } from 'zustand';
import { api } from '@/lib/axios';
import { resilientFetch } from '@/lib/resilient-fetch';
import { toast } from '@/components/ui/toast';

export type ListStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped' | 'upcoming';

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
  release_date?: string | null;
}

export interface EpisodeProgress {
  season_number: number;
  episode_number: number;
  rating?: number | null;
}

interface MyListStore {
  items: Record<number, SavedItem>;
  episodeProgress: Record<number, EpisodeProgress[]>;
  isLoading: boolean;
  fetchMyList: () => Promise<void>;
  fetchProgress: (tmdb_id: number) => Promise<void>;
  toggleEpisode: (tmdb_id: number, season: number, episode: number, isWatched: boolean) => Promise<void>;
  addToList: (
    tmdb_id: number,
    media_type: 'movie' | 'tv',
    extra?: {
      title?: string | null;
      poster_path?: string | null;
      backdrop_path?: string | null;
      release_date?: string | null;
      status?: ListStatus;
    }
  ) => Promise<void>;
  updateStatus: (tmdb_id: number, newStatus: ListStatus) => Promise<void>;
  updateRating: (tmdb_id: number, rating: number) => Promise<void>;
  updateEpisodeRating: (tmdb_id: number, season: number, episode: number, rating: number) => Promise<void>;
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
        const rawTmdbId = item.media?.tmdb_id ?? item.tmdb_id;
        const parsedTmdbId = typeof rawTmdbId === 'string' ? parseInt(rawTmdbId, 10) : Number(rawTmdbId);
        const tmdbId = (!isNaN(parsedTmdbId) && parsedTmdbId > 0) ? parsedTmdbId : (typeof item.id === 'number' ? item.id : undefined);
        if (tmdbId) {
          itemsMap[tmdbId] = {
            id: item.id?.toString() || String(tmdbId),
            tmdb_id: tmdbId,
            status: item.status || 'plan_to_watch',
            rating: item.rating,
            media_type: item.media?.media_type || item.media_type || 'movie',
            title: item.media?.title || item.title || 'Título Desconhecido',
            poster_path: item.media?.poster_path || item.poster_path,
            backdrop_path: item.media?.backdrop_path || item.backdrop_path,
            last_watched_at: item.last_watched_at,
            release_date: item.media?.release_date ?? item.release_date ?? null,
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

  addToList: async (tmdb_id, media_type, extra) => {
    const numericTmdbId = Number(tmdb_id);
    if (!numericTmdbId || isNaN(numericTmdbId)) {
      console.warn('Cannot add to list: invalid tmdb_id', tmdb_id);
      return;
    }

    const effectiveReleaseDate = extra?.release_date;
    const isReleased = Boolean(
      effectiveReleaseDate && 
      typeof effectiveReleaseDate === 'string' && 
      effectiveReleaseDate.trim() !== '' && 
      new Date(effectiveReleaseDate.trim()) <= new Date()
    );
    let targetStatus: ListStatus = extra?.status || (isReleased ? 'plan_to_watch' : 'upcoming');
    if (!isReleased && (targetStatus === 'completed' || targetStatus === 'watching')) {
      targetStatus = 'upcoming';
    }

    const tempId = `temp-${Date.now()}`;
    // Optimistic update
    set((state) => ({
      items: {
        ...state.items,
        [numericTmdbId]: {
          id: tempId,
          tmdb_id: numericTmdbId,
          status: targetStatus,
          media_type,
          title: extra?.title || undefined,
          poster_path: extra?.poster_path || undefined,
          backdrop_path: extra?.backdrop_path || undefined,
          release_date: extra?.release_date || null,
        }
      }
    }));

    try {
      const data = await resilientFetch<any>('/api/my-list', {
        method: 'POST',
        body: {
          tmdb_id: numericTmdbId,
          media_type,
          status: targetStatus,
          title: extra?.title || undefined,
          poster_path: extra?.poster_path || undefined,
          backdrop_path: extra?.backdrop_path || undefined,
          release_date: extra?.release_date || undefined,
        },
      });
      // Update with the real internal ID and media from DB
      set((state) => ({
        items: {
          ...state.items,
          [numericTmdbId]: {
            ...state.items[numericTmdbId],
            id: data.id,
            tmdb_id: data.media?.tmdb_id || numericTmdbId,
            status: data.status || targetStatus,
            media_type: data.media?.media_type || state.items[numericTmdbId]?.media_type || media_type,
            title: data.media?.title || state.items[numericTmdbId]?.title || extra?.title || undefined,
            poster_path: data.media?.poster_path || state.items[numericTmdbId]?.poster_path || extra?.poster_path || undefined,
            backdrop_path: data.media?.backdrop_path || state.items[numericTmdbId]?.backdrop_path || extra?.backdrop_path || undefined,
            release_date: data.media?.release_date ?? extra?.release_date ?? null,
          }
        }
      }));

      if (data.status === 'upcoming') {
        toast.add({
          title: "Adicionado a 'Aguardando Estreia'",
          description: "Avisaremos você assim que o título for lançado!",
          type: "success"
        });
      }
    } catch (error) {
      console.error('Failed to add to list', error);
      // Revert optimistic update
      set((state) => {
        const newItems = { ...state.items };
        delete newItems[numericTmdbId];
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
      const data = await resilientFetch<any>(`/api/my-list/${item.id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      const finalStatus = data?.status || newStatus;
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: { ...item, status: finalStatus }
        }
      }));
      if (item.media_type === 'tv' && (newStatus === 'completed' || finalStatus === 'watching')) {
        await get().fetchProgress(tmdb_id);
      }
    } catch (error: any) {
      console.error('Failed to update status', error);
      // Revert
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: { ...item, status: oldStatus }
        }
      }));
      const errorDetail = error?.response?.data?.detail;
      if (errorDetail) {
        toast.add({
          title: "Ação não permitida",
          description: errorDetail,
          type: "error"
        });
      }
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
      await resilientFetch(`/api/my-list/${item.id}`, {
        method: 'PATCH',
        body: { rating },
      });
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

  updateEpisodeRating: async (tmdb_id, season, episode, rating) => {
    let item = get().items[tmdb_id];
    if (!item) {
      await get().addToList(tmdb_id, 'tv');
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) return;
    } else if (item.id.startsWith('temp-')) {
      let retries = 0;
      while (get().items[tmdb_id]?.id?.startsWith('temp-') && retries < 50) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }
      item = get().items[tmdb_id];
      if (!item || item.id.startsWith('temp-')) return;
    }

    const prevProgress = get().episodeProgress[tmdb_id] || [];
    const exists = prevProgress.find(p => p.season_number === season && p.episode_number === episode);

    // Optimistic update
    set((state) => ({
      episodeProgress: {
        ...state.episodeProgress,
        [tmdb_id]: exists
          ? prevProgress.map(p => (p.season_number === season && p.episode_number === episode ? { ...p, rating } : p))
          : [...prevProgress, { season_number: season, episode_number: episode, rating }]
      }
    }));

    try {
      await api.patch(`/api/my-list/${item.id}/progress/${season}/${episode}/rating`, { rating });
    } catch (error) {
      console.error('Failed to update episode rating', error);
      // rollback
      set((state) => ({
        episodeProgress: {
          ...state.episodeProgress,
          [tmdb_id]: prevProgress
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
      await resilientFetch(`/api/my-list/${item.id}`, {
        method: 'DELETE',
      });
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
