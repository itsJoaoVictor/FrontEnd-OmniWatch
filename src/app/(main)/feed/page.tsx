'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useFeedStore } from '@/store/useFeedStore';
import { FeedCard } from '@/components/feed/FeedCard';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Rss, 
  Film, 
  Tv, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Loader2 
} from 'lucide-react';

export default function FeedPage() {
  const {
    items,
    isLoading,
    isRefreshing,
    hasMore,
    isLoadingMore,
    filter,
    fetchFeed,
    setFilter,
    refresh,
    loadMore,
  } = useFeedStore();

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Rss className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Feed Seguido
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Acompanhe em tempo real o que seus amigos estão assistindo, notas e maratonas de séries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Link href="/friends">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs h-9">
              <Users className="w-3.5 h-3.5" />
              Amigos
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 my-6">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className="rounded-full text-xs h-8 px-4 font-semibold"
        >
          Todos
        </Button>
        <Button
          size="sm"
          variant={filter === 'movie' ? 'default' : 'ghost'}
          onClick={() => setFilter('movie')}
          className="rounded-full text-xs h-8 px-4 font-semibold gap-1.5"
        >
          <Film className="w-3.5 h-3.5" />
          Filmes
        </Button>
        <Button
          size="sm"
          variant={filter === 'tv' ? 'default' : 'ghost'}
          onClick={() => setFilter('tv')}
          className="rounded-full text-xs h-8 px-4 font-semibold gap-1.5"
        >
          <Tv className="w-3.5 h-3.5" />
          Séries
        </Button>
      </div>

      {/* Content Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-card/60 animate-pulse rounded-2xl border border-border/40 p-4" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card/40 border border-border/60 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 my-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">
              Nenhuma atividade recente no Feed
            </h3>
            <p className="text-sm text-muted-foreground">
              Quando seus amigos marcarem filmes como assistidos ou registrarem episódios de séries, as atividades aparecerão aqui.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link href="/friends">
              <Button className="gap-2 text-xs font-semibold">
                <Users className="w-4 h-4" />
                Buscar e Adicionar Amigos
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="gap-2 px-6"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando mais...
                  </>
                ) : (
                  'Carregar mais atividades'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
