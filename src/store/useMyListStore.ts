import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/axios';
import { resilientFetch } from '@/lib/resilient-fetch';
import { toast } from '@/components/ui/toast';
import {
  removeUpToDateShowFromCache,
  addUpToDateShowToCache,
  saveCorrectedEpisodesToCache
} from '@/lib/seriesCache';

export type ListStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped' | 'upcoming';

export interface NextEpisodeData {
  season_number: number;
  episode_number: number;
  name?: string | null;
  air_date?: string | null;
  is_released?: boolean;
}

export interface SavedItem {
  id: string; // internal DB id
  tmdb_id: number;
  status: ListStatus;
  media_type: 'movie' | 'tv';
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  rating?: number;
  is_favorite?: boolean;
  last_watched_at?: string;
  release_date?: string | null;
  is_up_to_date?: boolean | null;
  next_episode?: NextEpisodeData | null;
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
      is_favorite?: boolean;
    }
  ) => Promise<void>;
  updateStatus: (tmdb_id: number, newStatus: ListStatus) => Promise<void>;
  updateRating: (tmdb_id: number, rating: number) => Promise<void>;
  updateEpisodeRating: (tmdb_id: number, season: number, episode: number, rating: number) => Promise<void>;
  toggleFavorite: (tmdb_id: number) => Promise<void>;
  removeFromList: (tmdb_id: number) => Promise<void>;
  bulkMarkEpisodes: (tmdb_id: number, season: number, episode: number) => Promise<void>;
}

let inFlightFetchMyList: Promise<void> | null = null;

export const useMyListStore = create<MyListStore>()(
  persist(
    (set, get) => ({
      items: {},
      episodeProgress: {},
      isLoading: false,
      
      fetchMyList: async () => {
        if (inFlightFetchMyList) {
          return inFlightFetchMyList;
        }

        inFlightFetchMyList = (async () => {
          // Apenas ativa isLoading se ainda não tiver itens carregados (padrão SWR)
          if (Object.keys(get().items).length === 0) {
            set({ isLoading: true });
          }
          try {
            const res = await api.get('/api/my-list');
            const rawList = Array.isArray(res?.data)
              ? res.data
              : (Array.isArray(res)
                ? res
                : (Array.isArray(res?.data?.items)
                  ? res.data.items
                  : (Array.isArray(res?.data?.data)
                    ? res.data.data
                    : null)));

            if (!rawList) {
              console.warn('[useMyListStore] Formato inesperado na resposta de /api/my-list:', res?.data);
              return;
            }

            const itemsMap: Record<number, SavedItem> = {};
            const newCorrections: Record<number, { season: number; episode: number }> = {};
            
            rawList.forEach((item: any) => {
              const rawTmdbId = item.media?.tmdb_id ?? item.tmdb_id;
              const parsedTmdbId = typeof rawTmdbId === 'string' ? parseInt(rawTmdbId, 10) : Number(rawTmdbId);
              const tmdbId = (!isNaN(parsedTmdbId) && parsedTmdbId > 0) ? parsedTmdbId : (typeof item.id === 'number' ? item.id : undefined);
              if (tmdbId) {
                itemsMap[tmdbId] = {
                  id: item.id?.toString() || String(tmdbId),
                  tmdb_id: tmdbId,
                  status: item.status || 'plan_to_watch',
                  rating: item.rating,
                  is_favorite: Boolean(item.is_favorite),
                  media_type: item.media?.media_type || item.media_type || 'movie',
                  title: item.media?.title || item.title || 'Título Desconhecido',
                  poster_path: item.media?.poster_path || item.poster_path,
                  backdrop_path: item.media?.backdrop_path || item.backdrop_path,
                  last_watched_at: item.last_watched_at,
                  release_date: item.media?.release_date ?? item.release_date ?? null,
                  is_up_to_date: item.is_up_to_date !== undefined ? item.is_up_to_date : null,
                  next_episode: item.next_episode || null,
                };

                // Sincroniza o cache local com a resposta oficial do backend
                if (item.is_up_to_date === true) {
                  addUpToDateShowToCache(tmdbId);
                } else if (item.is_up_to_date === false) {
                  removeUpToDateShowFromCache(tmdbId);
                }

                if (item.next_episode?.season_number && item.next_episode?.episode_number) {
                  newCorrections[tmdbId] = {
                    season: item.next_episode.season_number,
                    episode: item.next_episode.episode_number,
                  };
                }
              }
            });

            if (Object.keys(newCorrections).length > 0) {
              saveCorrectedEpisodesToCache(newCorrections);
            }

            set({ items: itemsMap });
          } catch (error) {
            console.error('Failed to fetch my list', error);
          } finally {
            set({ isLoading: false });
            inFlightFetchMyList = null;
          }
        })();

        return inFlightFetchMyList;
      },

  fetchProgress: async (tmdb_id) => {
    const item = get().items[tmdb_id];
    if (!item) return;
    try {
      const data = await resilientFetch<EpisodeProgress[]>(`/api/my-list/${item.id}/progress`);
      set((state) => ({
        episodeProgress: {
          ...state.episodeProgress,
          [tmdb_id]: Array.isArray(data) ? data : []
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
    const prevItem = get().items[tmdb_id];

    let optimisticNextEpisode: NextEpisodeData | null = prevItem?.next_episode ? { ...prevItem.next_episode } : null;
    let optimisticIsUpToDate = prevItem?.is_up_to_date ?? false;

    if (isWatched) {
      const curS = prevItem?.next_episode?.season_number ?? season;
      const curE = prevItem?.next_episode?.episode_number ?? episode;
      if (season > curS || (season === curS && episode >= curE)) {
        optimisticNextEpisode = {
          season_number: season,
          episode_number: episode + 1,
          name: `Episódio ${episode + 1}`,
          is_released: true
        };
        saveCorrectedEpisodesToCache({ [tmdb_id]: { season, episode: episode + 1 } });
      }
    } else {
      removeUpToDateShowFromCache(tmdb_id);
      optimisticIsUpToDate = false;
      const curS = prevItem?.next_episode?.season_number;
      const curE = prevItem?.next_episode?.episode_number;
      if (!curS || season < curS || (season === curS && curE !== undefined && episode <= curE)) {
        optimisticNextEpisode = {
          season_number: season,
          episode_number: episode,
          name: `Episódio ${episode}`,
          is_released: true
        };
        saveCorrectedEpisodesToCache({ [tmdb_id]: { season, episode } });
      }
    }

    const optimisticItem: SavedItem | undefined = prevItem ? {
      ...prevItem,
      status: (prevItem.status === 'plan_to_watch' && isWatched) ? 'watching' : prevItem.status,
      last_watched_at: new Date().toISOString(),
      is_up_to_date: optimisticIsUpToDate,
      next_episode: optimisticNextEpisode
    } : undefined;

    set((state) => ({
      items: optimisticItem ? { ...state.items, [tmdb_id]: optimisticItem } : state.items,
      episodeProgress: {
        ...state.episodeProgress,
        [tmdb_id]: isWatched 
          ? [...prevProgress.filter(p => !(p.season_number === season && p.episode_number === episode)), { season_number: season, episode_number: episode }]
          : prevProgress.filter(p => !(p.season_number === season && p.episode_number === episode))
      }
    }));

    try {
      if (isWatched) {
        await resilientFetch(`/api/my-list/${item.id}/progress`, {
          method: 'POST',
          body: { season_number: season, episode_number: episode }
        });
      } else {
        await resilientFetch(`/api/my-list/${item.id}/progress/${season}/${episode}`, {
          method: 'DELETE'
        });
      }
      get().fetchMyList();
      if (get().episodeProgress[tmdb_id]) {
        get().fetchProgress(tmdb_id);
      }
    } catch (error) {
      console.error('Failed to toggle episode', error);
      // Revert optimistic update
      set((state) => ({
        items: prevItem ? { ...state.items, [tmdb_id]: prevItem } : state.items,
        episodeProgress: {
          ...state.episodeProgress,
          [tmdb_id]: prevProgress
        }
      }));
      toast.add({
        title: "Erro ao atualizar episódio",
        description: "Não foi possível salvar o progresso. Tente novamente.",
        type: "error"
      });
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
    const oldRating = item.rating;
    const oldFavorite = item.is_favorite;
    
    // Optimistic update
    const shouldClearRating = ['plan_to_watch', 'upcoming'].includes(newStatus);
    const shouldClearFavorite = !['watching', 'completed'].includes(newStatus);
    set((state) => {
      const currentItem = state.items[tmdb_id] || item;
      return {
        items: {
          ...state.items,
          [tmdb_id]: { 
            ...currentItem, 
            status: newStatus,
            rating: shouldClearRating ? undefined : currentItem.rating,
            is_favorite: shouldClearFavorite ? false : currentItem.is_favorite,
          }
        }
      };
    });

    try {
      const data = await resilientFetch<any>(`/api/my-list/${item.id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      const finalStatus = data?.status || newStatus;
      const finalShouldClearRating = ['plan_to_watch', 'upcoming'].includes(finalStatus);
      const finalShouldClearFavorite = !['watching', 'completed'].includes(finalStatus);
      set((state) => {
        const currentItem = state.items[tmdb_id] || item;
        return {
          items: {
            ...state.items,
            [tmdb_id]: { 
              ...currentItem, 
              status: finalStatus,
              // Preserva a nota atual de currentItem caso o usuário tenha acabado de avaliar!
              rating: finalShouldClearRating ? undefined : (currentItem.rating ?? (data?.rating != null ? data.rating : undefined)),
              is_favorite: finalShouldClearFavorite ? false : (data?.is_favorite !== undefined ? Boolean(data.is_favorite) : currentItem.is_favorite),
            }
          }
        };
      });
      if (item.media_type === 'tv' && (newStatus === 'completed' || finalStatus === 'watching')) {
        get().fetchProgress(tmdb_id);
      }
    } catch (error: any) {
      console.error('Failed to update status', error);
      // Revert
      set((state) => {
        const currentItem = state.items[tmdb_id] || item;
        return {
          items: {
            ...state.items,
            [tmdb_id]: { ...currentItem, status: oldStatus, rating: oldRating, is_favorite: oldFavorite }
          }
        };
      });
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
    const oldStatus = item.status;
    const targetStatus = (item.status === 'plan_to_watch' || item.status === 'upcoming') ? 'watching' : item.status;

    set((state) => {
      const currentItem = state.items[tmdb_id] || item;
      return {
        items: {
          ...state.items,
          [tmdb_id]: { ...currentItem, rating, status: targetStatus }
        }
      };
    });

    try {
      const data = await resilientFetch<any>(`/api/my-list/${item.id}`, {
        method: 'PATCH',
        body: { rating, status: targetStatus },
      });
      if (data) {
        set((state) => {
          const currentItem = state.items[tmdb_id] || item;
          return {
            items: {
              ...state.items,
              [tmdb_id]: {
                ...currentItem,
                rating: data.rating ?? rating,
                status: data.status || targetStatus,
              }
            }
          };
        });
      }
    } catch (error) {
      console.error('Failed to update rating', error);
      set((state) => {
        const currentItem = state.items[tmdb_id] || item;
        return {
          items: {
            ...state.items,
            [tmdb_id]: { ...currentItem, rating: oldRating, status: oldStatus }
          }
        };
      });
      toast.add({
        title: "Erro ao registrar nota",
        description: "Não foi possível salvar a nota. Tente novamente.",
        type: "error"
      });
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

  toggleFavorite: async (tmdb_id) => {
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

    if (!['watching', 'completed'].includes(item.status)) {
      toast.add({
        title: "Ação não permitida",
        description: "Apenas mídias com status 'Assistindo' ou 'Assistido' podem ser favoritadas.",
        type: "warning"
      });
      return;
    }

    const oldFavorite = !!item.is_favorite;
    const newFavorite = !oldFavorite;

    // Optimistic update
    set((state) => {
      const currentItem = state.items[tmdb_id] || item;
      return {
        items: {
          ...state.items,
          [tmdb_id]: {
            ...currentItem,
            is_favorite: newFavorite,
          }
        }
      };
    });

    try {
      const data = await resilientFetch<any>(`/api/my-list/${item.id}`, {
        method: 'PATCH',
        body: { is_favorite: newFavorite },
      });
      set((state) => {
        const currentItem = state.items[tmdb_id] || item;
        return {
          items: {
            ...state.items,
            [tmdb_id]: {
              ...currentItem,
              is_favorite: data?.is_favorite !== undefined ? Boolean(data.is_favorite) : newFavorite,
            }
          }
        };
      });
      toast.add({
        title: newFavorite ? "Adicionado aos Favoritos! ❤️" : "Removido dos Favoritos",
        description: newFavorite 
          ? "Esta obra terá peso maior nas suas recomendações no Explorar." 
          : "O título foi desmarcado como favorito.",
        type: "success"
      });
    } catch (error: any) {
      console.error('Failed to toggle favorite', error);
      // Revert optimistic update
      set((state) => {
        const currentItem = state.items[tmdb_id] || item;
        return {
          items: {
            ...state.items,
            [tmdb_id]: {
              ...currentItem,
              is_favorite: oldFavorite,
            }
          }
        };
      });
      const errorDetail = error?.response?.data?.detail;
      toast.add({
        title: "Erro ao atualizar favorito",
        description: errorDetail || "Não foi possível atualizar o favorito.",
        type: "error"
      });
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
    removeUpToDateShowFromCache(tmdb_id);
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

    const prevItem = get().items[tmdb_id];
    if (prevItem) {
      set((state) => ({
        items: {
          ...state.items,
          [tmdb_id]: {
            ...prevItem,
            status: 'watching',
            last_watched_at: new Date().toISOString(),
            is_up_to_date: false,
            next_episode: {
              season_number: season,
              episode_number: episode + 1,
              name: `Episódio ${episode + 1}`,
              is_released: true
            }
          }
        }
      }));
      saveCorrectedEpisodesToCache({ [tmdb_id]: { season, episode: episode + 1 } });
    }

    try {
      await resilientFetch(`/api/my-list/${item.id}/progress/bulk`, {
        method: 'POST',
        body: { season_number: season, episode_number: episode }
      });
      // Sync progress in background
      get().fetchProgress(tmdb_id);
      get().fetchMyList();
    } catch (error) {
      console.error('Failed to bulk mark episodes', error);
      if (prevItem) {
        set((state) => ({
          items: {
            ...state.items,
            [tmdb_id]: prevItem
          }
        }));
      }
      toast.add({
        title: "Erro ao marcar episódios",
        description: "Não foi possível marcar em lote. Tente novamente.",
        type: "error"
      });
    }
  }
}),
{
  name: 'omniwatch_my_list',
  partialize: (state) => ({ items: state.items }),
}
)
);
