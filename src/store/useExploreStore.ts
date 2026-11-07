import { create } from "zustand";
import { api } from "@/lib/axios";
import {
  RecommendationItem,
  UpcomingRecommendations,
  PersonaCarousel,
} from "@/types/recommendation";

interface FeedResponse {
  explore: RecommendationItem[];
  recent_vibe?: RecommendationItem[];
  upcoming: UpcomingRecommendations;
  personas: PersonaCarousel[];
  is_stale?: boolean;
  last_generated_at?: string | null;
}

interface ExploreStoreState {
  // Dados cacheados
  exploreItems: RecommendationItem[];
  recentVibeItems: RecommendationItem[];
  upcomingData: UpcomingRecommendations;
  personasData: PersonaCarousel[];

  // Estados de carregamento inicial (cold start)
  isLoadingExplore: boolean;
  isLoadingRecentVibe: boolean;
  isLoadingUpcoming: boolean;
  isLoadingPersonas: boolean;
  isRefreshingMovies: boolean;
  isRefreshingSeries: boolean;

  // Timestamps de última busca
  lastFetchedFeed: number | null;
  lastFetchedExplore: number | null;
  lastFetchedUpcoming: number | null;
  lastFetchedPersonas: number | null;

  // Ação unificada em lote (Single-Flight: 1 única requisição HTTP e 1 única consulta no DB)
  fetchFeed: (force?: boolean) => Promise<void>;

  // Ações granulares (redirecionam para o feed em lote para evitar concorrência)
  fetchExplore: (force?: boolean) => Promise<void>;
  fetchUpcoming: (force?: boolean) => Promise<void>;
  fetchPersonas: (force?: boolean) => Promise<void>;

  // Renovação seletiva de pool ao concluir ciclo de lotes (O(M + K log K) no backend)
  refreshExploreBatch: (
    mediaType: "movie" | "tv",
    excludeIds: number[]
  ) => Promise<{ refreshed: boolean; count: number }>;

  // Ejeção/dispensa otimista instantânea
  dismissItem: (itemId: number) => void;

  // Reset do store
  clearStore: () => void;
}

// Promessa em voo para deduplicação absoluta no frontend (Single-Flight Pattern)
let inflightFeedPromise: Promise<void> | null = null;
const inflightRefreshPromises: Record<string, Promise<{ refreshed: boolean; count: number }> | null> = {};
let autoHealTimer: ReturnType<typeof setTimeout> | null = null;
let autoHealAttempts = 0;

export const useExploreStore = create<ExploreStoreState>((set, get) => ({
  exploreItems: [],
  recentVibeItems: [],
  upcomingData: { movies: [], series: [] },
  personasData: [],

  isLoadingExplore: true,
  isLoadingRecentVibe: true,
  isLoadingUpcoming: true,
  isLoadingPersonas: true,
  isRefreshingMovies: false,
  isRefreshingSeries: false,

  lastFetchedFeed: null,
  lastFetchedExplore: null,
  lastFetchedUpcoming: null,
  lastFetchedPersonas: null,

  fetchFeed: async (force = false) => {
    // 1. Se já existe uma requisição em andamento, anexa à mesma promessa (zero requisições duplicadas)
    if (inflightFeedPromise) {
      return inflightFeedPromise;
    }

    const state = get();
    const hasData =
      state.exploreItems.length > 0 ||
      state.recentVibeItems.length > 0 ||
      state.personasData.length > 0 ||
      state.upcomingData.movies.length > 0 ||
      state.upcomingData.series.length > 0;
    const now = Date.now();

    // 2. Throttle de 15 segundos se os dados já estiverem em memória
    if (!force && hasData && state.lastFetchedFeed && now - state.lastFetchedFeed < 15_000) {
      return;
    }

    // Se é cold start (primeira carga), sinaliza loading
    if (!hasData) {
      set({
        isLoadingExplore: true,
        isLoadingRecentVibe: true,
        isLoadingUpcoming: true,
        isLoadingPersonas: true,
      });
    }

    inflightFeedPromise = (async () => {
      try {
        const res = await api.get<FeedResponse>("/api/recommendations/feed");
        if (res.data) {
          const up = res.data.upcoming || { movies: [], series: [] };
          const upMovies = up.movies || [];
          const upSeries = up.series || up.tv || [];
          const vibe = res.data.recent_vibe || [];
          const nowTs = Date.now();
          set({
            exploreItems: res.data.explore || [],
            recentVibeItems: vibe,
            upcomingData: {
              movies: upMovies,
              series: upSeries,
            },
            personasData: res.data.personas || [],
            lastFetchedFeed: nowTs,
            lastFetchedExplore: nowTs,
            lastFetchedUpcoming: nowTs,
            lastFetchedPersonas: nowTs,
          });

          // Se o backend sinalizou recálculo de cura em andamento (seção vazia em aquecimento), reconsulta silenciosamente
          const missingSection = vibe.length === 0 || (upMovies.length === 0 && upSeries.length === 0);
          if (res.data.is_stale && missingSection && autoHealAttempts < 3) {
            autoHealAttempts += 1;
            if (autoHealTimer) clearTimeout(autoHealTimer);
            autoHealTimer = setTimeout(() => {
              autoHealTimer = null;
              get().fetchFeed(true);
            }, 9000);
          } else if (!missingSection) {
            autoHealAttempts = 0;
          }
        }
      } catch (error) {
        console.error("Erro ao carregar feed unificado de recomendações:", error);
      } finally {
        set({
          isLoadingExplore: false,
          isLoadingRecentVibe: false,
          isLoadingUpcoming: false,
          isLoadingPersonas: false,
        });
        inflightFeedPromise = null;
      }
    })();

    return inflightFeedPromise;
  },

  // Delegações transparentes para a requisição unificada
  fetchExplore: async (force = false) => {
    return get().fetchFeed(force);
  },

  fetchUpcoming: async (force = false) => {
    return get().fetchFeed(force);
  },

  fetchPersonas: async (force = false) => {
    return get().fetchFeed(force);
  },

  refreshExploreBatch: async (mediaType, excludeIds) => {
    if (inflightRefreshPromises[mediaType]) {
      return inflightRefreshPromises[mediaType]!;
    }

    const flagKey = mediaType === "movie" ? "isRefreshingMovies" : "isRefreshingSeries";
    set({ [flagKey]: true } as Partial<ExploreStoreState>);

    const promise = (async () => {
      try {
        const res = await api.post<{
          items: RecommendationItem[];
          refreshed: boolean;
          fresh_count?: number;
        }>("/api/recommendations/explore/refresh-batch", {
          media_type: mediaType,
          exclude_ids: excludeIds,
          limit: 24,
        });

        const nextItems = res.data?.items || [];
        if (nextItems.length > 0) {
          const nowTs = Date.now();
          set((state) => {
            const others = state.exploreItems.filter((i) => i.media_type !== mediaType);
            return {
              exploreItems: mediaType === "movie" ? [...nextItems, ...others] : [...others, ...nextItems],
              lastFetchedFeed: nowTs,
              lastFetchedExplore: nowTs,
            };
          });
        }
        return {
          refreshed: Boolean(res.data?.refreshed),
          count: nextItems.length,
        };
      } catch (error) {
        console.error(`Erro ao renovar lote de ${mediaType}:`, error);
        return { refreshed: false, count: 0 };
      } finally {
        set({ [flagKey]: false } as Partial<ExploreStoreState>);
        inflightRefreshPromises[mediaType] = null;
      }
    })();

    inflightRefreshPromises[mediaType] = promise;
    return promise;
  },

  dismissItem: (itemId: number) => {
    set((state) => ({
      exploreItems: state.exploreItems.filter((i) => i.id !== itemId),
      recentVibeItems: state.recentVibeItems.filter((i) => i.id !== itemId),
      upcomingData: {
        movies: state.upcomingData.movies.filter((i) => i.id !== itemId),
        series: state.upcomingData.series.filter((i) => i.id !== itemId),
      },
      personasData: state.personasData.map((p) => ({
        ...p,
        recommendations: p.recommendations ? p.recommendations.filter((i) => i.id !== itemId) : [],
      })),
    }));
  },

  clearStore: () => {
    if (autoHealTimer) {
      clearTimeout(autoHealTimer);
      autoHealTimer = null;
    }
    autoHealAttempts = 0;
    set({
      exploreItems: [],
      recentVibeItems: [],
      upcomingData: { movies: [], series: [] },
      personasData: [],
      isLoadingExplore: true,
      isLoadingRecentVibe: true,
      isLoadingUpcoming: true,
      isLoadingPersonas: true,
      isRefreshingMovies: false,
      isRefreshingSeries: false,
      lastFetchedFeed: null,
      lastFetchedExplore: null,
      lastFetchedUpcoming: null,
      lastFetchedPersonas: null,
    });
  },
}));
