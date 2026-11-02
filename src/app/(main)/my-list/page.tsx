'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMyListStore, ListStatus, SavedItem } from '@/store/useMyListStore';
import { MediaCard } from '@/components/home/MediaCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FilterSearchInput } from '@/components/shared/FilterSearchInput';
import { getFollowedCollections, getCollectionSuggestions } from '@/services/collections';
import { UserFollowedCollection, CollectionSuggestion } from '@/types/collections';
import { FollowedCollectionCard } from '@/components/collections/FollowedCollectionCard';
import { CollectionSuggestionCard } from '@/components/collections/CollectionSuggestionCard';
import {
  getFollowedUniverses,
  getUniverseSuggestions,
  getDismissedUniverseSuggestions,
  restoreUniverseSuggestion,
} from '@/services/universes';
import { UserFollowedUniverse, UniverseSuggestion } from '@/types/universes';
import { FollowedUniverseCard } from '@/components/universes/FollowedUniverseCard';
import { UniverseSuggestionCard } from '@/components/universes/UniverseSuggestionCard';
import { Layers, Globe, Compass, Star, StarOff, CheckCircle2, Clock, Play, Heart, Sparkles, ChevronDown, ChevronUp, Search, X, EyeOff, ArrowUpDown, LayoutGrid, Film, Tv } from 'lucide-react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { cn } from '@/lib/utils';

const VALID_TABS = ['all', 'movie', 'tv', 'collections', 'universes'] as const;
type MediaTabType = (typeof VALID_TABS)[number];

const VALID_SORTS = ['recent', 'rating_desc', 'rating_asc', 'release_date_desc', 'release_date_asc', 'title_asc', 'title_desc'] as const;
export type SortByType = (typeof VALID_SORTS)[number];

function MyListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sortParam = searchParams.get('sort');

  const { items, isLoading, fetchMyList } = useMyListStore();
  const [mediaTab, setMediaTab] = useState<MediaTabType>(() => {
    return VALID_TABS.includes(tabParam as any) ? (tabParam as MediaTabType) : 'all';
  });
  const [statusFilter, setStatusFilter] = useState<ListStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>(() => {
    return VALID_SORTS.includes(sortParam as any) ? (sortParam as SortByType) : 'recent';
  });
  const [isSuggestionsBannerDismissed, setIsSuggestionsBannerDismissed] = useState(false);

  const handleSortChange = (newSort: string) => {
    const nextSort = VALID_SORTS.includes(newSort as any) ? (newSort as SortByType) : 'recent';
    setSortBy(nextSort);
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', nextSort);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  // Sub-filters for rating & progress & favorites
  const [ratingFilter, setRatingFilter] = useState<'all' | 'unrated' | 'rated'>('all');
  const [watchProgressFilter, setWatchProgressFilter] = useState<'all' | 'up_to_date' | 'pending'>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<boolean>(false);

  // Collections & Suggestions state
  const [collections, setCollections] = useState<UserFollowedCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [suggestions, setSuggestions] = useState<CollectionSuggestion[]>([]);
  const [, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false);

  // Universes & Suggestions state
  const [universes, setUniverses] = useState<UserFollowedUniverse[]>([]);
  const [isLoadingUniverses, setIsLoadingUniverses] = useState(false);
  const [universeSuggestions, setUniverseSuggestions] = useState<UniverseSuggestion[]>([]);
  const [, setIsLoadingUniverseSuggestions] = useState(false);
  const [isUniverseSuggestionsCollapsed, setIsUniverseSuggestionsCollapsed] = useState(false);
  const [dismissedUniverses, setDismissedUniverses] = useState<UniverseSuggestion[]>([]);
  const [isDismissedUniversesOpen, setIsDismissedUniversesOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('omniwatch_suggestions_collapsed');
      if (saved !== null) {
        queueMicrotask(() => {
          setIsSuggestionsCollapsed(saved === 'true');
        });
      }
      const savedUniv = localStorage.getItem('omniwatch_universe_suggestions_collapsed');
      if (savedUniv !== null) {
        queueMicrotask(() => {
          setIsUniverseSuggestionsCollapsed(savedUniv === 'true');
        });
      }
      const savedBannerDismissed = localStorage.getItem('omniwatch_suggestions_banner_dismissed');
      if (savedBannerDismissed === 'true') {
        queueMicrotask(() => {
          setIsSuggestionsBannerDismissed(true);
        });
      }
    } catch (e) {
      console.error('Failed to read suggestions collapsed state from localStorage', e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'omniwatch_suggestions_collapsed' && e.newValue !== null) {
        setIsSuggestionsCollapsed(e.newValue === 'true');
      }
      if (e.key === 'omniwatch_universe_suggestions_collapsed' && e.newValue !== null) {
        setIsUniverseSuggestionsCollapsed(e.newValue === 'true');
      }
      if (e.key === 'omniwatch_suggestions_banner_dismissed' && e.newValue !== null) {
        setIsSuggestionsBannerDismissed(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDismissSuggestionsBanner = () => {
    setIsSuggestionsBannerDismissed(true);
    try {
      localStorage.setItem('omniwatch_suggestions_banner_dismissed', 'true');
    } catch (e) {
      console.error('Failed to save suggestions banner dismissed state to localStorage', e);
    }
  };

  const toggleSuggestionsCollapsed = () => {
    setIsSuggestionsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('omniwatch_suggestions_collapsed', String(next));
      } catch (e) {
        console.error('Failed to save suggestions collapsed state to localStorage', e);
      }
      return next;
    });
  };

  const toggleUniverseSuggestionsCollapsed = () => {
    setIsUniverseSuggestionsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('omniwatch_universe_suggestions_collapsed', String(next));
      } catch (e) {
        console.error('Failed to save universe suggestions collapsed state to localStorage', e);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  const loadCollections = useCallback(async () => {
    try {
      setIsLoadingCollections(true);
      const data = await getFollowedCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoadingSuggestions(true);
      const data = await getCollectionSuggestions();
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load collection suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const loadUniverses = useCallback(async () => {
    try {
      setIsLoadingUniverses(true);
      const data = await getFollowedUniverses();
      setUniverses(data);
    } catch (err) {
      console.error('Failed to load universes:', err);
    } finally {
      setIsLoadingUniverses(false);
    }
  }, []);

  const loadUniverseSuggestions = useCallback(async () => {
    try {
      setIsLoadingUniverseSuggestions(true);
      const data = await getUniverseSuggestions();
      setUniverseSuggestions(data);
    } catch (err) {
      console.error('Failed to load universe suggestions:', err);
    } finally {
      setIsLoadingUniverseSuggestions(false);
    }
  }, []);

  const loadDismissedUniverses = useCallback(async () => {
    try {
      const data = await getDismissedUniverseSuggestions();
      setDismissedUniverses(data);
    } catch (err) {
      console.error('Failed to load dismissed universe suggestions:', err);
    }
  }, []);

  // Carrega sugestões para preencher os badges das abas desacopladas do carregamento inicial da lista
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuggestions();
      loadUniverseSuggestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadSuggestions, loadUniverseSuggestions]);

  useEffect(() => {
    if (mediaTab === 'collections') {
      loadCollections();
      loadSuggestions();
    } else if (mediaTab === 'universes') {
      loadUniverses();
      loadUniverseSuggestions();
      loadDismissedUniverses();
    }
  }, [mediaTab, loadCollections, loadSuggestions, loadUniverses, loadUniverseSuggestions, loadDismissedUniverses]);

  function handleUnfollowCollection(tmdbId: number) {
    setCollections((prev) => prev.filter((c) => c.tmdb_id !== tmdbId));
  }

  function handleFollowSuggestion(tmdbId: number) {
    setSuggestions((prev) => prev.filter((s) => s.tmdb_id !== tmdbId));
    loadCollections();
    fetchMyList();
  }

  function handleDismissSuggestion(tmdbId: number) {
    setSuggestions((prev) => prev.filter((s) => s.tmdb_id !== tmdbId));
  }

  function handleUnfollowUniverse(universeKey: string) {
    setUniverses((prev) => prev.filter((u) => u.universe_key !== universeKey));
    loadUniverseSuggestions();
    loadDismissedUniverses();
  }

  function handleFollowUniverseSuggestion(universeKey: string) {
    setUniverseSuggestions((prev) => prev.filter((s) => s.universe_key !== universeKey));
    loadUniverses();
    fetchMyList();
  }

  function handleDismissUniverseSuggestion(universeKey: string) {
    setUniverseSuggestions((prev) => prev.filter((s) => s.universe_key !== universeKey));
    loadDismissedUniverses();
  }

  async function handleRestoreUniverse(universeKey: string) {
    try {
      await restoreUniverseSuggestion(universeKey);
      await Promise.all([loadUniverseSuggestions(), loadDismissedUniverses()]);
    } catch (err) {
      console.error('Failed to restore universe suggestion:', err);
    }
  }

  // Reset sub-filters when status or media tab changes
  const handleStatusChange = (newStatus: ListStatus | 'all') => {
    setStatusFilter(newStatus);
    setRatingFilter('all');
    setWatchProgressFilter('all');
  };

  // Sync tab with URL search params when user navigates (e.g. back/forward)
  useEffect(() => {
    const currentTabParam = searchParams.get('tab');
    const resolvedTab = VALID_TABS.includes(currentTabParam as any) ? (currentTabParam as MediaTabType) : 'all';
    if (resolvedTab !== mediaTab) {
      setMediaTab(resolvedTab);
    }
  }, [searchParams, mediaTab]);

  // Sync sort with URL search params when user navigates (e.g. back/forward)
  useEffect(() => {
    const currentSortParam = searchParams.get('sort');
    const resolvedSort = VALID_SORTS.includes(currentSortParam as any) ? (currentSortParam as SortByType) : 'recent';
    if (resolvedSort !== sortBy) {
      setSortBy(resolvedSort);
    }
  }, [searchParams, sortBy]);

  const handleMediaTabChange = (val: string) => {
    const nextTab = VALID_TABS.includes(val as any) ? (val as MediaTabType) : 'all';
    setMediaTab(nextTab);
    setRatingFilter('all');
    setWatchProgressFilter('all');

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  // Convert dictionary to array for mapping and guarantee unique items
  const itemsArray = useMemo(() => {
    const seen = new Set<string>();
    const list: SavedItem[] = [];
    for (const item of Object.values(items)) {
      if (!item || (!item.tmdb_id && !item.id)) continue;
      const key = `${item.media_type || 'movie'}_${item.tmdb_id || item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }
    return list;
  }, [items]);

  // Base filtered by mediaTab, statusFilter, and searchQuery (for counts)
  const baseItems = itemsArray.filter((item) => {
    if (!item || (!item.tmdb_id && !item.id)) return false;
    if (mediaTab !== 'all' && item.media_type !== mediaTab) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (!(item.title || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const unratedCount = baseItems.filter((i) => !i.rating || i.rating === 0).length;
  const ratedCount = baseItems.filter((i) => typeof i.rating === 'number' && i.rating > 0).length;
  const upToDateCount = baseItems.filter((i) => i.media_type === 'tv' && i.is_up_to_date === true).length;
  const pendingCount = baseItems.filter((i) => i.media_type === 'tv' && i.is_up_to_date === false).length;
  const favoriteCount = baseItems.filter((i) => i.is_favorite).length;
  const hasSeries = baseItems.some((i) => i.media_type === 'tv');

  // Filter items
  const filteredItems = baseItems.filter((item) => {
    // 1. Filter by favorites
    if (favoriteFilter && !item.is_favorite) return false;

    // 2. Filter by rating
    if (ratingFilter === 'unrated' && (item.rating && item.rating > 0)) return false;
    if (ratingFilter === 'rated' && (!item.rating || item.rating === 0)) return false;

    // 3. Filter by watch progress (for watching series)
    if (watchProgressFilter === 'up_to_date' && (!item.is_up_to_date || item.media_type !== 'tv')) return false;
    if (watchProgressFilter === 'pending' && (item.is_up_to_date || item.media_type !== 'tv')) return false;

    return true;
  });

  // Filter collections and suggestions by search query
  const filteredCollections = collections.filter((c) => {
    if (!searchQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const filteredSuggestions = suggestions.filter((s) => {
    if (!searchQuery.trim()) return true;
    return s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // Filter universes and universe suggestions by search query
  const filteredUniverses = universes.filter((u) => {
    if (!searchQuery.trim()) return true;
    return u.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const filteredUniverseSuggestions = universeSuggestions.filter((s) => {
    if (!searchQuery.trim()) return true;
    return s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // Sort items according to selected sortBy
  const sortedItems = useMemo(() => {
    if (sortBy === 'recent') return filteredItems;
    return [...filteredItems].sort((a, b) => {
      if (sortBy === 'rating_desc') {
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA === 0 && rB > 0) return 1;
        if (rB === 0 && rA > 0) return -1;
        if (rB !== rA) return rB - rA;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'rating_asc') {
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA === 0 && rB > 0) return 1;
        if (rB === 0 && rA > 0) return -1;
        if (rA !== rB) return rA - rB;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'release_date_desc') {
        const dA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dB = b.release_date ? new Date(b.release_date).getTime() : 0;
        if (dA === 0 && dB > 0) return 1;
        if (dB === 0 && dA > 0) return -1;
        if (dB !== dA) return dB - dA;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'release_date_asc') {
        const dA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dB = b.release_date ? new Date(b.release_date).getTime() : 0;
        if (dA === 0 && dB > 0) return 1;
        if (dB === 0 && dA > 0) return -1;
        if (dA !== dB) return dA - dB;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  }, [filteredItems, sortBy]);

  // Pré-carrega em segundo plano os pôsteres dos itens não visíveis (a partir do 13º card)
  const posterPathsToPreload = sortedItems.map((item) => item.poster_path);
  useImagePreloader(posterPathsToPreload, { initialSkip: 12, batchSize: 4 });

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Biblioteca</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie seus filmes, séries, coleções e universos acompanhados
          </p>
        </div>

        {/* Campo de Busca Redesenhado */}
        <div className="w-full sm:w-80 md:w-96">
          <FilterSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              mediaTab === 'collections'
                ? "Buscar coleções..."
                : mediaTab === 'universes'
                ? "Buscar universos..."
                : mediaTab === 'movie'
                ? "Buscar filmes na biblioteca..."
                : mediaTab === 'tv'
                ? "Buscar séries na biblioteca..."
                : "Buscar na biblioteca..."
            }
            showCount={Boolean(searchQuery.trim())}
            resultCount={
              mediaTab === 'collections'
                ? filteredCollections.length
                : mediaTab === 'universes'
                ? filteredUniverses.length
                : filteredItems.length
            }
            totalCount={
              mediaTab === 'collections'
                ? collections.length
                : mediaTab === 'universes'
                ? universes.length
                : baseItems.length
            }
          />
        </div>
      </div>

      <Tabs
        value={mediaTab}
        onValueChange={handleMediaTabChange}
        className="w-full mb-8"
      >
        <TabsList
          variant="line"
          className="mb-6 flex flex-nowrap overflow-x-auto no-scrollbar w-full border-b border-border/60 justify-start gap-1 sm:gap-4 px-1"
          aria-label="Categorias de mídia da lista"
        >
          <TabsTrigger
            value="all"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer"
            role="tab"
            aria-label="Ver todos os itens da lista"
            aria-selected={mediaTab === 'all'}
            aria-controls="panel-all"
            id="tab-all"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger
            value="movie"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer"
            role="tab"
            aria-label="Filtrar apenas filmes"
            aria-selected={mediaTab === 'movie'}
            aria-controls="panel-movie"
            id="tab-movie"
          >
            <Film className="w-4 h-4" />
            <span>Filmes</span>
          </TabsTrigger>
          <TabsTrigger
            value="tv"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer"
            role="tab"
            aria-label="Filtrar apenas séries"
            aria-selected={mediaTab === 'tv'}
            aria-controls="panel-tv"
            id="tab-tv"
          >
            <Tv className="w-4 h-4" />
            <span>Séries</span>
          </TabsTrigger>
          <TabsTrigger
            value="collections"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1.5"
            role="tab"
            aria-label="Ver coleções seguidas e sugestões"
            aria-selected={mediaTab === 'collections'}
            aria-controls="panel-collections"
            id="tab-collections"
          >
            <Layers className="w-4 h-4" />
            <span>Coleções</span>
            {suggestions.length > 0 && (
              <span
                title={`${suggestions.length} sugestões de coleções`}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              >
                {suggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="universes"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1.5"
            role="tab"
            aria-label="Ver universos seguidos e sugestões"
            aria-selected={mediaTab === 'universes'}
            aria-controls="panel-universes"
            id="tab-universes"
          >
            <Globe className="w-4 h-4" />
            <span>Universos</span>
            {universeSuggestions.length > 0 && (
              <span
                title={`${universeSuggestions.length} sugestões de universos`}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30"
              >
                {universeSuggestions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Banner Compacto e Descartável de Sagas e Universos Detectados (Opção A) */}
      {!isSuggestionsBannerDismissed &&
        mediaTab !== 'collections' &&
        mediaTab !== 'universes' &&
        (suggestions.length > 0 || universeSuggestions.length > 0) && (
          <div className="mb-6 p-3 sm:p-3.5 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>Sagas e Universos Detectados:</span>
                  {suggestions.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {suggestions.length} {suggestions.length === 1 ? 'Coleção' : 'Coleções'}
                    </span>
                  )}
                  {universeSuggestions.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {universeSuggestions.length} {universeSuggestions.length === 1 ? 'Universo' : 'Universos'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  Identificamos franquias completas conectadas às obras da sua biblioteca.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {suggestions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-amber-500/40 cursor-pointer font-medium shadow-sm"
                  onClick={() => handleMediaTabChange('collections')}
                >
                  Ver Coleções →
                </Button>
              )}
              {universeSuggestions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-purple-500/40 cursor-pointer font-medium shadow-sm"
                  onClick={() => handleMediaTabChange('universes')}
                >
                  Ver Universos →
                </Button>
              )}
              <button
                type="button"
                onClick={handleDismissSuggestionsBanner}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
                title="Dispensar aviso"
                aria-label="Dispensar aviso de sugestões"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      {mediaTab === 'universes' ? (
        <div className="space-y-8">
          {/* Seção de Sugestões de Universos */}
          {(filteredUniverseSuggestions.length > 0 || dismissedUniverses.length > 0) && (
            <div
              className={cn(
                "bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/25 rounded-2xl transition-all duration-300",
                isUniverseSuggestionsCollapsed ? "p-4 sm:p-5 hover:border-purple-500/40" : "p-5 sm:p-6"
              )}
            >
              <div
                className={cn(
                  "flex justify-between gap-3 sm:gap-4",
                  isUniverseSuggestionsCollapsed ? "items-center cursor-pointer select-none" : "flex-col sm:flex-row items-start mb-5"
                )}
                onClick={isUniverseSuggestionsCollapsed ? toggleUniverseSuggestionsCollapsed : undefined}
                role={isUniverseSuggestionsCollapsed ? "button" : undefined}
                tabIndex={isUniverseSuggestionsCollapsed ? 0 : undefined}
                onKeyDown={isUniverseSuggestionsCollapsed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleUniverseSuggestionsCollapsed(); } } : undefined}
              >
                <div className={cn("flex gap-3", isUniverseSuggestionsCollapsed ? "items-center" : "items-start")}>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Globe className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                      Sugestões de Universos
                      {filteredUniverseSuggestions.length > 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {filteredUniverseSuggestions.length} {filteredUniverseSuggestions.length === 1 ? 'identificado' : 'identificados'}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {dismissedUniverses.length} {dismissedUniverses.length === 1 ? 'dispensado' : 'dispensados'}
                        </span>
                      )}
                    </h3>
                    {!isUniverseSuggestionsCollapsed && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Baseado nos seus filmes e séries, encontramos universos compartilhados (múltiplas sagas, spin-offs e séries conectadas). Siga o universo para acompanhar tudo!
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUniverseSuggestionsCollapsed();
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-zinc-700 hover:border-zinc-600 shadow-sm text-xs shrink-0 cursor-pointer font-medium gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg transition-all"
                  aria-controls="universe-suggestions-content"
                >
                  <span className="font-semibold text-zinc-100">{isUniverseSuggestionsCollapsed ? 'Mostrar Sugestões' : 'Ocultar Sugestões'}</span>
                  {isUniverseSuggestionsCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-zinc-300" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-zinc-300" />
                  )}
                </Button>
              </div>

              {!isUniverseSuggestionsCollapsed && (
                <div id="universe-suggestions-content" className="space-y-4 animate-in fade-in duration-200">
                  {filteredUniverseSuggestions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredUniverseSuggestions.map((suggestion) => (
                        <UniverseSuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onFollow={handleFollowUniverseSuggestion}
                          onDismiss={handleDismissUniverseSuggestion}
                        />
                      ))}
                    </div>
                  )}

                  {dismissedUniverses.length > 0 && (
                    <div className={cn("pt-2", filteredUniverseSuggestions.length > 0 ? "border-t border-purple-900/30" : "")}>
                      <button
                        type="button"
                        onClick={() => setIsDismissedUniversesOpen(!isDismissedUniversesOpen)}
                        className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          {isDismissedUniversesOpen ? "Ocultar" : "Ver"} sugestões de universos dispensadas ({dismissedUniverses.length})
                        </span>
                        {isDismissedUniversesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isDismissedUniversesOpen && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dismissedUniverses.map((du) => (
                            <div
                              key={du.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="font-semibold text-slate-200 truncate">{du.name}</h5>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {du.items_in_list} de {du.total_items} obras na sua lista
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Link href={`/universe/${encodeURIComponent(du.universe_key)}`}>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 cursor-pointer">
                                    Ver
                                  </Button>
                                </Link>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleRestoreUniverse(du.universe_key)}
                                  className="h-7 text-xs px-2.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/60 cursor-pointer"
                                >
                                  Restaurar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seção de Universos Seguidos */}
          {isLoadingUniverses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-muted rounded-xl" />
              ))}
            </div>
          ) : universes.length === 0 ? (
            universeSuggestions.length > 0 ? (
              <div className="text-center py-10 bg-card/40 border border-border/40 rounded-xl p-6">
                <p className="text-sm text-muted-foreground">
                  Você ainda não segue nenhum universo. Comece seguindo uma das sugestões acima para adicionar todos os filmes e séries conectados!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum universo seguido</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Adicione filmes ou séries de grandes franquias (como Marvel, Invocação do Mal, Breaking Bad ou Harry Potter) à sua lista para receber sugestões automáticas de universos completos.
                </p>
                <Link href="/explore">
                  <Button className="gap-2 cursor-pointer">
                    <Compass className="w-4 h-4" />
                    Explorar Títulos
                  </Button>
                </Link>
              </div>
            )
          ) : filteredUniverses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-secondary/60 flex items-center justify-center mb-3 text-muted-foreground">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nenhum universo encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum universo corresponde à pesquisa &ldquo;{searchQuery}&rdquo;.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="cursor-pointer">
                Limpar busca
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Universos Seguidos ({filteredUniverses.length}
                  {searchQuery.trim() ? ` de ${universes.length}` : ''})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUniverses.map((univ) => (
                  <FollowedUniverseCard
                    key={univ.id}
                    universe={univ}
                    onUnfollow={handleUnfollowUniverse}
                    onSyncComplete={loadUniverses}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : mediaTab === 'collections' ? (
        <div className="space-y-8">
          {/* Seção de Alertas e Sugestões de Coleções */}
          {filteredSuggestions.length > 0 && (
            <div
              className={cn(
                "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-2xl transition-all duration-300",
                isSuggestionsCollapsed ? "p-4 sm:p-5 hover:border-amber-500/40" : "p-5 sm:p-6"
              )}
            >
              <div
                className={cn(
                  "flex justify-between gap-3 sm:gap-4",
                  isSuggestionsCollapsed ? "items-center cursor-pointer select-none" : "flex-col sm:flex-row items-start mb-5"
                )}
                onClick={isSuggestionsCollapsed ? toggleSuggestionsCollapsed : undefined}
                role={isSuggestionsCollapsed ? "button" : undefined}
                tabIndex={isSuggestionsCollapsed ? 0 : undefined}
                onKeyDown={isSuggestionsCollapsed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSuggestionsCollapsed(); } } : undefined}
              >
                <div className={cn("flex gap-3", isSuggestionsCollapsed ? "items-center" : "items-start")}>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                      Sugestões de Franquias
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                        {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'identificada' : 'identificadas'}
                      </span>
                    </h3>
                    {!isSuggestionsCollapsed && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Você já tem filmes dessas franquias na sua lista. Siga a coleção para acompanhar tudo e adicionar os próximos filmes automaticamente!
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSuggestionsCollapsed();
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-zinc-700 hover:border-zinc-600 shadow-sm text-xs shrink-0 cursor-pointer font-medium gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg transition-all"
                  aria-controls="collection-suggestions-content"
                >
                  <span className="font-semibold text-zinc-100">{isSuggestionsCollapsed ? 'Mostrar Sugestões' : 'Ocultar Sugestões'}</span>
                  {isSuggestionsCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-zinc-300" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-zinc-300" />
                  )}
                </Button>
              </div>

              {!isSuggestionsCollapsed && (
                <div id="collection-suggestions-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
                  {filteredSuggestions.map((suggestion) => (
                    <CollectionSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onFollow={handleFollowSuggestion}
                      onDismiss={handleDismissSuggestion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seção de Coleções Seguidas */}
          {isLoadingCollections ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-muted rounded-xl" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            suggestions.length > 0 ? (
              <div className="text-center py-10 bg-card/40 border border-border/40 rounded-xl p-6">
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui coleções fixas na sua lista. Comece seguindo uma das sugestões acima!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma coleção seguida</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Ao navegar pelos filmes de sagas como Demon Slayer, John Wick ou Harry Potter, clique em{' '}
                  <strong className="text-foreground">&ldquo;Seguir Coleção&rdquo;</strong> para adicionar e acompanhar
                  todos os filmes automaticamente.
                </p>
                <Link href="/explore">
                  <Button className="gap-2 cursor-pointer">
                    <Compass className="w-4 h-4" />
                    Explorar Títulos
                  </Button>
                </Link>
              </div>
            )
          ) : filteredCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-secondary/60 flex items-center justify-center mb-3 text-muted-foreground">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nenhuma coleção encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma coleção corresponde à pesquisa &ldquo;{searchQuery}&rdquo;.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="cursor-pointer">
                Limpar busca
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Coleções Seguidas ({filteredCollections.length}
                  {searchQuery.trim() ? ` de ${collections.length}` : ''})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((col) => (
                  <FollowedCollectionCard
                    key={col.id}
                    collection={col}
                    onUnfollow={handleUnfollowCollection}
                    onSyncComplete={loadCollections}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex gap-2.5 overflow-x-auto pb-2 lg:pb-0 no-scrollbar items-center">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className="rounded-full cursor-pointer min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm shrink-0 font-medium"
                onClick={() => handleStatusChange('all')}
              >
                Todos os Status
              </Button>
              <Button
                variant={statusFilter === 'plan_to_watch' ? 'default' : 'outline'}
                className="rounded-full cursor-pointer min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm shrink-0 font-medium"
                onClick={() => handleStatusChange('plan_to_watch')}
              >
                Quero Ver
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                className="rounded-full cursor-pointer min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm shrink-0 font-medium"
                onClick={() => handleStatusChange('upcoming')}
              >
                Aguardando Estreia
              </Button>
              <Button
                variant={statusFilter === 'watching' ? 'default' : 'outline'}
                className="rounded-full cursor-pointer min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm shrink-0 font-medium"
                onClick={() => handleStatusChange('watching')}
              >
                Assistindo
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                className="rounded-full cursor-pointer min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm shrink-0 font-medium"
                onClick={() => handleStatusChange('completed')}
              >
                Concluídos
              </Button>
              <Button
                variant={statusFilter === 'dropped' ? 'default' : 'outline'}
                className="rounded-full cursor-pointer min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm shrink-0 font-medium"
                onClick={() => handleStatusChange('dropped')}
              >
                Abandonados
              </Button>

              <div className="h-6 w-px bg-border/60 self-center mx-1 shrink-0" />

              <Button
                variant={favoriteFilter ? 'default' : 'outline'}
                className={cn(
                  "rounded-full cursor-pointer transition-all flex items-center gap-1.5 shrink-0 min-h-[38px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-medium",
                  favoriteFilter
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/25"
                    : "border-border hover:border-rose-500/50 hover:text-rose-400"
                )}
                onClick={() => setFavoriteFilter(!favoriteFilter)}
                title={favoriteFilter ? "Remover filtro de favoritos" : "Mostrar apenas favoritos"}
              >
                <Heart className={cn("w-3.5 h-3.5", favoriteFilter ? "fill-white text-white" : "fill-rose-500 text-rose-500")} />
                <span>Favoritos</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  favoriteFilter ? "bg-white/20 text-white font-bold" : "bg-muted text-muted-foreground"
                )}>
                  {favoriteCount}
                </span>
              </Button>
            </div>

            {/* Dropdown de Ordenação (Opção A) */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 bg-secondary/40 hover:bg-secondary/60 border border-border/80 px-3 py-1.5 rounded-xl transition-colors">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 select-none">
                <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Ordenar:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-transparent text-xs text-foreground font-semibold focus:outline-none cursor-pointer"
                aria-label="Critério de ordenação da biblioteca"
              >
                <option value="recent" className="bg-zinc-950 text-white">Recém Adicionados</option>
                <option value="rating_desc" className="bg-zinc-950 text-white">Maior Nota (★ 5 → 1)</option>
                <option value="rating_asc" className="bg-zinc-950 text-white">Menor Nota (★ 1 → 5)</option>
                <option value="release_date_desc" className="bg-zinc-950 text-white">Lançamento (Mais recentes)</option>
                <option value="release_date_asc" className="bg-zinc-950 text-white">Lançamento (Mais antigos)</option>
                <option value="title_asc" className="bg-zinc-950 text-white">Título (A → Z)</option>
                <option value="title_desc" className="bg-zinc-950 text-white">Título (Z → A)</option>
              </select>
            </div>
          </div>

          {/* Sub-filtros contextuais elegantes e organizados */}
          {(statusFilter === 'completed' || statusFilter === 'watching') && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3 px-4 mb-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md shadow-lg shadow-black/20">
              {/* Indicador de contexto à esquerda */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-zinc-200 font-semibold">
                  {statusFilter === 'completed'
                    ? `${baseItems.length} concluídos`
                    : `${baseItems.length} em andamento`}
                </span>
                {(ratingFilter !== 'all' || watchProgressFilter !== 'all') && (
                  <span className="text-[11px] text-zinc-500">
                    • Exibindo {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                )}
              </div>

              {/* Controles de Filtro agrupados à direita */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Grupo: Avaliação */}
                <div className="flex items-center gap-1.5 bg-zinc-950/90 p-1 rounded-xl border border-zinc-800/80 shadow-inner">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 flex items-center gap-1 select-none">
                    <Star className="w-3 h-3 text-amber-400/90" />
                    <span className="hidden sm:inline">Nota:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setRatingFilter('all')}
                    className={cn(
                      "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                      ratingFilter === 'all'
                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-850"
                    )}
                  >
                    <span>Todas</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px]",
                      ratingFilter === 'all' ? "bg-black/15 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"
                    )}>
                      {baseItems.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRatingFilter('unrated')}
                    className={cn(
                      "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                      ratingFilter === 'unrated'
                        ? "bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20"
                        : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    )}
                  >
                    <StarOff className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Sem nota</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                        ratingFilter === 'unrated'
                          ? "bg-black/20 text-zinc-950"
                          : "bg-amber-400/20 text-amber-300"
                      )}
                    >
                      {unratedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRatingFilter('rated')}
                    className={cn(
                      "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                      ratingFilter === 'rated'
                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-850"
                    )}
                  >
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>Avaliados</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px]",
                      ratingFilter === 'rated' ? "bg-black/15 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"
                    )}>
                      {ratedCount}
                    </span>
                  </button>
                </div>

                {/* Grupo: Progresso de Séries (Apenas em 'Assistindo' se houver séries) */}
                {statusFilter === 'watching' && hasSeries && (
                  <div className="flex items-center gap-1.5 bg-zinc-950/90 p-1 rounded-xl border border-zinc-800/80 shadow-inner">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 flex items-center gap-1 select-none">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span className="hidden sm:inline">Progresso:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setWatchProgressFilter('all')}
                      className={cn(
                        "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                        watchProgressFilter === 'all'
                          ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                          : "text-zinc-300 hover:text-white hover:bg-zinc-850"
                      )}
                    >
                      Todas as séries
                    </button>

                    <button
                      type="button"
                      onClick={() => setWatchProgressFilter('pending')}
                      className={cn(
                        "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                        watchProgressFilter === 'pending'
                          ? "bg-sky-400 text-zinc-950 font-bold shadow-md shadow-sky-400/20"
                          : "text-sky-300 hover:text-sky-200 hover:bg-sky-500/10"
                      )}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Novos eps</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          watchProgressFilter === 'pending'
                            ? "bg-black/20 text-zinc-950"
                            : "bg-sky-400/20 text-sky-300"
                        )}
                      >
                        {pendingCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWatchProgressFilter('up_to_date')}
                      className={cn(
                        "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                        watchProgressFilter === 'up_to_date'
                          ? "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                          : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Em dia</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          watchProgressFilter === 'up_to_date'
                            ? "bg-black/20 text-white"
                            : "bg-emerald-500/20 text-emerald-300"
                        )}
                      >
                        {upToDateCount}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback de busca quando filtros de status não estão em 'completed' ou 'watching' */}
          {searchQuery.trim() && statusFilter !== 'completed' && statusFilter !== 'watching' && (
            <div className="flex items-center justify-between mb-6 text-xs text-muted-foreground bg-secondary/30 px-3.5 py-2 rounded-xl border border-border/40">
              <span>
                Exibindo <strong className="text-foreground">{filteredItems.length}</strong> {filteredItems.length === 1 ? 'resultado' : 'resultados'} para &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Limpar busca
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted rounded-md" />
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-muted-foreground mb-4">
                {searchQuery.trim()
                  ? `Nenhum título encontrado para "${searchQuery}".`
                  : 'Nenhum título encontrado com estes filtros.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  handleMediaTabChange('all');
                  handleStatusChange('all');
                  setSearchQuery('');
                  handleSortChange('recent');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-7">
              {sortedItems.map((item, index) => {
                const mediaId = (item.tmdb_id ?? item.id)?.toString();
                if (!mediaId) return null;

                const releaseYear = item.release_date ? item.release_date.substring(0, 4) : null;

                return (
                  <div key={item.id || mediaId} className="flex flex-col group min-w-0">
                    <MediaCard
                      item={{
                        id: mediaId,
                        title: item.title || 'Título Desconhecido',
                        type: item.media_type || 'movie',
                        coverVertical: item.poster_path || '',
                        coverHorizontal: item.backdrop_path || '',
                        release_date: item.release_date,
                        isUpToDate: item.is_up_to_date === true,
                        nextEpisodeToWatch: item.next_episode
                          ? { season: item.next_episode.season_number, episode: item.next_episode.episode_number }
                          : undefined,
                      }}
                      layout="poster"
                      priority={index < 12}
                    />
                    {/* Legenda Textual de Identificação Rápida (Opção A) */}
                    <div className="mt-2 px-1">
                      <h4
                        className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                        <span>
                          {releaseYear ? releaseYear : (item.media_type === 'tv' ? 'Série' : 'Filme')}
                        </span>
                        {item.rating && item.rating > 0 ? (
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">
                            ★ {item.rating}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MyListSkeleton() {
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 animate-pulse rounded mt-2" />
        </div>
        <div className="w-full sm:w-80 md:w-96 h-10 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="h-10 w-96 bg-muted/80 animate-pulse rounded-lg mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function MyListPage() {
  return (
    <Suspense fallback={<MyListSkeleton />}>
      <MyListContent />
    </Suspense>
  );
}
