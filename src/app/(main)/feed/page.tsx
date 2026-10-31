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

          <Link
            href="/friends"
            className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'gap-1.5 text-xs h-9' })}
          >
            <Users className="w-3.5 h-3.5" />
            Amigos
          </Link>
        </div>
      </div>

      {/* Amigos - Barra Horizontal de Seleção (se existirem amigos) */}
      {(friends.length > 0 || isLoadingFriends) && (
        <div className="pt-6 pb-2">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              Filtrar por amigo
            </span>
            {friendFilter && (
              <button
                type="button"
                onClick={() => handleFriendSelect(null)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar filtro de amigo
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin no-scrollbar">
            {/* Opção Todos */}
            <Button
              size="sm"
              variant={!friendFilter ? 'default' : 'outline'}
              onClick={() => handleFriendSelect(null)}
              className="rounded-full text-xs h-8 px-3.5 font-medium shrink-0 touch-manipulation"
            >
              👥 Todos os amigos
            </Button>

            {/* Lista de Amigos */}
            {friends.map((friend) => {
              const identifier = friend.username || friend.id;
              const isSelected = friendFilter?.toLowerCase() === identifier.toLowerCase();
              const initial = (friend.name || friend.username || '?').charAt(0).toUpperCase();

              return (
                <Button
                  key={friend.id}
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleFriendSelect(identifier)}
                  className={`rounded-full text-xs h-8 pl-1.5 pr-3 font-medium shrink-0 gap-1.5 touch-manipulation transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:border-primary/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-background text-primary' : 'bg-primary/10 text-primary'
                  }`}>
                    {initial}
                  </span>
                  <span>{friend.name || friend.username}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs (Todos / Filmes / Séries) */}
      <div className="flex items-center gap-2 my-4 overflow-x-auto pb-1 sm:pb-0">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => handleFilterChange('all')}
          className="rounded-full text-xs h-9 sm:h-8 px-4 font-semibold touch-manipulation"
        >
          Todos os tipos
        </Button>
        <Button
          size="sm"
          variant={filter === 'movie' ? 'default' : 'ghost'}
          onClick={() => handleFilterChange('movie')}
          className="rounded-full text-xs h-9 sm:h-8 px-4 font-semibold gap-1.5 touch-manipulation"
        >
          <Film className="w-3.5 h-3.5" />
          Filmes
        </Button>
        <Button
          size="sm"
          variant={filter === 'tv' ? 'default' : 'ghost'}
          onClick={() => handleFilterChange('tv')}
          className="rounded-full text-xs h-9 sm:h-8 px-4 font-semibold gap-1.5 touch-manipulation"
        >
          <Tv className="w-3.5 h-3.5" />
          Séries
        </Button>

        {/* Indicador de filtro ativo */}
        {selectedFriendUser && (
          <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
            <span>Vendo feed de: <strong>{selectedFriendUser.name}</strong></span>
            <button
              type="button"
              onClick={() => handleFriendSelect(null)}
              aria-label="Remover filtro de amigo"
              className="hover:opacity-75"
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
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 animate-pulse" />
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-4 w-72 bg-muted/60 animate-pulse rounded mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-2 my-6">
        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
      </div>
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
