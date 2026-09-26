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
import { Layers, Compass } from 'lucide-react';
import { useImagePreloader } from '@/hooks/useImagePreloader';

export default function MyListPage() {
  const { items, isLoading, fetchMyList } = useMyListStore();
  const [mediaTab, setMediaTab] = useState<'all' | 'movie' | 'tv' | 'collections'>('all');
  const [statusFilter, setStatusFilter] = useState<ListStatus | 'all'>('all');

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

  // Convert dictionary to array for mapping
  const itemsArray = Object.values(items);

  // Filter items
  const filteredItems = itemsArray.filter((item) => {
    if (!item || (!item.tmdb_id && !item.id)) return false;

    // 1. Filter by media type
    if (mediaTab !== 'all' && item.media_type !== mediaTab) return false;

    // 2. Filter by status
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

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
        onValueChange={(val) => setMediaTab(val as any)}
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
              onClick={() => setStatusFilter('all')}
            >
              Todos os Status
            </Button>
            <Button
              variant={statusFilter === 'plan_to_watch' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => setStatusFilter('plan_to_watch')}
            >
              Quero Ver
            </Button>
            <Button
              variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => setStatusFilter('upcoming')}
            >
              Aguardando Estreia
            </Button>
            <Button
              variant={statusFilter === 'watching' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => setStatusFilter('watching')}
            >
              Assistindo
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => setStatusFilter('completed')}
            >
              Concluídos
            </Button>
            <Button
              variant={statusFilter === 'dropped' ? 'default' : 'outline'}
              className="rounded-full cursor-pointer"
              onClick={() => setStatusFilter('dropped')}
            >
              Abandonados
            </Button>
          </div>

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
                  setMediaTab('all');
                  setStatusFilter('all');
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
