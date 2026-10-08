'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useMyListStore, ListStatus } from '@/store/useMyListStore';
import { MediaCard } from '@/components/home/MediaCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getFollowedCollections, getCollectionSuggestions } from '@/services/collections';
import { UserFollowedCollection, CollectionSuggestion } from '@/types/collections';
import { FollowedCollectionCard } from '@/components/collections/FollowedCollectionCard';
import { CollectionSuggestionCard } from '@/components/collections/CollectionSuggestionCard';
import { Layers, Compass, Star, StarOff, CheckCircle2, Clock, Play, Heart, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { cn } from '@/lib/utils';

export default function MyListPage() {
  const { items, isLoading, fetchMyList } = useMyListStore();
  const [mediaTab, setMediaTab] = useState<'all' | 'movie' | 'tv' | 'collections'>('all');
  const [statusFilter, setStatusFilter] = useState<ListStatus | 'all'>('all');

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('omniwatch_suggestions_collapsed');
      if (saved !== null) {
        queueMicrotask(() => {
          setIsSuggestionsCollapsed(saved === 'true');
        });
      }
    } catch (e) {
      console.error('Failed to read suggestions collapsed state from localStorage', e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'omniwatch_suggestions_collapsed' && e.newValue !== null) {
        setIsSuggestionsCollapsed(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  // Carrega sugestões para preencher o badge da aba
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    if (mediaTab === 'collections') {
      loadCollections();
      loadSuggestions();
    }
  }, [mediaTab, loadCollections, loadSuggestions]);

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

  // Reset sub-filters when status or media tab changes
  const handleStatusChange = (newStatus: ListStatus | 'all') => {
    setStatusFilter(newStatus);
    setRatingFilter('all');
    setWatchProgressFilter('all');
  };

  const handleMediaTabChange = (val: string) => {
    setMediaTab(val as 'all' | 'movie' | 'tv' | 'collections');
    setRatingFilter('all');
    setWatchProgressFilter('all');
  };

  // Convert dictionary to array for mapping
  const itemsArray = Object.values(items);

  // Base filtered by mediaTab and statusFilter (for counts)
  const baseItems = itemsArray.filter((item) => {
    if (!item || (!item.tmdb_id && !item.id)) return false;
    if (mediaTab !== 'all' && item.media_type !== mediaTab) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
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

  // Pré-carrega em segundo plano os pôsteres dos itens não visíveis (a partir do 13º card)
  const posterPathsToPreload = filteredItems.map((item) => item.poster_path);
  useImagePreloader(posterPathsToPreload, { initialSkip: 12, batchSize: 4 });

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Minha Lista</h1>

      <Tabs
        value={mediaTab}
        onValueChange={handleMediaTabChange}
        className="w-full mb-8"
      >
        <TabsList className="mb-6 bg-secondary/50">
          <TabsTrigger value="all" className="px-6">Todos</TabsTrigger>
          <TabsTrigger value="movie" className="px-6">Filmes</TabsTrigger>
          <TabsTrigger value="tv" className="px-6">Séries</TabsTrigger>
          <TabsTrigger value="collections" className="px-6 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Coleções</span>
            {suggestions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[11px] bg-amber-500/20 text-amber-500 dark:text-amber-400 font-semibold rounded-full border border-amber-500/30">
                {suggestions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Banner de Alerta de Franquias nas outras abas */}
      {suggestions.length > 0 && mediaTab !== 'collections' && (
        <div className="mb-8 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {suggestions.length === 1 ? '1 Franquia Sugerida' : `${suggestions.length} Franquias Sugeridas`}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  {suggestions.length}
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Identificamos filmes de uma mesma coleção na sua lista ({suggestions.map(s => s.name).slice(0, 2).join(', ')}). Deseja acompanhar a saga completa?
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-amber-500/40 text-xs shrink-0 cursor-pointer self-start sm:self-auto font-medium px-3.5 py-1.5 transition-all shadow-sm"
            onClick={() => handleMediaTabChange('collections')}
          >
            Ver Sugestões na aba Coleções →
          </Button>
        </div>
      )}

      {mediaTab === 'collections' ? (
        <div className="space-y-8">
          {/* Seção de Alertas e Sugestões de Coleções */}
          {suggestions.length > 0 && (
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
                        {suggestions.length} {suggestions.length === 1 ? 'identificada' : 'identificadas'}
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
                  {suggestions.map((suggestion) => (
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
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Coleções Seguidas ({collections.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((col) => (
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
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => handleStatusChange('all')}
            >
              Todos os Status
            </Button>
            <Button
              variant={statusFilter === 'plan_to_watch' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => handleStatusChange('plan_to_watch')}
            >
              Quero Ver
            </Button>
            <Button
              variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => handleStatusChange('upcoming')}
            >
              Aguardando Estreia
            </Button>
            <Button
              variant={statusFilter === 'watching' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => handleStatusChange('watching')}
            >
              Assistindo
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => handleStatusChange('completed')}
            >
              Concluídos
            </Button>
            <Button
              variant={statusFilter === 'dropped' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => handleStatusChange('dropped')}
            >
              Abandonados
            </Button>

            <div className="h-6 w-px bg-border/60 self-center mx-1 shrink-0" />

            <Button
              variant={favoriteFilter ? 'default' : 'outline'}
              className={cn(
                "rounded-full cursor-pointer transition-all flex items-center gap-1.5 shrink-0",
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
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
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
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
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
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
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
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
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
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
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
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
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

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted rounded-md" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-muted-foreground mb-4">Nenhum título encontrado com estes filtros.</p>
              <Button
                variant="outline"
                onClick={() => {
                  handleMediaTabChange('all');
                  handleStatusChange('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
              {filteredItems.map((item, index) => {
                const mediaId = (item.tmdb_id ?? item.id)?.toString();
                if (!mediaId) return null;

                return (
                  <div key={item.id || mediaId} className="relative group">
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
