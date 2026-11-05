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
  upcomingData: UpcomingRecommendations;
  personasData: PersonaCarousel[];

  // Estados de carregamento inicial (cold start)
  isLoadingExplore: boolean;
  isLoadingUpcoming: boolean;
  isLoadingPersonas: boolean;

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

  // Ejeção/dispensa otimista instantânea
  dismissItem: (itemId: number) => void;

  // Reset do store
  clearStore: () => void;
}

// Promessa em voo para deduplicação absoluta no frontend (Single-Flight Pattern)
let inflightFeedPromise: Promise<void> | null = null;

export const useExploreStore = create<ExploreStoreState>((set, get) => ({
  exploreItems: [],
  upcomingData: { movies: [], series: [] },
  personasData: [],

  isLoadingExplore: true,
  isLoadingUpcoming: true,
  isLoadingPersonas: true,

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
        isLoadingUpcoming: true,
        isLoadingPersonas: true,
      });
    }

    inflightFeedPromise = (async () => {
      try {
        const res = await api.get<FeedResponse>("/api/recommendations/feed");
        if (res.data) {
          const up = res.data.upcoming || { movies: [], series: [] };
          const nowTs = Date.now();
          set({
            exploreItems: res.data.explore || [],
            upcomingData: {
              movies: up.movies || [],
              series: up.series || up.tv || [],
            },
            personasData: res.data.personas || [],
            lastFetchedFeed: nowTs,
            lastFetchedExplore: nowTs,
            lastFetchedUpcoming: nowTs,
            lastFetchedPersonas: nowTs,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar feed unificado de recomendações:", error);
      } finally {
        set({
          isLoadingExplore: false,
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

  dismissItem: (itemId: number) => {
    set((state) => ({
      exploreItems: state.exploreItems.filter((i) => i.id !== itemId),
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
    set({
      exploreItems: [],
      upcomingData: { movies: [], series: [] },
      personasData: [],
      isLoadingExplore: true,
      isLoadingUpcoming: true,
      isLoadingPersonas: true,
      lastFetchedFeed: null,
      lastFetchedExplore: null,
      lastFetchedUpcoming: null,
      lastFetchedPersonas: null,
    });
  },
}));
