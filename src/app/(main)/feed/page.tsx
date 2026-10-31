'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedStore, FeedFilterType } from '@/store/useFeedStore';
import { friendsService } from '@/services/friendsService';
import { FriendUser } from '@/types/friends';
import { FeedCard } from '@/components/feed/FeedCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  Users, 
  Rss, 
  Film, 
  Tv, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Loader2,
  X,
  UserCheck
} from 'lucide-react';

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    items,
    isLoading,
    isRefreshing,
    hasMore,
    isLoadingMore,
    filter,
    friendFilter,
    fetchFeed,
    setFilters,
    refresh,
    loadMore,
  } = useFeedStore();

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Carrega lista de amigos para a barra de filtros
  useEffect(() => {
    let isMounted = true;
    setIsLoadingFriends(true);
    friendsService.getFriends()
      .then((data) => {
        if (isMounted) {
          setFriends(data);
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar lista de amigos para o filtro do feed:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingFriends(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Deriva filtros a partir da URL
  const urlTypeParam = searchParams.get('type');
  const urlFriendParam = searchParams.get('friend');

  const activeUrlFilter: FeedFilterType = useMemo(() => {
    if (urlTypeParam === 'movie' || urlTypeParam === 'tv') {
      return urlTypeParam;
    }
    return 'all';
  }, [urlTypeParam]);

  const activeUrlFriend = useMemo(() => {
    return urlFriendParam && urlFriendParam.trim() ? urlFriendParam.trim() : null;
  }, [urlFriendParam]);

  // Sincroniza store quando a URL muda
  useEffect(() => {
    const isFilterChanged = activeUrlFilter !== filter;
    const isFriendChanged = activeUrlFriend !== friendFilter;

    if (isFilterChanged || isFriendChanged) {
      setFilters(activeUrlFilter, activeUrlFriend);
    } else if (items.length === 0 && !isLoading) {
      fetchFeed(1, false, activeUrlFilter, false, null, activeUrlFriend);
    }
  }, [activeUrlFilter, activeUrlFriend, filter, friendFilter, items.length, isLoading, setFilters, fetchFeed]);

  // Atualiza parâmetros na URL sem rolagem
  const updateUrl = (newFilter: FeedFilterType, newFriend: string | null) => {
    const params = new URLSearchParams();
    if (newFilter !== 'all') {
      params.set('type', newFilter);
    }
    if (newFriend) {
      params.set('friend', newFriend);
    }

    const queryStr = params.toString();
    const newUrl = queryStr ? `/feed?${queryStr}` : '/feed';
    router.replace(newUrl, { scroll: false });
  };

  const handleFilterChange = (newFilter: FeedFilterType) => {
    if (newFilter === filter) return;
    updateUrl(newFilter, friendFilter);
    setFilters(newFilter, friendFilter);
  };

  const handleFriendSelect = (targetFriend: string | null) => {
    const newFriend = friendFilter === targetFriend ? null : targetFriend;
    updateUrl(filter, newFriend);
    setFilters(filter, newFriend);
  };

  // Identifica o amigo atualmente selecionado para exibição amigável
  const selectedFriendUser = useMemo(() => {
    if (!friendFilter) return null;
    return friends.find(
      (f) => f.username?.toLowerCase() === friendFilter.toLowerCase() || f.id === friendFilter
    );
  }, [friends, friendFilter]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-5 sm:py-7 max-w-5xl min-h-screen">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Rss className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Feed Seguido
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Acompanhe em tempo real o que seus amigos estão assistindo, notas e maratonas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 text-xs h-8 sm:h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Link
            href="/friends"
            className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'gap-1.5 text-xs h-8 sm:h-9' })}
          >
            <Users className="w-3.5 h-3.5" />
            Amigos
          </Link>
        </div>
      </div>

      {/* Barra de Histórias/Amigos Elegante ("Stories Bar") */}
      {(friends.length > 0 || isLoadingFriends) && (
        <div className="pt-4 pb-2 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
              <UserCheck className="w-3 h-3 text-primary" />
              Filtrar por amigo
            </span>
            {friendFilter && (
              <button
                type="button"
                onClick={() => handleFriendSelect(null)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <X className="w-3 h-3" />
                Ver todos
              </button>
            )}
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin no-scrollbar snap-x touch-pan-x">
            {/* Opção Todos */}
            <button
              type="button"
              onClick={() => handleFriendSelect(null)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none snap-start touch-manipulation"
            >
              <div
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                  !friendFilter
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md shadow-primary/20 scale-105'
                    : 'bg-secondary/60 text-muted-foreground border border-border/60 hover:border-primary/50 hover:text-foreground hover:scale-105'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] max-w-[64px] truncate text-center transition-colors ${
                  !friendFilter ? 'font-bold text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                Todos
              </span>
            </button>

            {/* Lista de Amigos com Avatares Sociais */}
            {friends.map((friend) => {
              const identifier = friend.username || friend.id;
              const isSelected = friendFilter?.toLowerCase() === identifier.toLowerCase();
              const initial = (friend.name || friend.username || '?').charAt(0).toUpperCase();

              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => handleFriendSelect(identifier)}
                  aria-label={`Filtrar feed por ${friend.name || friend.username}`}
                  className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none snap-start touch-manipulation"
                >
                  <div
                    className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md shadow-primary/25 scale-105'
                        : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 group-hover:border-primary/60 group-hover:scale-105 shadow-xs'
                    }`}
                  >
                    {initial}
                  </div>
                  <span
                    className={`text-[11px] max-w-[68px] truncate text-center transition-colors ${
                      isSelected ? 'font-bold text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {friend.name || friend.username}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs (Todos os tipos / Filmes / Séries) */}
      <div className="flex items-center justify-between gap-2 my-4 overflow-x-auto pb-1 sm:pb-0">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => handleFilterChange('all')}
            className="rounded-full text-xs h-8 px-3.5 font-semibold touch-manipulation"
          >
            Todos os tipos
          </Button>
          <Button
            size="sm"
            variant={filter === 'movie' ? 'default' : 'ghost'}
            onClick={() => handleFilterChange('movie')}
            className="rounded-full text-xs h-8 px-3.5 font-semibold gap-1.5 touch-manipulation"
          >
            <Film className="w-3.5 h-3.5" />
            Filmes
          </Button>
          <Button
            size="sm"
            variant={filter === 'tv' ? 'default' : 'ghost'}
            onClick={() => handleFilterChange('tv')}
            className="rounded-full text-xs h-8 px-3.5 font-semibold gap-1.5 touch-manipulation"
          >
            <Tv className="w-3.5 h-3.5" />
            Séries
          </Button>
        </div>

        {/* Indicador de filtro ativo */}
        {selectedFriendUser && (
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full border border-primary/20">
            <span>Feed de: <strong>{selectedFriendUser.name}</strong></span>
            <button
              type="button"
              onClick={() => handleFriendSelect(null)}
              aria-label="Remover filtro de amigo"
              className="hover:opacity-75 transition-opacity"
            >
              <X className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        )}
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
            <h2 className="text-lg font-bold text-foreground">
              {friendFilter
                ? `Nenhuma atividade recente de ${selectedFriendUser?.name || friendFilter}`
                : 'Nenhuma atividade recente no Feed'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {friendFilter
                ? 'Este amigo ainda não assistiu a filmes ou séries no período recente ou o tipo filtrado não possui registros.'
                : 'Quando seus amigos marcarem filmes como assistidos ou registrarem episódios de séries, as atividades aparecerão aqui.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {friendFilter ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFriendSelect(null)}
                className="gap-2 text-xs font-semibold"
              >
                Ver feed de todos os amigos
              </Button>
            ) : (
              <Link
                href="/friends"
                className={buttonVariants({ className: 'gap-2 text-xs font-semibold' })}
              >
                <Users className="w-4 h-4" />
                Buscar e Adicionar Amigos
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
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

function FeedSkeleton() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-5 sm:py-7 max-w-5xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 animate-pulse" />
            <div className="h-7 w-44 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-3.5 w-64 bg-muted/60 animate-pulse rounded mt-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 sm:h-9 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-8 sm:h-9 w-24 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Stories skeleton */}
      <div className="pt-4 pb-2 border-b border-border/30">
        <div className="h-3 w-28 bg-muted animate-pulse rounded mb-2.5" />
        <div className="flex items-center gap-3.5 overflow-hidden pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-12 h-12 rounded-full bg-muted/80 animate-pulse" />
              <div className="h-2.5 w-10 bg-muted/60 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Type tabs skeleton */}
      <div className="flex items-center gap-2 my-4">
        <div className="h-8 w-24 bg-muted animate-pulse rounded-full" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 bg-card/60 animate-pulse rounded-2xl border border-border/40 p-4" />
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
