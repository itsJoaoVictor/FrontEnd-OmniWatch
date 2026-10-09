'use client';

import React, { useState, useEffect } from 'react';
import { friendsService } from '@/services/friendsService';
import {
  FriendUser,
  FriendRequest,
  UserSearchResult,
} from '@/types/friends';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  // Dados
  const [friends, setFriends] = useState<FriendUser[]>([]);
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

  // Carrega lista de amigos
  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const data = await friendsService.getFriends();
      setFriends(data);
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

  // Executa a busca na API
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    friendsService
      .searchUsers(debouncedQuery)
      .then((data) => {
        if (!isCancelled) {
          setSearchResults(data);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Erro ao buscar usuários:', err);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSearching(false);
        }
      });

    return () => {
      isCancelled = true;
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Amigos</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            Conecte-se com outros usuários, compartilhe o amor por filmes e séries e acompanhe amigos.
          </p>
        </div>

        {/* Botão de atalho para buscar */}
        <Button
          onClick={() => setActiveTab('search')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Amigos
        </Button>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'friends'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Meus Amigos</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
            {friends.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Solicitações</span>
          {pendingReceivedCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground animate-pulse">
              {pendingReceivedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'search'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Buscar Usuários</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: MEUS AMIGOS */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Barra de Filtro Local */}
          {friends.length > 0 && (
            <div className="max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
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
                <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-4">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-muted-foreground">
                <Users className="w-7 h-7 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-zinc-200">Você ainda não tem amigos adicionados</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Encontre seus amigos pesquisando pelo @username e envie solicitações de amizade.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('search')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar Usuários
              </Button>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum amigo encontrado para &quot;{friendsFilter}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <Card
                  key={friend.friendship_id}
                  className="border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition-all shadow-sm rounded-xl overflow-hidden"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base shrink-0 shadow-inner">
                        {friend.name ? friend.name.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate text-zinc-100" title={friend.name}>
                          {friend.name}
                        </h3>
                        {friend.username && (
                          <p className="text-xs text-primary font-mono truncate">
                            @{friend.username}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Amigos desde {formatDate(friend.since)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFriendToRemove(friend)}
                      disabled={processingId === friend.friendship_id}
                      className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-2.5 text-xs shrink-0 cursor-pointer"
                      title="Desfazer amizade"
                    >
                      <UserX className="w-4 h-4 mr-1.5" />
                      Desfazer
                    </Button>
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
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
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
              <p className="text-sm text-muted-foreground p-6 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/30 text-center">
                Você não tem novas solicitações de amizade no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((req) => (
                  <Card key={req.friendship_id} className="border border-zinc-800 bg-zinc-950/70 rounded-xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {req.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-zinc-100">{req.user.name}</h4>
                          {req.user.username && (
                            <p className="text-xs text-primary font-mono">@{req.user.username}</p>
                          )}
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Enviado em {formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.friendship_id, req.user.name)}
                          disabled={processingId === req.friendship_id}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 text-xs cursor-pointer"
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
                          className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 h-8 cursor-pointer"
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
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Send className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-100">
                Solicitações Enviadas ({sentRequests.length})
              </h2>
            </div>

            {isLoadingRequests ? (
              <Skeleton className="w-full h-16 rounded-xl" />
            ) : sentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/30 text-center">
                Nenhuma solicitação enviada pendente.
              </p>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((req) => (
                  <Card key={req.friendship_id} className="border border-zinc-800 bg-zinc-950/50 rounded-xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0">
                          {req.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-zinc-100">{req.user.name}</h4>
                          {req.user.username && (
                            <p className="text-xs text-zinc-400 font-mono">@{req.user.username}</p>
                          )}
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-amber-500" /> Aguardando resposta • Enviado em{' '}
                            {formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(req.friendship_id)}
                        disabled={processingId === req.friendship_id}
                        className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-red-400 h-8 self-end sm:self-auto cursor-pointer"
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

      {/* CONTEÚDO DA ABA 3: BUSCAR / ADICIONAR */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Pesquisar Usuários
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <AtSign className="w-4 h-4" />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o @username ou nome do usuário..."
                autoFocus
                className="pl-9 pr-10 bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary h-11 text-sm font-medium"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: Digite pelo menos uma letra para buscar. O status do relacionamento será atualizado automaticamente.
            </p>
          </div>

          {/* Resultados da Busca */}
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
                <h4 className="text-sm font-semibold text-zinc-200">Nenhum usuário encontrado</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Verifique se o @username ou nome foi digitado corretamente.
                </p>
              </div>
            ) : !debouncedQuery ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 space-y-2">
                <AtSign className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-medium text-zinc-400">Pronto para buscar</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Comece a digitar acima para localizar amigos e outros membros do OmniWatch.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <Card key={user.id} className="border border-zinc-800 bg-zinc-950/80 rounded-xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-zinc-100">{user.name}</h4>
                          {user.username ? (
                            <p className="text-xs text-primary font-mono">@{user.username}</p>
                          ) : (
                            <p className="text-xs text-zinc-500">Sem @username</p>
                          )}
                        </div>
                      </div>

                      {/* Botões Dinâmicos de Ação */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {user.relationship_status === 'none' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(user)}
                            disabled={processingId === user.id}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 text-xs cursor-pointer"
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
                                className="h-8 text-xs text-zinc-400 hover:text-red-400 cursor-pointer"
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
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 text-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(user.friendship_id!)}
                              disabled={processingId === user.friendship_id}
                              className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 h-8 cursor-pointer"
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
                            {user.friendship_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setFriendToRemove({
                                    id: user.id,
                                    name: user.name,
                                    username: user.username,
                                    friendship_id: user.friendship_id!,
                                    since: '',
                                  })
                                }
                                className="h-8 text-xs text-zinc-400 hover:text-red-400 cursor-pointer"
                              >
                                Desfazer
                              </Button>
                            )}
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
            <DialogClose render={<Button type="button" variant="ghost" disabled={!!processingId} />}>
              Cancelar
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={!!processingId}
              onClick={handleConfirmRemoveFriend}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
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
