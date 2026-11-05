"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Film,
  RotateCw,
  Star,
  Trash2,
  BookmarkPlus,
  Check,
  Play,
  Bookmark,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpDown
} from "lucide-react";
import { UserFollowedCollection } from "@/types/collections";
import {
  getCollectionStatus,
  getCollectionDetails,
  followCollection,
  syncCollection,
  unfollowCollection,
} from "@/services/collections";
import { Button } from "@/components/ui/button";
import { FilterSearchInput } from "@/components/shared/FilterSearchInput";
import { toast } from "@/components/ui/toast";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { PosterImage } from "@/components/shared/PosterImage";
import { useMyListStore } from "@/store/useMyListStore";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  completed: "Assistido",
  watching: "Assistindo",
  plan_to_watch: "Quero Ver",
  upcoming: "Aguardando",
  dropped: "Abandonado",
};

export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tmdbId = Number(params.id);

  const [collection, setCollection] = useState<UserFollowedCollection | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "completed" | "pending">("all");
  const [sortOrder, setSortOrder] = useState<"chronological" | "rating_desc">("chronological");

  const listItems = useMyListStore((s) => s.items);
  const fetchMyList = useMyListStore((s) => s.fetchMyList);

  useEffect(() => {
    if (Object.keys(useMyListStore.getState().items).length === 0) {
      fetchMyList();
    }
  }, [fetchMyList]);

  const load = useCallback(async () => {
    if (!tmdbId || isNaN(tmdbId)) return;
    try {
      const [statusRes, tmdbData] = await Promise.all([
        getCollectionStatus(tmdbId).catch(() => null),
        getCollectionDetails(tmdbId).catch(() => null),
      ]);

      if (!tmdbData) {
        setCollection(null);
        return;
      }

      const parts = tmdbData.parts || [];
      const total = parts.length;
      const following = statusRes?.is_following ?? false;
      setIsFollowing(following);

      const currentList = useMyListStore.getState().items;
      const watched = parts.filter(
        (p: any) => currentList[p.id]?.status === "completed"
      ).length;
      const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

      setCollection({
        id: String(statusRes?.collection_id || tmdbData.id),
        tmdb_id: tmdbData.id,
        name: tmdbData.name,
        overview: tmdbData.overview,
        poster_path: tmdbData.poster_path,
        backdrop_path: tmdbData.backdrop_path,
        total_movies: total,
        watched_movies: statusRes ? statusRes.watched_movies : watched,
        completion_percentage: pct,
        items: parts.map((p: any) => ({
          id: String(p.id),
          tmdb_id: p.id,
          title: p.title,
          release_date: p.release_date,
          poster_path: p.poster_path,
          backdrop_path: p.backdrop_path,
          status: currentList[p.id]?.status ?? null,
          rating: currentList[p.id]?.rating ?? null,
        })),
        created_at: new Date().toISOString(),
      });
    } catch {
      setCollection(null);
    } finally {
      setLoading(false);
    }
  }, [tmdbId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFollow() {
    if (!collection || busy) return;
    setBusy(true);
    try {
      const res = await followCollection(collection.tmdb_id);
      toast.add({
        title: "Coleção seguida!",
        description: `Você começou a acompanhar ${collection.name}. ${res.movies_added} novos filmes foram adicionados à sua lista.`,
        type: "success",
      });
      setIsFollowing(true);
      await Promise.all([load(), fetchMyList()]);
    } catch (err: any) {
      toast.add({
        title: "Erro ao seguir coleção",
        description: err.response?.data?.detail || "Falha ao seguir coleção.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (!collection || busy) return;
    setBusy(true);
    try {
      const res = await syncCollection(collection.tmdb_id);
      const totalAdded = (res.new_parts_count || 0) + (res.reconciled_count || 0);
      toast.add({
        title: totalAdded > 0 ? "Coleção sincronizada!" : "Tudo atualizado!",
        description:
          totalAdded > 0
            ? `${totalAdded} filme(s) foram colocados na sua lista em "Quero Ver".`
            : "Todos os filmes da franquia já estão na sua lista e não há lançamentos novos no TMDB.",
        type: totalAdded > 0 ? "success" : "info",
      });
      await Promise.all([load(), fetchMyList()]);
    } catch (err: any) {
      toast.add({
        title: "Erro ao sincronizar",
        description: err.response?.data?.detail || "Falha ao verificar novidades no TMDB.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUnfollow() {
    if (!collection || busy) return;
    if (!confirm(`Deseja parar de monitorar a coleção "${collection.name}"? Os filmes adicionados continuarão na sua lista.`)) return;
    setBusy(true);
    try {
      await unfollowCollection(collection.tmdb_id);
      toast.add({ title: "Coleção removida", description: `Você deixou de seguir "${collection.name}".`, type: "info" });
      router.push("/my-list?tab=collections");
    } catch {
      toast.add({ title: "Erro", description: "Não foi possível deixar de seguir a coleção.", type: "error" });
      setBusy(false);
    }
  }

  // Ordenação cronológica base
  const chronologicallySortedParts = useMemo(() => {
    if (!collection?.items) return [];
    return [...collection.items].sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateA - dateB;
    });
  }, [collection?.items]);

  // Mapa de numeração cronológica oficial (#1, #2, #3...)
  const chronologicalIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    chronologicallySortedParts.forEach((part, index) => {
      map.set(part.tmdb_id, index + 1);
    });
    return map;
  }, [chronologicallySortedParts]);

  // Estatísticas calculadas dinamicamente com os dados mais recentes do store
  const stats = useMemo(() => {
    if (!collection?.items) return { total: 0, watched: 0, pending: 0, pct: 0, averageRating: null, ratedCount: 0 };
    const total = collection.items.length;
    let watched = 0;
    let ratedSum = 0;
    let ratedCount = 0;

    for (const item of collection.items) {
      const saved = listItems[item.tmdb_id];
      const status = saved?.status ?? item.status;
      if (status === "completed") {
        watched++;
      }
      const rating = saved?.rating ?? item.rating;
      if (typeof rating === "number" && rating > 0) {
        ratedSum += rating;
        ratedCount++;
      }
    }

    const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
    const averageRating = ratedCount > 0 ? (ratedSum / ratedCount).toFixed(1) : null;

    return { total, watched, pending: total - watched, pct, averageRating, ratedCount };
  }, [collection?.items, listItems]);

  // Filtragem e ordenação dos filmes para exibição no grid
  const displayedItems = useMemo(() => {
    let list = [...chronologicallySortedParts];

    // Ordenação
    if (sortOrder === "rating_desc") {
      list.sort((a, b) => {
        const rA = listItems[a.tmdb_id]?.rating ?? a.rating ?? 0;
        const rB = listItems[b.tmdb_id]?.rating ?? b.rating ?? 0;
        if (rB !== rA) return rB - rA;
        const dA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dA - dB;
      });
    }

    // Filtro por Tab (Todos / Assistidos / Pendentes)
    if (filterTab === "completed") {
      list = list.filter((item) => {
        const saved = listItems[item.tmdb_id];
        return (saved?.status ?? item.status) === "completed";
      });
    } else if (filterTab === "pending") {
      list = list.filter((item) => {
        const saved = listItems[item.tmdb_id];
        return (saved?.status ?? item.status) !== "completed";
      });
    }

    // Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => (item.title || "").toLowerCase().includes(q));
    }

    return list;
  }, [chronologicallySortedParts, sortOrder, filterTab, searchQuery, listItems]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-6xl mx-auto space-y-6">
        <div className="h-80 w-full bg-muted/60 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen pt-28 px-4 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Coleção não encontrada</h2>
        <p className="text-muted-foreground">Esta franquia não foi encontrada ou está temporariamente indisponível no TMDB.</p>
        <Link href="/my-list?tab=collections">
          <Button variant="outline" className="gap-2 cursor-pointer mt-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Coleções
          </Button>
        </Link>
      </div>
    );
  }

  const backdropUrl = collection.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`
    : null;
  const isAllCompleted = stats.total > 0 && stats.watched === stats.total;

  return (
    <div className="min-h-screen pb-20">
      {/* ========================================================= */}
      {/* HERO CINEMATOGRÁFICO ADAPTÁVEL A TODOS OS TEMAS          */}
      {/* ========================================================= */}
      <section className="relative w-full overflow-hidden bg-background border-b border-border/60 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Backdrop sutil com gradiente adaptável */}
        {backdropUrl && (
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <Image
              src={backdropUrl}
              alt={collection.name}
              fill
              priority
              className="object-cover object-top opacity-20 sm:opacity-25 dark:opacity-20 filter blur-[1px] scale-105"
              sizes="100vw"
            />
            {/* Gradiente multi-camada que respeita a cor de fundo do tema */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          {/* Breadcrumbs / Botão de Voltar */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/my-list?tab=collections"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground bg-card/80 hover:bg-accent border border-border/60 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Biblioteca</span>
              <span className="text-muted-foreground/60">•</span>
              <span>Coleções</span>
            </Link>

            {/* Badge de sincronização se seguido */}
            {isFollowing && (
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Monitoramento Ativo</span>
                <span className="sm:hidden">Seguindo</span>
              </span>
            )}
          </div>

          {/* Grid Principal do Hero (Poster Vertical + Metadados Ricos) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 pt-2">
            {/* Poster Vertical em Destaque com efeito vidro e sombra */}
            <div className="relative w-40 sm:w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden bg-card shadow-2xl border border-border/80 shrink-0 group">
              <PosterImage
                src={collection.poster_path}
                fallbackSrc={collection.backdrop_path}
                alt={collection.name}
                title={collection.name}
                type="movie"
                fill
                priority
                sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 224px"
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-black/75 backdrop-blur-md text-white uppercase tracking-wider border border-white/10 shadow-md">
                  Franquia
                </span>
              </div>
            </div>

            {/* Coluna de Informações e Controles */}
            <div className="flex-1 min-w-0 space-y-4 text-center sm:text-left">
              {/* Badges de Destaque */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold border border-border/50">
                  <Film className="w-3.5 h-3.5 text-primary" />
                  {stats.total} {stats.total === 1 ? "Filme" : "Filmes"}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                    isAllCompleted
                      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {isAllCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Coleção Completa
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> {stats.pct}% Concluído
                    </>
                  )}
                </span>

                {stats.averageRating && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-bold shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Sua Média: {stats.averageRating}</span>
                  </span>
                )}
              </div>

              {/* Título Principal */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {collection.name}
              </h1>

              {/* Sinopse / Overview */}
              {collection.overview ? (
                <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {collection.overview}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Franquia cinematográfica oficial registrada no The Movie Database.
                </p>
              )}

              {/* Barra de Progresso Integrada */}
              <div className="space-y-1.5 max-w-lg mx-auto sm:mx-0">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-muted-foreground">Progresso de visualização</span>
                  <span className="font-bold text-foreground">
                    {stats.watched} de {stats.total} assistidos ({stats.pct}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/40">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isAllCompleted ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
              </div>

              {/* Barra de Ações (Seguir, Sincronizar, Deixar de seguir) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                {isFollowing ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSync}
                      disabled={busy}
                      className="rounded-xl gap-2 text-xs font-semibold cursor-pointer shadow-sm bg-card hover:bg-accent border border-border"
                      title="Verificar novos lançamentos ou reconciliar filmes no TMDB"
                    >
                      <RotateCw className={cn("w-3.5 h-3.5 text-primary", busy && "animate-spin")} />
                      <span>{busy ? "Sincronizando..." : "Sincronizar TMDB"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnfollow}
                      disabled={busy}
                      className="rounded-xl gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-border hover:border-destructive/30 cursor-pointer transition-colors"
                      title="Parar de monitorar esta coleção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Deixar de seguir</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleFollow}
                    disabled={busy}
                    size="sm"
                    className="rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 shadow-lg shadow-primary/20 cursor-pointer transition-all"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>{busy ? "Adicionando..." : "Seguir Franquia"}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SEÇÃO DE FILMES DA FRANQUIA (CRONOLOGIA & CARDS MODERNOS)  */}
      {/* ========================================================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Barra de Controles (Abas de Status, Ordenação e Busca) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 border border-border/80 p-2 sm:p-2.5 rounded-2xl shadow-sm">
          {/* Segmented Control de Status */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-background/80 rounded-xl border border-border/60">
            <button
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                filterTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <span>Todos os Filmes</span>
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", filterTab === "all" ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setFilterTab("completed")}
              className={cn(
                "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                filterTab === "completed"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Assistidos</span>
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", filterTab === "completed" ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                {stats.watched}
              </span>
            </button>

            <button
              onClick={() => setFilterTab("pending")}
              className={cn(
                "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                filterTab === "pending"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes</span>
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", filterTab === "pending" ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                {stats.pending}
              </span>
            </button>
          </div>

          {/* Lado Direito: Seletor de Ordenação + Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Seletor de Ordem (Cronológica vs Maior Nota) */}
            <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 px-3 py-1.5 min-h-[36px] rounded-xl text-xs text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-xs text-foreground font-semibold focus:outline-none cursor-pointer"
                aria-label="Critério de ordenação dos filmes da franquia"
              >
                <option value="chronological" className="bg-popover text-popover-foreground">Ordem Cronológica (Ano)</option>
                <option value="rating_desc" className="bg-popover text-popover-foreground">Melhor Avaliados (★)</option>
              </select>
            </div>

            {/* Campo de Busca Rápida */}
            {collection.items && collection.items.length > 2 && (
              <div className="w-full sm:w-64">
                <FilterSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar na franquia..."
                  size="sm"
                  showCount={Boolean(searchQuery.trim())}
                  resultCount={displayedItems.length}
                  totalCount={collection.items.length}
                />
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* GRID DE FILMES (PADRÃO CARD UNIFICADO MODERNO)            */}
        {/* ========================================================= */}
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card/40 border border-border/60 rounded-3xl p-6">
            <Film className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-base font-semibold text-foreground">Nenhum filme encontrado</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {searchQuery.trim()
                ? `Nenhum título corresponde a "${searchQuery}".`
                : "Não há filmes que correspondam ao filtro de status selecionado."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterTab("all");
                setSearchQuery("");
                setSortOrder("chronological");
              }}
              className="cursor-pointer"
            >
              Redefinir Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4.5">
            {displayedItems.map((item, index) => {
              const saved = listItems[item.tmdb_id];
              const status = saved?.status ?? item.status;
              const rating = saved?.rating ?? item.rating;
              const releaseYear = item.release_date ? String(item.release_date).substring(0, 4) : null;
              const chronologicalIndex = chronologicalIndexMap.get(item.tmdb_id) || index + 1;
              const isWatched = status === "completed";

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-card hover:bg-card/90 border border-border/80 hover:border-border p-2 sm:p-2.5 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 cursor-pointer select-none min-w-0"
                >
                  {/* Poster Limpo e Polido */}
                  <Link href={`/movie/${item.tmdb_id}`} prefetch={false} className="block">
                    <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-sm border border-border/40">
                      <PosterImage
                        src={item.poster_path}
                        fallbackSrc={item.backdrop_path}
                        alt={item.title}
                        title={item.title}
                        type="movie"
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Selo de Ordem Cronológica (#1, #2, #3...) */}
                      <div className="absolute top-2 left-2 z-10 pointer-events-none">
                        <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-black/80 backdrop-blur-md text-white uppercase tracking-wider border border-white/10 shadow-sm">
                          #{chronologicalIndex}
                        </span>
                      </div>

                      {/* Botão de Favorito no Canto Superior Direito */}
                      <div
                        className="absolute top-1.5 right-1.5 z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <FavoriteButton
                          tmdb_id={item.tmdb_id}
                          size="sm"
                          className="w-7 h-7 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 text-white shadow-md"
                        />
                      </div>

                      {/* Micro-badge de Avaliação no Rodapé do Poster */}
                      {rating && rating > 0 ? (
                        <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1 shadow-md pointer-events-none">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{Number(rating).toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>
                  </Link>

                  {/* Corpo do Card com Metadados */}
                  <div className="pt-2.5 px-0.5 flex flex-col flex-1 justify-between gap-1.5">
                    <div>
                      <Link href={`/movie/${item.tmdb_id}`} prefetch={false}>
                        <h3
                          className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                        <span>{releaseYear || "Filme"}</span>
                        <span className="text-[10px] text-muted-foreground/80 font-medium">
                          {chronologicalIndex}º da saga
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Semântica e Ação Rápida de Menu */}
                    <div className="mt-1 pt-1.5 border-t border-border/50 flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md truncate",
                          status === "completed"
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                            : status === "watching"
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/25"
                            : status === "plan_to_watch"
                            ? "bg-blue-500/15 text-blue-500 border border-blue-500/25"
                            : status === "upcoming"
                            ? "bg-purple-500/15 text-purple-500 border border-purple-500/25"
                            : "bg-secondary text-muted-foreground border border-border/50"
                        )}
                      >
                        {status === "completed" && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                        {status === "watching" && <Play className="w-2.5 h-2.5 fill-current" />}
                        {status === "plan_to_watch" && <Bookmark className="w-2.5 h-2.5" />}
                        <span>{(status && STATUS_LABEL[status]) || "Não na lista"}</span>
                      </span>

                      {/* Botão de Alterar Status Rápido */}
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="shrink-0"
                      >
                        <AddToListButton
                          tmdb_id={item.tmdb_id}
                          media_type="movie"
                          title={item.title}
                          poster_path={item.poster_path}
                          backdrop_path={item.backdrop_path}
                          release_date={item.release_date}
                          className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md [&>svg]:w-3.5 [&>svg]:h-3.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
