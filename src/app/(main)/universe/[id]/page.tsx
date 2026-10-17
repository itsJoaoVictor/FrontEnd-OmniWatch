"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Film,
  Tv,
  Layers,
  RotateCw,
  Star,
  Trash2,
  BookmarkPlus,
  Eye,
  EyeOff,
  Ban,
  Sparkles,
} from "lucide-react";
import { UserFollowedUniverse, UniverseFollowedItem } from "@/types/universes";
import {
  getFollowedUniverses,
  getUniverseDetails,
  getUniverseStatus,
  syncUniverse,
  unfollowUniverse,
  toggleUniverseItemIgnore,
  updateUniverseSettings,
} from "@/services/universes";
import { UniverseFollowModal } from "@/components/universes/UniverseFollowModal";
import { Button } from "@/components/ui/button";
import { FilterSearchInput } from "@/components/shared/FilterSearchInput";
import { toast } from "@/components/ui/toast";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { useMyListStore } from "@/store/useMyListStore";

const STATUS_LABEL: Record<string, string> = {
  completed: "Assistido",
  watched: "Assistido",
  watching: "Assistindo",
  plan_to_watch: "Quero Ver",
  upcoming: "Aguardando Estreia",
  dropped: "Abandonado",
};

export default function UniversePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const universeKey = decodeURIComponent(params.id || "");

  const [universe, setUniverse] = useState<UserFollowedUniverse | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "tv">("all");
  const [showIgnored, setShowIgnored] = useState(false);

  const listItems = useMyListStore((s) => s.items);
  const fetchMyList = useMyListStore((s) => s.fetchMyList);

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  const load = useCallback(async () => {
    if (!universeKey) return;
    try {
      const [followedList, statusData] = await Promise.all([
        getFollowedUniverses().catch(() => []),
        getUniverseStatus(universeKey).catch(() => null),
      ]);
      const existing = followedList.find((u) => u.universe_key === universeKey);
      if (existing) {
        setUniverse(existing);
        setIsFollowing(true);
      } else {
        const detail = await getUniverseDetails(universeKey);
        setUniverse(detail);
        setIsFollowing(Boolean(statusData?.is_following));
      }
    } catch {
      setUniverse(null);
    } finally {
      setLoading(false);
    }
  }, [universeKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleModalSuccess(res: { items_added: number; ignored_count: number }) {
    toast.add({
      title: "Universo seguido!",
      description: `Você começou a acompanhar ${universe?.name || "o universo"}. ${res.items_added} obras adicionadas (${res.ignored_count} ignoradas).`,
      type: "success",
    });
    setIsFollowing(true);
    await Promise.all([load(), fetchMyList()]);
  }

  async function handleToggleAutoAdd() {
    if (!universe || busy) return;
    const currentVal = universe.auto_add !== false;
    const nextVal = !currentVal;
    try {
      await updateUniverseSettings(universe.universe_key, nextVal);
      setUniverse((prev) => (prev ? { ...prev, auto_add: nextVal } : null));
      toast.add({
        title: nextVal ? "Novos lançamentos ativados" : "Novos lançamentos pausados",
        description: nextVal
          ? "Novos lançamentos deste universo serão adicionados automaticamente à sua lista."
          : "Novos lançamentos descobertos não serão adicionados à sua lista automaticamente.",
        type: "info",
      });
    } catch (err: any) {
      toast.add({
        title: "Erro ao atualizar configuração",
        description: err.response?.data?.detail || "Falha ao alterar opção de auto-adicionar.",
        type: "error",
      });
    }
  }

  async function handleToggleIgnore(e: React.MouseEvent, item: UniverseFollowedItem) {
    e.preventDefault();
    e.stopPropagation();
    if (!universe || busy) return;
    const nextIgnored = !item.is_ignored;

    try {
      await toggleUniverseItemIgnore(universe.universe_key, item.tmdb_id, item.media_type, nextIgnored);
      setUniverse((prev) => {
        if (!prev) return null;
        const updatedItems = prev.items.map((it) =>
          it.tmdb_id === item.tmdb_id && it.media_type === item.media_type
            ? { ...it, is_ignored: nextIgnored }
            : it
        );
        const newIgnoredCount = updatedItems.filter((it) => it.is_ignored).length;
        const newActiveTotal = Math.max(0, prev.total_items - newIgnoredCount);
        const newPersonalPct =
          newActiveTotal > 0 ? Math.round((prev.watched_items / newActiveTotal) * 100) : 0;
        return {
          ...prev,
          items: updatedItems,
          ignored_items_count: newIgnoredCount,
          active_items: newActiveTotal,
          personal_completion_percentage: newPersonalPct,
        };
      });

      toast.add({
        title: nextIgnored ? "Obra ignorada" : "Obra restaurada",
        description: nextIgnored
          ? isFollowing
            ? `"${item.title}" foi ignorada e ocultada. Clique em "Ignorados" para exibi-la novamente.`
            : `"${item.title}" foi ignorada e ocultada da lista.`
          : isFollowing
          ? `"${item.title}" foi restaurada ao catálogo ativo do universo.`
          : `"${item.title}" foi restaurada e será incluída normalmente ao seguir este universo.`,
        type: "info",
      });
    } catch (err: any) {
      toast.add({
        title: "Erro ao alterar estado da obra",
        description: err.response?.data?.detail || "Não foi possível atualizar a obra.",
        type: "error",
      });
    }
  }

  async function handleSync() {
    if (!universe || busy) return;
    setBusy(true);
    try {
      await syncUniverse(universe.universe_key);
      toast.add({
        title: "Universo sincronizado!",
        description: `O catálogo de "${universe.name}" foi atualizado com sucesso.`,
        type: "success",
      });
      await Promise.all([load(), fetchMyList()]);
    } catch (err: any) {
      toast.add({
        title: "Erro ao sincronizar",
        description: err.response?.data?.detail || "Falha ao sincronizar o universo.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUnfollow() {
    if (!universe || busy) return;
    if (
      !confirm(
        `Deseja parar de monitorar o universo "${universe.name}"? Os filmes e séries já adicionados continuarão na sua lista.`
      )
    )
      return;
    setBusy(true);
    try {
      await unfollowUniverse(universe.universe_key);
      toast.add({
        title: "Universo removido",
        description: `Você deixou de seguir "${universe.name}".`,
        type: "info",
      });
      router.push("/my-list");
    } catch {
      toast.add({
        title: "Erro",
        description: "Não foi possível deixar de seguir o universo.",
        type: "error",
      });
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-8 pt-24 text-muted-foreground">Carregando universo...</div>;
  }

  if (!universe) {
    return (
      <div className="p-8 pt-24 space-y-4">
        <p className="text-muted-foreground">Universo não encontrado ou indisponível.</p>
        <Link href="/my-list" className="underline">
          Voltar para minha lista
        </Link>
      </div>
    );
  }

  const backdrop = universe.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${universe.backdrop_path}`
    : null;

  // Métricas duplas: Pessoal (itens ativos) vs Canônico (total de itens)
  const activeTotal =
    universe.active_items !== undefined
      ? universe.active_items
      : (universe.items || []).filter((it) => !it.is_ignored).length;
  const ignoredTotal =
    universe.ignored_items_count !== undefined
      ? universe.ignored_items_count
      : (universe.items || []).filter((it) => it.is_ignored).length;

  const personalPct =
    universe.personal_completion_percentage ??
    (activeTotal > 0 ? Math.min(100, Math.round((universe.watched_items / activeTotal) * 100)) : 0);
  const canonicalPct =
    universe.canonical_completion_percentage ??
    (universe.total_items > 0
      ? Math.min(100, Math.round((universe.watched_items / universe.total_items) * 100))
      : 0);

  const isPersonalCompleted = activeTotal > 0 && universe.watched_items >= activeTotal;

  const ratedItems = (universe.items || []).filter((item) => {
    const saved = listItems[item.tmdb_id];
    const r = saved?.rating ?? item.rating;
    return typeof r === "number" && r > 0;
  });
  const ratedCount = universe.rated_items_count ?? ratedItems.length;
  const averageRating =
    universe.user_average_rating !== undefined && universe.user_average_rating !== null
      ? universe.user_average_rating.toFixed(1)
      : ratedItems.length > 0
      ? (
          ratedItems.reduce((acc, item) => {
            const saved = listItems[item.tmdb_id];
            const r = saved?.rating ?? item.rating ?? 0;
            return acc + r;
          }, 0) / ratedItems.length
        ).toFixed(1)
      : null;

  const filteredItems = (universe.items || []).filter((item) => {
    if (!showIgnored && item.is_ignored) return false;
    if (typeFilter !== "all" && item.media_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (item.title || "").toLowerCase().includes(q);
      const colMatch = (item.collection_name || "").toLowerCase().includes(q);
      if (!titleMatch && !colMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-muted">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={universe.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-14 h-14 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Link
          href="/my-list"
          className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Minha lista
        </Link>
        <div className="absolute top-4 right-4 flex flex-wrap gap-2 items-center">
          {averageRating && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 shadow-md">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{averageRating}</span>
            </div>
          )}
          {isFollowing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className={`rounded-full gap-1.5 text-xs cursor-pointer backdrop-blur-md border ${
                  universe.auto_add !== false
                    ? "bg-purple-950/70 text-purple-300 border-purple-700 hover:bg-purple-900/80"
                    : "bg-background/80 text-muted-foreground border-border hover:bg-muted"
                }`}
                onClick={handleToggleAutoAdd}
                disabled={busy}
                title={
                  universe.auto_add !== false
                    ? "Novos lançamentos adicionam automaticamente (Clique para pausar)"
                    : "Novos lançamentos pausados (Clique para ativar)"
                }
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">
                  {universe.auto_add !== false ? "Auto-add ativo" : "Auto-add pausado"}
                </span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full cursor-pointer"
                onClick={handleSync}
                disabled={busy}
                title="Sincronizar novas obras do universo"
              >
                <RotateCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full cursor-pointer"
                onClick={handleUnfollow}
                disabled={busy}
                title="Deixar de seguir este universo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsFollowModalOpen(true)}
              disabled={busy}
              className="rounded-full gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm px-4 shadow-lg cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              Seguir Universo
            </Button>
          )}
        </div>

        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-600/90 text-white">
              <Globe className="w-3.5 h-3.5" /> Universo Expandido
            </span>
            {universe.movies_count > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-background/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                <Film className="w-3.5 h-3.5 text-blue-400" /> {universe.movies_count} filmes
              </span>
            )}
            {universe.tv_count > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-background/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                <Tv className="w-3.5 h-3.5 text-emerald-400" /> {universe.tv_count} séries
              </span>
            )}
            {universe.collections_count > 1 && (
              <span className="inline-flex items-center gap-1 text-xs bg-background/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> {universe.collections_count} sagas
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold drop-shadow">
            {universe.name}
          </h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 mt-6 space-y-6">
        {universe.overview && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {universe.overview}
          </p>
        )}

        {/* Métricas: Progresso Pessoal e Catálogo Canônico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card/60 border border-border/50 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">
                  Progresso Pessoal
                </span>
                <span className="font-semibold text-foreground">
                  {universe.watched_items} de {activeTotal} assistidos ({personalPct}%)
                </span>
              </div>
              <div className="w-full bg-secondary/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    isPersonalCompleted ? "bg-emerald-500" : "bg-purple-600"
                  }`}
                  style={{ width: `${personalPct}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-2">
              <span>
                Catálogo Canônico: <strong className="text-foreground">{universe.watched_items}/{universe.total_items}</strong> ({canonicalPct}%)
              </span>
              {ignoredTotal > 0 && (
                <span className="text-amber-400/90 font-medium">
                  {ignoredTotal} {ignoredTotal === 1 ? "obra ignorada" : "obras ignoradas"}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-4 border-border/40">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Sua Nota Média
              </span>
              {averageRating ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-amber-400">
                    {averageRating}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sem avaliações
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {averageRating
                ? `${ratedCount} de ${activeTotal} obras ativas avaliadas neste universo`
                : "Atribua notas aos filmes e séries assistidos para calcular sua média."}
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 mr-2">
                Obras do Universo
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {filteredItems.length}
                  {searchQuery.trim() || typeFilter !== "all" || !showIgnored
                    ? ` de ${universe.items.length}`
                    : ""}
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-1.5">
                {universe.movies_count > 0 && universe.tv_count > 0 && (
                  <>
                    <Button
                      variant={typeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-full cursor-pointer"
                      onClick={() => setTypeFilter("all")}
                    >
                      Todos ({showIgnored ? universe.items.length : activeTotal})
                    </Button>
                    <Button
                      variant={typeFilter === "movie" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-full gap-1 cursor-pointer"
                      onClick={() => setTypeFilter("movie")}
                    >
                      <Film className="w-3 h-3" /> Filmes ({universe.movies_count})
                    </Button>
                    <Button
                      variant={typeFilter === "tv" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-full gap-1 cursor-pointer"
                      onClick={() => setTypeFilter("tv")}
                    >
                      <Tv className="w-3 h-3" /> Séries ({universe.tv_count})
                    </Button>
                  </>
                )}

                {ignoredTotal > 0 && (
                  <Button
                    variant={showIgnored ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs rounded-full gap-1.5 cursor-pointer ${
                      showIgnored
                        ? "bg-purple-950/60 text-purple-300 border border-purple-700/60 hover:bg-purple-900/60"
                        : "text-muted-foreground hover:text-foreground border border-border/40"
                    }`}
                    onClick={() => setShowIgnored((v) => !v)}
                    title={showIgnored ? "Ocultar obras ignoradas" : "Exibir obras ignoradas"}
                  >
                    {showIgnored ? (
                      <>
                        <Eye className="w-3 h-3 text-purple-400" /> Ocultar Ignorados ({ignoredTotal})
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-muted-foreground" /> Ignorados ({ignoredTotal})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {universe.items && universe.items.length > 2 && (
              <div className="w-full sm:w-72">
                <FilterSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar obra ou saga no universo..."
                  size="sm"
                  showCount={Boolean(searchQuery.trim())}
                  resultCount={filteredItems.length}
                  totalCount={universe.items.length}
                />
              </div>
            )}
          </div>

          {!isFollowing && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>
                  Você pode <strong>ignorar filmes ou séries indesejados</strong> antes de seguir o universo. Clique no ícone de olho cortado (<EyeOff className="inline w-3 h-3 text-slate-400 mx-0.5" />) nos cards abaixo ou desmarque-os ao clicar em Seguir.
                </span>
              </div>
              {ignoredTotal > 0 && (
                <button
                  type="button"
                  onClick={() => setShowIgnored((v) => !v)}
                  className="font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/60 px-2.5 py-1 rounded-full whitespace-nowrap self-start sm:self-auto cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {showIgnored ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {showIgnored ? "Ocultar" : "Exibir"} {ignoredTotal} {ignoredTotal === 1 ? "obra ignorada" : "obras ignoradas"}
                </button>
              )}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-card/30 border border-border/40 rounded-xl p-6">
              <p className="text-muted-foreground mb-3 text-sm">
                Nenhuma obra encontrada para os filtros selecionados.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  className="cursor-pointer"
                >
                  Limpar Filtros
                </Button>
                {!showIgnored && ignoredTotal > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowIgnored(true)}
                    className="cursor-pointer gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Exibir {ignoredTotal} {ignoredTotal === 1 ? "obra ignorada" : "obras ignoradas"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item, idx) => {
                const saved = listItems[item.tmdb_id];
                const status = saved?.status ?? item.status;
                const rating = saved?.rating ?? item.rating;
                const href =
                  item.media_type === "tv"
                    ? `/tv/${item.tmdb_id}`
                    : `/movie/${item.tmdb_id}`;

                return (
                  <div
                    key={`${item.media_type}-${item.tmdb_id}-${idx}`}
                    className={`group relative rounded-xl p-1 transition-all ${
                      item.is_ignored
                        ? "opacity-60 border border-dashed border-slate-700/80 bg-slate-900/30 hover:opacity-100"
                        : ""
                    }`}
                  >
                    <Link href={href} className="block">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                        {item.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}

                        {/* Badges superiores esquerdos: Tipo e Recap */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-black/75 text-white backdrop-blur-sm px-2 py-0.5 rounded-full">
                            {item.media_type === "tv" ? (
                              <>
                                <Tv className="w-2.5 h-2.5 text-emerald-400" /> Série
                              </>
                            ) : (
                              <>
                                <Film className="w-2.5 h-2.5 text-blue-400" /> Filme
                              </>
                            )}
                          </span>
                          {item.is_recap && (
                            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-700/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
                              Recap
                            </span>
                          )}
                        </div>

                        {/* Badge de Ignorado ou Status */}
                        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                          {item.is_ignored ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-950/90 text-slate-300 border border-slate-700 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-md">
                              <Ban className="w-3 h-3 text-slate-400" /> Ignorado
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                              {(status && STATUS_LABEL[status]) || "Não na lista"}
                            </span>
                          )}
                        </div>
                      </div>

                      <p
                        className={`mt-2 text-sm font-medium truncate group-hover:underline ${
                          item.is_ignored ? "text-muted-foreground line-through decoration-slate-600" : ""
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.release_date && (
                          <span>{item.release_date.split("-")[0]}</span>
                        )}
                        {item.collection_name && (
                          <span className="text-[11px] text-purple-400 truncate">
                            • {item.collection_name}
                          </span>
                        )}
                        {rating ? (
                          <span className="flex items-center text-yellow-500">
                            <Star className="w-3 h-3 fill-yellow-500 mr-0.5" />
                            {rating}
                          </span>
                        ) : null}
                      </div>
                    </Link>

                    {/* Botões de Ação */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                      <AddToListButton
                        tmdb_id={item.tmdb_id}
                        media_type={item.media_type === "tv" ? "tv" : "movie"}
                        title={item.title}
                        poster_path={item.poster_path}
                        backdrop_path={item.backdrop_path}
                        release_date={item.release_date}
                        className="h-8 w-8"
                      />
                      <FavoriteButton tmdb_id={item.tmdb_id} size="sm" />
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => handleToggleIgnore(e, item)}
                        className={`h-8 w-8 rounded-full cursor-pointer backdrop-blur-md border shadow-sm ${
                          item.is_ignored
                            ? "bg-purple-950/80 text-purple-300 border-purple-800 hover:bg-purple-900"
                            : "bg-background/80 text-muted-foreground hover:text-foreground border-border hover:bg-background"
                        }`}
                        title={
                          item.is_ignored
                            ? isFollowing
                              ? "Restaurar obra ao progresso deste universo"
                              : "Restaurar obra (será adicionada ao seguir o universo)"
                            : isFollowing
                            ? "Ignorar obra neste universo (não afetará o progresso)"
                            : "Ignorar obra (não será adicionada à sua lista ao seguir o universo)"
                        }
                      >
                        {item.is_ignored ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de seleção granular ao seguir o universo */}
      <UniverseFollowModal
        isOpen={isFollowModalOpen}
        universeKey={universe.universe_key}
        universeName={universe.name}
        initialDetails={universe}
        onClose={() => setIsFollowModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
