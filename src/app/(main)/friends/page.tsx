'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { friendsService } from '@/services/friendsService';
import { useFriendsStore } from '@/store/useFriendsStore';
import { useUserStore } from '@/store/useUserStore';
import {
  FriendUser,
  FriendRequest,
  UserSearchResult,
  FriendFeedItem,
} from '@/types/friends';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Check,
  X,
  Loader2,
  Clock,
  Calendar,
  AtSign,
  HeartHandshake,
  Inbox,
  Send,
  UserMinus,
  User,
  Clapperboard,
  Film,
  Sparkles,
  Star,
  Share2,
  MoreVertical,
  ArrowRight,
  Copy,
  CheckCircle2,
} from 'lucide-react';

function FriendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, fetchUser } = useUserStore();

  // Carrega usuário atual para compartilhamento de link de perfil
  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    }
  }, [currentUser, fetchUser]);

  // Sincroniza aba ativa inicial com a query string ?tab=
  const initialTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>(() => {
    if (initialTabParam === 'requests' || initialTabParam === 'search') {
      return initialTabParam;
    }
    return 'friends';
  });

  // Reage à navegação do histórico (voltar / avançar)
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'requests' || currentTab === 'search') {
      setActiveTab(currentTab);
    } else {
      setActiveTab('friends');
    }
  }, [searchParams]);

  // Transição de aba com espelhamento limpo na URL
  const handleTabChange = (newTab: 'friends' | 'requests' | 'search') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'friends') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  // Dados
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [recentActivities, setRecentActivities] = useState<Record<string, FriendFeedItem[]>>({});
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Busca de usuários
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filtro na lista de amigos
  const [friendsFilter, setFriendsFilter] = useState('');

  // Ações em andamento (loading por id)
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal de confirmação para desfazer amizade
  const [friendToRemove, setFriendToRemove] = useState<FriendUser | null>(null);

  // Compartilhar meu próprio perfil
  const handleShareMyProfile = () => {
    const handle = currentUser?.username || currentUser?.id;
    if (!handle) {
      toast.add({
        title: 'Perfil não disponível',
        description: 'Não foi possível obter o identificador do seu perfil.',
        type: 'error',
      });
      return;
    }
    const url = `${window.location.origin}/profile/${handle}`;
    navigator.clipboard.writeText(url);
    toast.add({
      title: 'Link copiado!',
      description: 'O link do seu perfil foi copiado para a área de transferência.',
      type: 'success',
    });
  };

  // Compartilhar perfil de um amigo
  const handleShareFriend = (friend: FriendUser) => {
    const handle = friend.username || friend.id;
    const url = `${window.location.origin}/profile/${handle}`;
    navigator.clipboard.writeText(url);
    toast.add({
      title: 'Link copiado!',
      description: `O link do perfil de ${friend.name} foi copiado.`,
      type: 'success',
    });
  };

  // Carrega lista de amigos e últimas atividades cinematográficas em paralelo
  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const [friendsData, feedData] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getFeed(1, 30).catch(() => ({ items: [] })),
      ]);
      setFriends(friendsData);

      // Agrupa atividades recentes por usuário para exibir mini-posters nos cards
      const activityMap: Record<string, FriendFeedItem[]> = {};
      (feedData.items || []).forEach((item) => {
        if (!activityMap[item.user_id]) {
          activityMap[item.user_id] = [];
        }
        if (activityMap[item.user_id].length < 3) {
          activityMap[item.user_id].push(item);
        }
      });
      setRecentActivities(activityMap);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Carrega solicitações
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await friendsService.getRequests();
      setReceivedRequests(data.received);
      setSentRequests(data.sent);
      useFriendsStore.getState().setPendingCount(data.received.length);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  // Debounce para a busca de usuários
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Executa a busca na API com cancelamento via AbortController
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    friendsService
      .searchUsers(debouncedQuery, controller.signal)
      .then((data) => {
        setSearchResults(data);
      })
      .catch((err: any) => {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Erro ao buscar usuários:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // Ação: Enviar solicitação de amizade
  const handleSendRequest = async (user: UserSearchResult) => {
    setProcessingId(user.id);
    try {
      const res = await friendsService.sendFriendRequest({ addressee_id: user.id });
      toast.add({
        title: 'Solicitação enviada!',
        description: `Solicitação de amizade enviada para @${user.username || user.name}.`,
        type: 'success',
      });

      // Atualiza resultado da busca
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, relationship_status: 'pending_sent', friendship_id: res.friendship_id }
            : item
        )
      );

      // Atualiza solicitações enviadas
      loadRequests();
    } catch (err: any) {
      toast.add({
        title: 'Erro ao enviar solicitação',
        description: err?.response?.data?.detail || 'Não foi possível enviar a solicitação.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Ação: Aceitar solicitação
  const handleAcceptRequest = async (friendshipId: string, senderName?: string) => {
    setProcessingId(friendshipId);
    try {
      await friendsService.acceptFriendRequest(friendshipId);
      toast.add({
        title: 'Amizade aceita!',
        description: senderName ? `Agora você e ${senderName} são amigos.` : 'Solicitação aceita.',
        type: 'success',
      });

      // Recarrega amigos e solicitações
      await Promise.all([loadFriends(), loadRequests()]);

      // Atualiza busca se estiver aberta
      setSearchResults((prev) =>
        prev.map((item) =>
          item.friendship_id === friendshipId
            ? { ...item, relationship_status: 'friends' }
            : item
        )
      );
    } catch (err: any) {
      toast.add({
        title: 'Erro ao aceitar',
        description: err?.response?.data?.detail || 'Não foi possível aceitar a solicitação.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Ação: Recusar solicitação recebida
  const handleRejectRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await friendsService.rejectFriendRequest(friendshipId);
      toast.add({
        title: 'Solicitação recusada',
        description: 'A solicitação foi recusada.',
        type: 'info',
      });

      loadRequests();
      setSearchResults((prev) =>
        prev.map((item) =>
          item.friendship_id === friendshipId
            ? { ...item, relationship_status: 'none', friendship_id: null }
            : item
        )
      );
    } catch (err: any) {
      toast.add({
        title: 'Erro ao recusar',
        description: err?.response?.data?.detail || 'Não foi possível recusar a solicitação.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Ação: Cancelar solicitação enviada
  const handleCancelRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await friendsService.cancelFriendRequest(friendshipId);
      toast.add({
        title: 'Solicitação cancelada',
        description: 'A solicitação de amizade foi cancelada.',
        type: 'info',
      });

      loadRequests();
      setSearchResults((prev) =>
        prev.map((item) =>
          item.friendship_id === friendshipId
            ? { ...item, relationship_status: 'none', friendship_id: null }
            : item
        )
      );
    } catch (err: any) {
      toast.add({
        title: 'Erro ao cancelar',
        description: err?.response?.data?.detail || 'Não foi possível cancelar a solicitação.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Ação: Desfazer amizade
  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    setProcessingId(friendToRemove.friendship_id);
    try {
      await friendsService.removeFriend(friendToRemove.friendship_id);
      toast.add({
        title: 'Amizade desfeita',
        description: `Você não é mais amigo de ${friendToRemove.name}.`,
        type: 'info',
      });

      setFriends((prev) => prev.filter((f) => f.friendship_id !== friendToRemove.friendship_id));
      setFriendToRemove(null);

      // Atualiza status na busca se presente
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === friendToRemove.id
            ? { ...item, relationship_status: 'none', friendship_id: null }
            : item
        )
      );
    } catch (err: any) {
      toast.add({
        title: 'Erro ao desfazer amizade',
        description: err?.response?.data?.detail || 'Não foi possível desfazer a amizade.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const term = friendsFilter.toLowerCase().trim();
    if (!term) return true;
    return (
      f.name.toLowerCase().includes(term) ||
      (f.username && f.username.toLowerCase().includes(term))
    );
  });

  function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  const pendingReceivedCount = receivedRequests.length;

  return (
    <div className="p-4 md:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto space-y-8">
      {/* CABEÇALHO HARMONIZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
                Amigos & Cineclube
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Compartilhe o amor por cinema, acompanhe amigos e troque recomendações.
              </p>
            </div>
          </div>
        </div>

        {/* Ação Social de Compartilhamento do Próprio Perfil */}
        <Button
          variant="outline"
          onClick={handleShareMyProfile}
          className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium shadow-sm cursor-pointer self-start sm:self-auto h-9 px-3.5 text-xs"
          title="Compartilhar link do meu perfil"
        >
          <Share2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
          Convidar Amigos
        </Button>
      </div>

      {/* NAVEGAÇÃO POR ABAS: SEGMENTED CONTROLS / PILLS MODERNAS */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
        <div
          className="bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80 inline-flex items-center gap-1.5 w-full sm:w-auto shadow-inner"
          role="tablist"
          aria-label="Abas da comunidade de amigos"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'friends'}
            aria-label={`Meus Amigos (${friends.length})`}
            onClick={() => handleTabChange('friends')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'friends'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <HeartHandshake className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Meus Amigos</span>
            <span className="sm:hidden">Amigos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'friends'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {friends.length}
            </span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'requests'}
            aria-label={`Solicitações de amizade (${pendingReceivedCount} pendentes)`}
            onClick={() => handleTabChange('requests')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0" />
            <span>Solicitações</span>
            {pendingReceivedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black animate-pulse">
                {pendingReceivedCount}
              </span>
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'search'}
            aria-label="Buscar Usuários"
            onClick={() => handleTabChange('search')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Buscar Usuários</span>
            <span className="sm:hidden">Buscar</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: MEUS AMIGOS */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Barra de Filtro Local */}
          {friends.length > 0 && (
            <div className="max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="friends-filter-input"
                  name="friends_filter"
                  aria-label="Filtrar por nome ou @username"
                  value={friendsFilter}
                  onChange={(e) => setFriendsFilter(e.target.value)}
                  placeholder="Filtrar por nome ou @username..."
                  className="pl-9 bg-zinc-950/60 border-zinc-800 focus-visible:ring-primary h-10 text-sm"
                />
              </div>
            </div>
          )}

          {isLoadingFriends ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-full h-14 rounded-lg" />
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            /* EMPTY STATE CINEMATOGRÁFICO ACOLHEDOR */
            <div className="relative p-8 md:p-12 text-center rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 backdrop-blur-md space-y-5 overflow-hidden shadow-sm">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/30 mx-auto flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <Clapperboard className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto relative">
                <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
                  Sua rede cinéfila começa aqui
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Conecte-se com amigos para acompanhar o que eles estão assistindo, trocar avaliações de filmes e séries e descobrir títulos juntos.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative">
                <Button
                  onClick={() => handleTabChange('search')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer h-10 px-5 shadow-md shadow-primary/20"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Cinéfilos
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareMyProfile}
                  className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-medium cursor-pointer h-10 px-5"
                >
                  <Share2 className="w-4 h-4 mr-2 text-primary" />
                  Compartilhar Meu Perfil
                </Button>
              </div>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              Nenhum amigo encontrado para &quot;{friendsFilter}&quot;.
            </div>
          ) : (
            /* GRID DE CARDS CINEMATOGRÁFICOS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <Card
                  key={friend.friendship_id}
                  className="group/card relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700/80 hover:bg-zinc-950/90 transition-all duration-300 shadow-md flex flex-col justify-between"
                >
                  {/* Sutil detalhe cinematográfico no topo */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

                  <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
                    {/* Linha superior: Identidade do Amigo e Ações */}
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={friend.username ? `/profile/${friend.username}` : `/profile/${friend.id}`}
                        className="flex items-center gap-3.5 min-w-0 group/friend hover:opacity-95 transition-opacity"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-zinc-900 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-lg shrink-0 shadow-inner group-hover/friend:border-primary group-hover/friend:scale-105 transition-all">
                            {friend.name ? friend.name.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] text-primary" title="Cinéfilo conectado">
                            <Film className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate text-zinc-100 group-hover/friend:text-primary transition-colors" title={friend.name}>
                            {friend.name}
                          </h3>
                          {friend.username ? (
                            <p className="text-xs text-primary font-mono truncate">
                              @{friend.username}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-400">Sem @username</p>
                          )}
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            Amigos desde {formatDate(friend.since)}
                          </p>
                        </div>
                      </Link>

                      {/* Ações Sociais: Botão "Ver Perfil" e Menu Secundário "..." */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={friend.username ? `/profile/${friend.username}` : `/profile/${friend.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span>Perfil</span>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer outline-none"
                            title="Mais opções"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-zinc-950/95 border-zinc-800 text-zinc-200 backdrop-blur-md shadow-2xl p-1 rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() => router.push(friend.username ? `/profile/${friend.username}` : `/profile/${friend.id}`)}
                              className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/70"
                            >
                              <User className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Ver perfil completo</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShareFriend(friend)}
                              className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/70"
                            >
                              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Compartilhar perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                            <DropdownMenuItem
                              onClick={() => setFriendToRemove(friend)}
                              className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Desfazer amizade</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mini-faixa Cinéfila: Últimas atividades / títulos assistidos */}
                    <div className="border-t border-zinc-800/60 pt-3">
                      {recentActivities[friend.id] && recentActivities[friend.id].length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                              <Clapperboard className="w-3 h-3 text-primary" />
                              Atividade recente
                            </span>
                            <span className="text-zinc-500 text-[10px]">
                              {recentActivities[friend.id].length} título(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                            {recentActivities[friend.id].map((act) => (
                              <Link
                                key={act.id}
                                href={`/${act.media_type}/${act.tmdb_id}`}
                                className="group/poster relative rounded-md overflow-hidden border border-zinc-800 hover:border-primary/80 transition-all shrink-0 shadow-sm"
                                title={`${act.title}${act.rating ? ` (${act.rating}★)` : ''}`}
                              >
                                {act.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w200${act.poster_path}`}
                                    alt={act.title}
                                    className="w-11 h-16 object-cover group-hover/poster:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className="w-11 h-16 bg-zinc-900 flex items-center justify-center text-zinc-600">
                                    <Film className="w-4 h-4" />
                                  </div>
                                )}
                                {act.rating && (
                                  <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center justify-center gap-0.5 py-0.5">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    {act.rating}
                                  </div>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/30 px-3 py-2 rounded-lg border border-zinc-800/40">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <Sparkles className="w-3.5 h-3.5 text-primary/70" />
                            Membro da Comunidade
                          </span>
                          <Link
                            href={friend.username ? `/profile/${friend.username}` : `/profile/${friend.id}`}
                            className="text-primary hover:underline flex items-center gap-1 font-medium text-[11px]"
                          >
                            Ver perfil
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: SOLICITAÇÕES */}
      {activeTab === 'requests' && (
        <div className="space-y-10">
          {/* Seção: Solicitações Recebidas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Inbox className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-zinc-100">
                Solicitações Recebidas ({receivedRequests.length})
              </h2>
            </div>

            {isLoadingRequests ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-20 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-24 h-8" />
                  </div>
                ))}
              </div>
            ) : receivedRequests.length === 0 ? (
              /* EMPTY STATE DE RECEBIDAS */
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-950/30 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">Tudo em dia!</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Você não tem novas solicitações de amizade no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((req) => (
                  <Card key={req.friendship_id} className="border border-zinc-800/80 bg-zinc-950/70 rounded-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <Link
                        href={req.user.username ? `/profile/${req.user.username}` : `/profile/${req.user.id}`}
                        className="flex items-center gap-3 min-w-0 group/req hover:opacity-90 transition-opacity"
                      >
                        <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover/req:border-primary transition-colors">
                          {req.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover/req:text-primary transition-colors">{req.user.name}</h4>
                          {req.user.username && (
                            <p className="text-xs text-primary font-mono">@{req.user.username}</p>
                          )}
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Enviado em {formatDate(req.created_at)}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.friendship_id, req.user.name)}
                          disabled={processingId === req.friendship_id}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 sm:h-8 px-3.5 sm:px-3 text-xs cursor-pointer shadow-sm"
                        >
                          {processingId === req.friendship_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(req.friendship_id)}
                          disabled={processingId === req.friendship_id}
                          className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 h-9 sm:h-8 px-3.5 sm:px-3 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                          Recusar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Seção: Solicitações Enviadas (Aguardando) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Send className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-100">
                Solicitações Enviadas ({sentRequests.length})
              </h2>
            </div>

            {isLoadingRequests ? (
              <Skeleton className="w-full h-16 rounded-xl" />
            ) : sentRequests.length === 0 ? (
              /* EMPTY STATE DE ENVIADAS */
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-950/30 space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                  <Send className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">Nenhuma solicitação enviada aguardando</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Quando você enviar uma solicitação para um amigo, ela ficará listada aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((req) => (
                  <Card key={req.friendship_id} className="border border-zinc-800/80 bg-zinc-950/50 rounded-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <Link
                        href={req.user.username ? `/profile/${req.user.username}` : `/profile/${req.user.id}`}
                        className="flex items-center gap-3 min-w-0 group/sent hover:opacity-90 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0 group-hover/sent:ring-1 group-hover/sent:ring-zinc-600 transition-all">
                          {req.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover/sent:text-primary transition-colors">{req.user.name}</h4>
                          {req.user.username && (
                            <p className="text-xs text-zinc-400 font-mono">@{req.user.username}</p>
                          )}
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-amber-500" /> Aguardando resposta • Enviado em{' '}
                            {formatDate(req.created_at)}
                          </p>
                        </div>
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(req.friendship_id)}
                        disabled={processingId === req.friendship_id}
                        className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-red-400 h-9 sm:h-8 px-3.5 sm:px-3 self-end sm:self-auto cursor-pointer"
                      >
                        {processingId === req.friendship_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Cancelar solicitação
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: BUSCAR / ADICIONAR COM DESCOBERTA ATIVA */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Pesquisar Cinéfilos
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <AtSign className="w-4 h-4" />
              </div>
              <Input
                id="search-user-input"
                name="search_query"
                aria-label="Digite o @username ou nome do usuário"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o @username ou nome do usuário..."
                className="pl-9 pr-10 bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary h-11 text-sm font-medium"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Dica: Digite pelo menos uma letra para buscar. O status de amizade é sincronizado em tempo real.
            </p>
          </div>

          {/* Resultados da Busca ou Painel de Descoberta Cinéfila */}
          <div className="space-y-4">
            {debouncedQuery && (
              <h3 className="text-sm font-semibold text-zinc-300">
                Resultados para &quot;{debouncedQuery}&quot; ({searchResults.length})
              </h3>
            )}

            {isSearching ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-20 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-24 h-8" />
                  </div>
                ))}
              </div>
            ) : debouncedQuery && searchResults.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-2">
                <UserX className="w-8 h-8 text-zinc-500 mx-auto" />
                <h4 className="text-sm font-semibold text-zinc-200">Nenhum cinéfilo encontrado</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Verifique se o @username ou nome foi digitado corretamente.
                </p>
              </div>
            ) : !debouncedQuery ? (
              /* SEÇÃO DE DESCOBERTA E DICAS CINÉFILAS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xs space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100">Busca por @username ou Nome</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Encontre seus amigos e cineclubistas pesquisando pelo identificador único ou nome completo para acompanhar suas listas e notas.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100">Convide Amigos para a Sua Rede</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Compartilhe seu link personalizado para que amigos se cadastrem e comecem a trocar recomendações com você no OmniWatch.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShareMyProfile}
                    className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 w-full sm:w-auto self-start cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    Copiar Link do Meu Perfil
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <Card key={user.id} className="border border-zinc-800/80 bg-zinc-950/80 rounded-2xl hover:border-zinc-700/80 transition-colors">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <Link
                        href={user.username ? `/profile/${user.username}` : `/profile/${user.id}`}
                        className="flex items-center gap-3.5 min-w-0 group/search hover:opacity-90 transition-opacity"
                      >
                        <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover/search:border-primary transition-colors">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover/search:text-primary transition-colors">{user.name}</h4>
                          {user.username ? (
                            <p className="text-xs text-primary font-mono">@{user.username}</p>
                          ) : (
                            <p className="text-xs text-zinc-400">Sem @username</p>
                          )}
                        </div>
                      </Link>

                      {/* Botões Dinâmicos de Ação */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {user.relationship_status === 'none' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(user)}
                            disabled={processingId === user.id}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 sm:h-8 px-3.5 sm:px-3 text-xs cursor-pointer shadow-sm"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Adicionar Amigo
                          </Button>
                        )}

                        {user.relationship_status === 'pending_sent' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Solicitação enviada
                            </span>
                            {user.friendship_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelRequest(user.friendship_id!)}
                                disabled={processingId === user.friendship_id}
                                className="h-9 sm:h-8 px-3 text-xs text-zinc-400 hover:text-red-400 cursor-pointer"
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        )}

                        {user.relationship_status === 'pending_received' && user.friendship_id && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(user.friendship_id!, user.name)}
                              disabled={processingId === user.friendship_id}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 sm:h-8 px-3.5 sm:px-3 text-xs cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(user.friendship_id!)}
                              disabled={processingId === user.friendship_id}
                              className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 h-9 sm:h-8 px-3.5 sm:px-3 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                              Recusar
                            </Button>
                          </div>
                        )}

                        {user.relationship_status === 'friends' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Amigos
                            </span>
                            <Link
                              href={user.username ? `/profile/${user.username}` : `/profile/${user.id}`}
                              className="inline-flex items-center gap-1 h-9 sm:h-8 px-3 text-xs text-zinc-300 hover:text-white hover:bg-zinc-850 rounded-lg border border-zinc-800 cursor-pointer"
                            >
                              <User className="w-3 h-3 text-primary" />
                              Perfil
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO PARA DESFAZER AMIZADE */}
      <Dialog open={!!friendToRemove} onOpenChange={(open) => !open && setFriendToRemove(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white p-6 rounded-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <UserMinus className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-100">
              Desfazer Amizade
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Tem certeza que deseja remover <strong>{friendToRemove?.name}</strong>{' '}
              {friendToRemove?.username ? `(@${friendToRemove.username})` : ''} da sua lista de amigos?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2 justify-end">
            <DialogClose render={<Button type="button" variant="ghost" disabled={!!processingId} className="h-10 sm:h-9 cursor-pointer" />}>
              Cancelar
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={!!processingId}
              onClick={handleConfirmRemoveFriend}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer h-10 sm:h-9"
            >
              {processingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar e Desfazer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FriendsSkeleton() {
  return (
    <div className="p-4 md:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <Skeleton className="w-64 h-4 rounded" />
        </div>
        <Skeleton className="w-36 h-9 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-32 h-10 rounded-xl" />
        <Skeleton className="w-32 h-10 rounded-xl" />
        <Skeleton className="w-32 h-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <Skeleton className="w-full h-14 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={<FriendsSkeleton />}>
      <FriendsContent />
    </Suspense>
  );
}
