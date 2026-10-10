"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  ArrowLeft,
  Activity,
  Star,
  Film,
  Tv,
  Filter,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Search,
  MoreVertical,
  EyeOff,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/axios";
import { friendsService } from "@/services/friendsService";
import { FriendUser } from "@/types/friends";
import { getTogetherRecommendations } from "@/services/recommendationService";
import { TogetherRecommendationItem } from "@/types/recommendation";
import { PosterImage } from "@/components/shared/PosterImage";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const POPULAR_GENRES = [
  { id: 28, name: "Ação" },
  { id: 12, name: "Aventura" },
  { id: 16, name: "Animação" },
  { id: 35, name: "Comédia" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentário" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasia" },
  { id: 27, name: "Terror" },
  { id: 9648, name: "Mistério" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ficção Científica" },
  { id: 53, name: "Thriller" },
];

export default function TogetherPage() {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");

  // Filters
  const [unseenMode, setUnseenMode] = useState<"one" | "both">("one");
  const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all");
  const [genreId, setGenreId] = useState<number | null>(null);
  const [minVoteAverage, setMinVoteAverage] = useState<number | null>(null);

  // Results
  const [items, setItems] = useState<TogetherRecommendationItem[]>([]);
  const [friendName, setFriendName] = useState<string>("");
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadFriends() {
      try {
        setIsLoadingFriends(true);
        const list = await friendsService.getFriends();
        setFriends(list);
        if (list.length > 0) {
          setSelectedFriendId(list[0].id);
          setFriendName(list[0].name);
        }
      } catch (err) {
        console.error("Erro ao carregar lista de amigos:", err);
      } finally {
        setIsLoadingFriends(false);
      }
    }
    loadFriends();
  }, []);

  const handleFriendChange = (friendId: string) => {
    setSelectedFriendId(friendId);
    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setFriendName(friend.name);
    }
  };

  const handleFetchRecommendations = async () => {
    if (!selectedFriendId) return;

    try {
      setIsLoadingRecs(true);
      setErrorMsg(null);
      const res = await getTogetherRecommendations({
        friend_id: selectedFriendId,
        unseen_mode: unseenMode,
        media_type: mediaType,
        genre_id: genreId,
        min_vote_average: minVoteAverage,
        limit: 40,
      });

      setItems(res.items || []);
      if (res.friend?.name) {
        setFriendName(res.friend.name);
      }
      setHasGenerated(true);
    } catch (err: any) {
      console.error("Erro ao gerar recomendações:", err);
      setErrorMsg(err.response?.data?.detail || "Não foi possível carregar as recomendações em dupla.");
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  const handleDismiss = async (item: TogetherRecommendationItem) => {
    const displayTitle = item.title || item.name || "Obra";

    // Efeito visual de fade-out
    setHiddenIds((prev) => new Set(prev).add(item.id));

    try {
      await api.post("/api/recommendations/dismiss", {
        tmdb_id: item.id,
        media_type: item.media_type,
        title: displayTitle,
        poster_path: item.poster_path,
        days_snooze: 180,
      });

      toast.add({
        title: "Recomendação dispensada",
        description: `"${displayTitle}" foi ocultada das suas recomendações por 6 meses.`,
        type: "info",
      });
    } catch (err) {
      console.error("Erro ao dispensar recomendação:", err);
    }

    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 350);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Navigation */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Explorar
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
              <span>Assistir Juntos</span>
              <span className="p-1 rounded-lg bg-primary/20 text-primary border border-primary/30">
                <Users className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1.5">
              Sintonize o gosto de dois perfis e descubra filmes e séries com o melhor Match Duplo.
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Friend Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Amigo
            </label>
            {isLoadingFriends ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : friends.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 rounded-md bg-muted/40 border border-border">
                Nenhum amigo adicionado ainda.{" "}
                <Link href="/friends" className="text-primary underline font-medium">
                  Adicione amigos aqui
                </Link>
              </div>
            ) : (
              <select
                value={selectedFriendId}
                onChange={(e) => handleFriendChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.username ? `(@${f.username})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Unseen Mode Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Filtro de Ineditismo
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg border border-border bg-muted/30">
              <button
                type="button"
                onClick={() => setUnseenMode("one")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center",
                  unseenMode === "one"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Exclui apenas se ambos já assistiram"
              >
                Inédito p/ 1 (Padrão)
              </button>
              <button
                type="button"
                onClick={() => setUnseenMode("both")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center",
                  unseenMode === "both"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Exclui se qualquer um dos dois já tiver assistido"
              >
                Inédito p/ Ambos
              </button>
            </div>
          </div>

          {/* Media Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-primary" />
              Formato
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-border bg-muted/30">
              <button
                type="button"
                onClick={() => setMediaType("all")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center",
                  mediaType === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setMediaType("movie")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center",
                  mediaType === "movie"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Filmes
              </button>
              <button
                type="button"
                onClick={() => setMediaType("tv")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center",
                  mediaType === "tv"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Séries
              </button>
            </div>
          </div>

          {/* Extra Filters (Genre + Min Vote) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Refinamentos
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={genreId ?? ""}
                onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Gênero: Todos</option>
                {POPULAR_GENRES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                value={minVoteAverage ?? ""}
                onChange={(e) => setMinVoteAverage(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Avaliação: Todas</option>
                <option value="6.0">★ 3.0+ Estrelas</option>
                <option value="7.0">★ 3.5+ Estrelas</option>
                <option value="8.0">★ 4.0+ Estrelas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            {unseenMode === "one"
              ? "✨ Modo Inédito para 1: inclui obras que apenas um já viu (ótimo para indicar um favorito ao amigo)."
              : "🔒 Modo Inédito para Ambos: apenas obras que nenhum dos dois assistiu ainda."}
          </p>

          <Button
            onClick={handleFetchRecommendations}
            disabled={isLoadingRecs || !selectedFriendId || friends.length === 0}
            className="w-full sm:w-auto font-semibold gap-2 shadow-md px-6"
          >
            {isLoadingRecs ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Combinando gostos...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{hasGenerated ? "Recalcular Recomendações" : "Gerar Recomendações"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive text-sm text-center">
          {errorMsg}
        </div>
      )}

      {/* Results Section */}
      {isLoadingRecs ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Cruzando catálogos e calculando afinidades em dupla...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden border border-border">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      ) : hasGenerated && items.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/30">
          <Film className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Nenhuma obra encontrada</h3>
          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto mt-1">
            Não encontramos sugestões com esses filtros específicos. Tente relaxar o filtro de gênero ou a nota mínima TMDB.
          </p>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>Recomendações para Você e {friendName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({items.length} obras com melhor afinidade)
                </span>
              </h2>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Ordenado pelo maior consenso mútuo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
            {items.map((item) => {
              const displayTitle = item.title || item.name || "Obra";
              const isHiding = hiddenIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative flex flex-col rounded-xl overflow-hidden border bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md",
                    item.in_both_watchlists ? "border-amber-500/70 shadow-amber-500/10 ring-1 ring-amber-500/40" : "border-border/80",
                    isHiding && "opacity-0 scale-90 pointer-events-none"
                  )}
                >
                  <Link
                    href={`/${item.media_type === "movie" ? "movie" : "tv"}/${item.id}`}
                    className="block aspect-[2/3] relative w-full overflow-hidden bg-muted"
                  >
                    <PosterImage
                      src={item.poster_path}
                      fallbackSrc={item.backdrop_path}
                      alt={displayTitle}
                      title={displayTitle}
                      type={item.media_type}
                      fill
                      className="transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />

                    {/* Match Score Badge (Top-Left) */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                      <div className="bg-primary/95 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-md flex items-center shadow-md">
                        <Activity className="w-3 h-3 mr-1" />
                        {Math.round(item.match_score)}%
                      </div>

                      {/* Destaque se estiver no Quero Ver de ambos */}
                      {item.in_both_watchlists && (
                        <div className="bg-amber-400 text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 border border-amber-300">
                          <Bookmark className="w-2.5 h-2.5 fill-zinc-950" />
                          <span>No Quero Ver de ambos</span>
                        </div>
                      )}

                      {/* Watched tags for unseen_mode = 'one' */}
                      {item.watched_by_user && (
                        <div className="bg-emerald-600/90 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Você viu</span>
                        </div>
                      )}
                      {item.watched_by_friend && (
                        <div className="bg-sky-600/90 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>{friendName.split(" ")[0]} viu</span>
                        </div>
                      )}
                    </div>

                    {/* Top Right: Add to list button + Menu de Opções */}
                    <div
                      className="absolute top-2 right-2 z-30 flex items-center gap-1.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <AddToListButton
                        tmdb_id={item.id}
                        media_type={item.media_type as "movie" | "tv"}
                        title={displayTitle}
                        poster_path={item.poster_path}
                        backdrop_path={item.backdrop_path}
                        release_date={item.release_date}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition-colors shadow-md outline-none"
                          title="Mais opções"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-zinc-300 hover:text-white" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-zinc-950/95 border-zinc-800 text-white backdrop-blur-md shadow-xl p-1 rounded-lg"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDismiss(item);
                            }}
                            className="cursor-pointer text-xs text-zinc-200 hover:text-red-400 focus:text-red-400 flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition-colors"
                          >
                            <EyeOff className="w-4 h-4 text-zinc-400" />
                            <span>Não tenho interesse</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Format pill & 5-Star Rating in bottom-left */}
                    <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
                      <span className="inline-block px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-white text-[9px] font-semibold rounded uppercase tracking-wider">
                        {item.media_type === "movie" ? "Filme" : "Série"}
                      </span>
                      {item.vote_average > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-amber-300 text-[9px] font-semibold rounded">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {(item.vote_average / 2).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Card Content & Score Breakdown */}
                  <div className="p-2.5 md:p-3 flex flex-col justify-between flex-1 gap-2 bg-card">
                    <div>
                      <Link
                        href={`/${item.media_type === "movie" ? "movie" : "tv"}/${item.id}`}
                        className="font-bold text-xs md:text-sm line-clamp-1 hover:text-primary transition-colors text-foreground"
                        title={displayTitle}
                      >
                        {displayTitle}
                      </Link>

                      {/* Score Breakdown (Você vs Amigo) */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                        <span>Você: <strong className="text-foreground">{Math.round(item.user_score ?? 0)}%</strong></span>
                        <span>{friendName.split(" ")[0]}: <strong className="text-foreground">{Math.round(item.friend_score ?? 0)}%</strong></span>
                      </div>
                    </div>

                    {/* Shared Tags / Reason */}
                    {item.match_tags && item.match_tags.length > 0 && (
                      <div className="mt-auto">
                        <span className="text-[10px] font-medium text-amber-400/90 line-clamp-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {item.match_tags[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Initial Callout before generating */
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/20">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Pronto para a sessão em dupla?</h3>
          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-5">
            Selecione seu amigo acima, ajuste os filtros desejados e clique em <strong>Gerar Recomendações</strong> para ver a mágica do Match Duplo.
          </p>
          <Button
            onClick={handleFetchRecommendations}
            disabled={isLoadingRecs || !selectedFriendId || friends.length === 0}
            className="font-semibold gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Gerar Recomendações
          </Button>
        </div>
      )}
    </div>
  );
}
