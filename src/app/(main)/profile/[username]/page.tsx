'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { userService } from '@/services/userService';
import { friendsService } from '@/services/friendsService';
import { useUserStore } from '@/store/useUserStore';
import { PublicUserProfile } from '@/types/user';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
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
  User,
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Clock,
  Calendar,
  Film,
  Tv,
  Star,
  ListPlus,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Heart,
  Layers,
  Sparkles,
  Bookmark,
  Search,
} from 'lucide-react';

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

export default function UserPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawIdentifier = params?.username as string;
  const identifier = rawIdentifier ? decodeURIComponent(rawIdentifier) : '';

  const { user: currentUser, fetchUser } = useUserStore();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aba ativa: 'my-list' | 'favorites' | 'lists'
  const [activeTab, setActiveTab] = useState<'my-list' | 'favorites' | 'lists'>('my-list');

  // Filtros da aba Minha Lista
  const [statusFilter, setStatusFilter] = useState<'all' | 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Ações de amizade em andamento
  const [actionLoading, setActionLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const statusConfig: Record<string, { label: string; color: string }> = {
    watching: { label: 'Assistindo', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    completed: { label: 'Completo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    plan_to_watch: { label: 'Quero Ver', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    on_hold: { label: 'Pausado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
    dropped: { label: 'Abandonado', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  };

  const statusCounts = useMemo(() => {
    const list = profile?.tracked_media || [];
    return {
      all: list.length,
      watching: list.filter((i) => i.status === 'watching').length,
      completed: list.filter((i) => i.status === 'completed').length,
      plan_to_watch: list.filter((i) => i.status === 'plan_to_watch').length,
      on_hold: list.filter((i) => i.status === 'on_hold').length,
      dropped: list.filter((i) => i.status === 'dropped').length,
    };
  }, [profile?.tracked_media]);

  const filteredTrackedMedia = useMemo(() => {
    if (!profile?.tracked_media) return [];
    return profile.tracked_media.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.media_type !== typeFilter) return false;
      if (searchFilter.trim() && !item.title.toLowerCase().includes(searchFilter.toLowerCase().trim())) return false;
      return true;
    });
  }, [profile?.tracked_media, statusFilter, typeFilter, searchFilter]);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    }
  }, [currentUser, fetchUser]);

  useEffect(() => {
    if (!identifier) return;

    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await userService.getPublicProfile(identifier);
        if (!isMounted) return;

        // Se for o próprio perfil, redireciona suavemente para a página /profile
        if (
          data.relationship_status === 'self' ||
          (currentUser && (currentUser.id === data.id || (data.username && currentUser.username === data.username)))
        ) {
          router.replace('/profile');
          return;
        }

        setProfile(data);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Erro ao carregar perfil público:', err);
        setError(err?.response?.data?.detail || 'Usuário não encontrado.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [identifier, currentUser, router]);

  // Ação: Enviar solicitação de amizade
  const handleSendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await friendsService.sendFriendRequest({
        addressee_id: profile.id,
        username: profile.username || undefined,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              relationship_status: 'pending_sent',
              friendship_id: res.friendship_id,
            }
          : null
      );

      toast.add({
        title: 'Solicitação enviada!',
        description: `Uma solicitação de amizade foi enviada para ${profile.name}.`,
        type: 'success',
      });
    } catch (err: any) {
      toast.add({
        title: 'Erro ao solicitar amizade',
        description: err?.response?.data?.detail || 'Não foi possível enviar a solicitação.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Cancelar solicitação enviada
  const handleCancelRequest = async () => {
    if (!profile?.friendship_id) return;
    setActionLoading(true);
    try {
      await friendsService.cancelFriendRequest(profile.friendship_id);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              relationship_status: 'none',
              friendship_id: null,
            }
          : null
      );
      toast.add({
        title: 'Solicitação cancelada',
        description: 'A solicitação de amizade foi cancelada.',
        type: 'info',
      });
    } catch (err: any) {
      toast.add({
        title: 'Erro ao cancelar',
        description: err?.response?.data?.detail || 'Não foi possível cancelar a solicitação.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Aceitar solicitação recebida
  const handleAcceptRequest = async () => {
    if (!profile?.friendship_id) return;
    setActionLoading(true);
    try {
      await friendsService.acceptFriendRequest(profile.friendship_id);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              relationship_status: 'friends',
            }
          : null
      );
      toast.add({
        title: 'Amizade aceita!',
        description: `Agora você e ${profile.name} são amigos.`,
        type: 'success',
      });
    } catch (err: any) {
      toast.add({
        title: 'Erro ao aceitar',
        description: err?.response?.data?.detail || 'Não foi possível aceitar a solicitação.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Recusar solicitação recebida
  const handleRejectRequest = async () => {
    if (!profile?.friendship_id) return;
    setActionLoading(true);
    try {
      await friendsService.rejectFriendRequest(profile.friendship_id);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              relationship_status: 'none',
              friendship_id: null,
            }
          : null
      );
      toast.add({
        title: 'Solicitação recusada',
        description: 'A solicitação foi recusada.',
        type: 'info',
      });
    } catch (err: any) {
      toast.add({
        title: 'Erro ao recusar',
        description: err?.response?.data?.detail || 'Não foi possível recusar.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Desfazer amizade
  const handleRemoveFriend = async () => {
    if (!profile?.friendship_id) return;
    setActionLoading(true);
    try {
      await friendsService.removeFriend(profile.friendship_id);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              relationship_status: 'none',
              friendship_id: null,
            }
          : null
      );
      setIsRemoveDialogOpen(false);
      toast.add({
        title: 'Amizade desfeita',
        description: `Você desfez a amizade com ${profile.name}.`,
        type: 'info',
      });
    } catch (err: any) {
      toast.add({
        title: 'Erro ao desfazer',
        description: err?.response?.data?.detail || 'Não foi possível desfazer a amizade.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="w-56 h-7" />
            <Skeleton className="w-40 h-4" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Link href="/friends">
          <Button variant="ghost" size="sm" className="mb-6 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Amigos
          </Button>
        </Link>
        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
            <UserX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-200">Perfil não encontrado</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            {error || 'Não encontramos nenhum usuário com este identificador ou nome de usuário.'}
          </p>
          <div className="pt-2">
            <Link href="/friends">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Buscar outros usuários
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Botão Voltar */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      {/* CABEÇALHO DO PERFIL */}
      <section className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-2xl md:text-3xl shadow-inner shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-3xl font-bold text-zinc-100">{profile.name}</h1>
                {profile.username && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                    @{profile.username}
                  </span>
                )}
              </div>

              {profile.created_at && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Membro desde {formatDate(profile.created_at)}
                </p>
              )}
            </div>
          </div>

          {/* BOTÕES DE RELACIONAMENTO */}
          <div className="flex items-center gap-2">
            {profile.relationship_status === 'none' && (
              <Button
                onClick={handleSendRequest}
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs md:text-sm h-9 px-4 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Adicionar Amigo
              </Button>
            )}

            {profile.relationship_status === 'pending_sent' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Solicitação Enviada
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelRequest}
                  disabled={actionLoading}
                  className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cancelar'}
                </Button>
              </div>
            )}

            {profile.relationship_status === 'pending_received' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAcceptRequest}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-3 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                  Aceitar Solicitação
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectRequest}
                  disabled={actionLoading}
                  className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-9 px-3 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Recusar
                </Button>
              </div>
            )}

            {profile.relationship_status === 'friends' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  Amigos
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRemoveDialogOpen(true)}
                  disabled={actionLoading}
                  className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2.5 text-xs cursor-pointer"
                  title="Desfazer amizade"
                >
                  <UserX className="w-3.5 h-3.5 mr-1" />
                  Desfazer
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CARDS DE ESTATÍSTICAS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Filmes Assistidos</p>
              <p className="text-xl md:text-2xl font-bold text-zinc-100">{profile.stats.total_movies}</p>
            </div>
          </div>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Episódios Vistos</p>
              <p className="text-xl md:text-2xl font-bold text-zinc-100">{profile.stats.total_episodes}</p>
            </div>
          </div>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tempo Dedicado</p>
              <p className="text-xl md:text-2xl font-bold text-zinc-100">
                {profile.stats.total_time_hours}
                <span className="text-xs text-muted-foreground font-normal ml-1">horas</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Média de Notas</p>
              <p className="text-xl md:text-2xl font-bold text-zinc-100">
                {profile.stats.average_rating > 0 ? profile.stats.average_rating.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('my-list')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my-list'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Lista de Obras</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
              {profile.tracked_media?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Obras Favoritas</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
              {profile.favorite_media?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lists')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lists'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Listas Públicas</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
              {profile.public_lists?.length || 0}
            </span>
          </button>
        </div>

        {/* ABA 1: LISTA DE OBRAS (MY LIST) */}
        {activeTab === 'my-list' && (
          <div className="space-y-6">
            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
              {/* Filtros de Status */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {(
                  [
                    { key: 'all', label: 'Todos', count: statusCounts.all },
                    { key: 'watching', label: 'Assistindo', count: statusCounts.watching },
                    { key: 'completed', label: 'Completos', count: statusCounts.completed },
                    { key: 'plan_to_watch', label: 'Quero Ver', count: statusCounts.plan_to_watch },
                    { key: 'on_hold', label: 'Pausados', count: statusCounts.on_hold },
                    { key: 'dropped', label: 'Abandonados', count: statusCounts.dropped },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === s.key
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        statusFilter === s.key ? 'bg-primary-foreground/20 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filtro por Tipo e Busca */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      typeFilter === 'all' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTypeFilter('movie')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      typeFilter === 'movie' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Filmes
                  </button>
                  <button
                    onClick={() => setTypeFilter('tv')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      typeFilter === 'tv' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Séries
                  </button>
                </div>

                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar títulos..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Grid de Obras */}
            {filteredTrackedMedia.length === 0 ? (
              <div className="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-muted-foreground">
                  <Bookmark className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-zinc-300">
                  {profile.tracked_media?.length === 0
                    ? 'Lista de obras vazia'
                    : 'Nenhuma obra encontrada para os filtros selecionados'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {profile.tracked_media?.length === 0
                    ? 'Este usuário ainda não adicionou nenhum filme ou série à sua lista.'
                    : 'Tente alterar os filtros de status ou tipo para visualizar mais títulos.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTrackedMedia.map((item) => {
                  const cfg = statusConfig[item.status] || {
                    label: item.status,
                    color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                  };

                  return (
                    <Link
                      key={item.id}
                      href={item.media_type === 'movie' ? `/movie/${item.tmdb_id}` : `/tv/${item.tmdb_id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden border border-zinc-800/80 bg-zinc-950/80 hover:border-zinc-700 transition-all flex flex-col h-full group-hover:scale-[1.02]">
                        <div className="aspect-[2/3] relative bg-zinc-900 overflow-hidden">
                          {item.poster_path ? (
                            <Image
                              src={
                                item.poster_path.startsWith('http')
                                  ? item.poster_path
                                  : `https://image.tmdb.org/t/p/w342${item.poster_path}`
                              }
                              alt={item.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              {item.media_type === 'movie' ? <Film className="w-8 h-8" /> : <Tv className="w-8 h-8" />}
                            </div>
                          )}

                          {/* Badge de Tipo */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-md text-[10px] font-semibold text-zinc-200 rounded border border-white/10">
                              {item.media_type === 'movie' ? 'Filme' : 'Série'}
                            </span>
                          </div>

                          {/* Badge de Favorito */}
                          {item.is_favorite && (
                            <div className="absolute top-2 right-2 z-10">
                              <span className="p-1 rounded-full bg-black/80 backdrop-blur-md text-red-400 border border-red-500/30 flex items-center justify-center">
                                <Heart className="w-3 h-3 fill-red-400" />
                              </span>
                            </div>
                          )}

                          {/* Nota dada pelo usuário */}
                          {item.rating && item.rating > 0 && (
                            <div className="absolute bottom-2 right-2 z-10">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/85 backdrop-blur-md text-[10px] font-bold text-amber-400 rounded border border-amber-500/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {item.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                          <h3
                            className="font-medium text-xs text-zinc-200 line-clamp-1 group-hover:text-primary transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </h3>

                          {/* Badge de Status */}
                          <div className="pt-0.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: FAVORITOS */}
        {activeTab === 'favorites' && (
          <div>
            {profile.favorite_media.length === 0 ? (
              <div className="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-muted-foreground">
                  <Heart className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-zinc-300">Nenhuma obra favorita</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Este usuário ainda não favoritou nenhum filme ou série.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {profile.favorite_media.map((fav) => (
                  <Link
                    key={fav.media_id}
                    href={fav.media_type === 'movie' ? `/movie/${fav.tmdb_id}` : `/tv/${fav.tmdb_id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border border-zinc-800/80 bg-zinc-950/80 hover:border-zinc-700 transition-all flex flex-col h-full group-hover:scale-[1.02]">
                      <div className="aspect-[2/3] relative bg-zinc-900 overflow-hidden">
                        {fav.poster_path ? (
                          <Image
                            src={
                              fav.poster_path.startsWith('http')
                                ? fav.poster_path
                                : `https://image.tmdb.org/t/p/w342${fav.poster_path}`
                            }
                            alt={fav.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            {fav.media_type === 'movie' ? <Film className="w-8 h-8" /> : <Tv className="w-8 h-8" />}
                          </div>
                        )}

                        {/* Badge de tipo */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-md text-[10px] font-semibold text-zinc-200 rounded border border-white/10">
                            {fav.media_type === 'movie' ? 'Filme' : 'Série'}
                          </span>
                        </div>

                        {/* Nota pessoal */}
                        {fav.rating && fav.rating > 0 && (
                          <div className="absolute bottom-2 right-2 z-10">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/85 backdrop-blur-md text-[10px] font-bold text-amber-400 rounded border border-amber-500/20">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {fav.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-2.5 flex-1 flex flex-col justify-between">
                        <h3 className="font-medium text-xs text-zinc-200 line-clamp-1 group-hover:text-primary transition-colors" title={fav.title}>
                          {fav.title}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: LISTAS PÚBLICAS */}
        {activeTab === 'lists' && (
          <div>
            {profile.public_lists.length === 0 ? (
              <div className="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-muted-foreground">
                  <ListPlus className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-zinc-300">Nenhuma lista pública</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Este usuário ainda não criou nenhuma lista personalizada com visibilidade pública.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profile.public_lists.map((list) => (
                  <Link key={list.id} href={`/lists/${list.id}`} className="group">
                    <Card className="border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700 transition-all rounded-xl overflow-hidden group-hover:scale-[1.01]">
                      {list.cover_backdrop_path && (
                        <div className="aspect-[16/9] relative bg-zinc-900">
                          <Image
                            src={
                              list.cover_backdrop_path.startsWith('http')
                                ? list.cover_backdrop_path
                                : `https://image.tmdb.org/t/p/w780${list.cover_backdrop_path}`
                            }
                            alt={list.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        </div>
                      )}

                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-primary transition-colors line-clamp-1">
                            {list.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium shrink-0">
                            {list.items_count} {list.items_count === 1 ? 'item' : 'itens'}
                          </span>
                        </div>

                        {list.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2">{list.description}</p>
                        )}

                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 pt-1">
                          <Calendar className="w-3 h-3" />
                          Criada em {formatDate(list.created_at)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* MODAL DE CONFIRMAÇÃO PARA DESFAZER AMIZADE */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Desfazer amizade</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tem certeza que deseja remover <strong>{profile.name}</strong> da sua lista de amigos?
              Vocês não verão mais o feed de atividades um do outro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-4">
            <DialogClose render={<Button type="button" variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={handleRemoveFriend}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
              Desfazer Amizade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
