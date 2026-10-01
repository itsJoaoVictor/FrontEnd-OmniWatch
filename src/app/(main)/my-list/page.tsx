'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useMyListStore, ListStatus } from '@/store/useMyListStore';
import { MediaCard } from '@/components/home/MediaCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getFollowedCollections } from '@/services/collections';
import { UserFollowedCollection } from '@/types/collections';
import { FollowedCollectionCard } from '@/components/collections/FollowedCollectionCard';
import { Layers, Compass, Star, StarOff, CheckCircle2, Clock, Play } from 'lucide-react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { cn } from '@/lib/utils';

export default function MyListPage() {
  const { items, isLoading, fetchMyList } = useMyListStore();
  const [mediaTab, setMediaTab] = useState<'all' | 'movie' | 'tv' | 'collections'>('all');
  const [statusFilter, setStatusFilter] = useState<ListStatus | 'all'>('all');

  // Sub-filters for rating & progress
  const [ratingFilter, setRatingFilter] = useState<'all' | 'unrated' | 'rated'>('all');
  const [watchProgressFilter, setWatchProgressFilter] = useState<'all' | 'up_to_date' | 'pending'>('all');

  // Collections state
  const [collections, setCollections] = useState<UserFollowedCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

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

  useEffect(() => {
    if (mediaTab === 'collections') {
      loadCollections();
    }
  }, [mediaTab, loadCollections]);

  function handleUnfollowCollection(tmdbId: number) {
    setCollections((prev) => prev.filter((c) => c.tmdb_id !== tmdbId));
  }

  // Reset sub-filters when status or media tab changes
  const handleStatusChange = (newStatus: ListStatus | 'all') => {
    setStatusFilter(newStatus);
    setRatingFilter('all');
    setWatchProgressFilter('all');
  };

  const handleMediaTabChange = (val: string) => {
    setMediaTab(val as any);
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
  const hasSeries = baseItems.some((i) => i.media_type === 'tv');

  // Filter items
  const filteredItems = baseItems.filter((item) => {
    // 3. Filter by rating
    if (ratingFilter === 'unrated' && (item.rating && item.rating > 0)) return false;
    if (ratingFilter === 'rated' && (!item.rating || item.rating === 0)) return false;

    // 4. Filter by watch progress (for watching series)
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
        defaultValue="all"
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
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mediaTab === 'collections' ? (
        <div>
          {isLoadingCollections ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-muted rounded-xl" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center mb-4 text-muted-foreground">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma coleção seguida</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Ao navegar pelos filmes de sagas como Demon Slayer, John Wick ou Harry Potter, clique em{' '}
                <strong className="text-foreground">"Seguir Coleção"</strong> para adicionar e acompanhar
                todos os filmes automaticamente.
              </p>
              <Link href="/explore">
                <Button className="gap-2 cursor-pointer">
                  <Compass className="w-4 h-4" />
                  Explorar Títulos
                </Button>
              </Link>
            </div>
          ) : (
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
