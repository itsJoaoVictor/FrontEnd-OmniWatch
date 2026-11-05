"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Activity,
  Star,
  Film,
  Tv,
  Filter,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  EyeOff,
  Bookmark,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const STORAGE_KEY = "omniwatch_together_session_state";

interface SavedTogetherState {
  selectedFriendId: string;
  friendName: string;
  unseenMode: "one" | "both";
  mediaType: "all" | "movie" | "tv";
  genreId: number | null;
  minVoteAverage: number | null;
  items: TogetherRecommendationItem[];
  hasGenerated: boolean;
  scrollY?: number;
}

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
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  const saveScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.scrollY = window.scrollY;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 1. Restauração SÍNCRONA e IMEDIATA da sessão (0 delay ao voltar de /movie/[id] ou /tv/[id])
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedTogetherState = JSON.parse(raw);
        if (saved.selectedFriendId) {
          setSelectedFriendId(saved.selectedFriendId);
          if (saved.friendName) setFriendName(saved.friendName);
          if (saved.unseenMode) setUnseenMode(saved.unseenMode);
          if (saved.mediaType) setMediaType(saved.mediaType);
          if (saved.genreId !== undefined) setGenreId(saved.genreId);
          if (saved.minVoteAverage !== undefined) setMinVoteAverage(saved.minVoteAverage);
          if (Array.isArray(saved.items) && saved.items.length > 0) {
            setItems(saved.items);
            setHasGenerated(true);
          }
          if (saved.scrollY && saved.scrollY > 0) {
            setTimeout(() => {
              window.scrollTo({ top: saved.scrollY, behavior: "instant" });
            }, 60);
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao restaurar do sessionStorage:", e);
    }
  }, []);

  // 2. Carrega lista de amigos e complementa seleção se necessário
  useEffect(() => {
    async function loadFriends() {
      try {
        setIsLoadingFriends(true);
        const list = await friendsService.getFriends();
        setFriends(list);

        setSelectedFriendId((curr) => {
          if (curr && list.some((f) => f.id === curr)) {
            const found = list.find((f) => f.id === curr);
            if (found) setFriendName(found.name);
            return curr;
          }
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const friendParam = params.get("friend");
            if (friendParam && list.some((f) => f.id === friendParam)) {
              const found = list.find((f) => f.id === friendParam);
              if (found) setFriendName(found.name);
              return friendParam;
            }
          }
          if (list.length > 0) {
            setFriendName(list[0].name);
            return list[0].id;
          }
          return "";
        });
      } catch (err) {
        console.error("Erro ao carregar lista de amigos:", err);
      } finally {
        setIsLoadingFriends(false);
      }
    }
    loadFriends();
  }, []);

  const syncStateToStorageAndUrl = (
    updatedFriendId = selectedFriendId,
    updatedFriendName = friendName,
    updatedItems = items,
    updatedHasGen = hasGenerated
  ) => {
    if (typeof window === "undefined") return;
    try {
      const stateToSave: SavedTogetherState = {
        selectedFriendId: updatedFriendId,
        friendName: updatedFriendName,
        unseenMode,
        mediaType,
        genreId,
        minVoteAverage,
        items: updatedItems,
        hasGenerated: updatedHasGen,
        scrollY: window.scrollY,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

      const params = new URLSearchParams();
      if (updatedFriendId) params.set("friend", updatedFriendId);
      if (unseenMode !== "one") params.set("unseen", unseenMode);
      if (mediaType !== "all") params.set("type", mediaType);
      if (genreId) params.set("genre", String(genreId));
      if (minVoteAverage) params.set("minVote", String(minVoteAverage));

      const queryStr = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${queryStr ? `?${queryStr}` : ""}`);
    } catch (e) {
      // ignore
    }
  };

  const handleFriendChange = (friendId: string) => {
    setSelectedFriendId(friendId);
    const friend = friends.find((f) => f.id === friendId);
    const newName = friend ? friend.name : "";
    if (friend) {
      setFriendName(newName);
    }
    syncStateToStorageAndUrl(friendId, newName);
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

      const newItems = res.items || [];
      const newFriendName = res.friend?.name || friendName;
      setItems(newItems);
      if (res.friend?.name) {
        setFriendName(res.friend.name);
      }
      setHasGenerated(true);

      syncStateToStorageAndUrl(selectedFriendId, newFriendName, newItems, true);
    } catch (err: any) {
      console.error("Erro ao gerar recomendações:", err);
      setErrorMsg(err.response?.data?.detail || "Não foi possível carregar as recomendações em dupla.");
    } finally {
      setIsLoadingRecs(false);
    }
  };

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
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== item.id);
        if (typeof window !== "undefined") {
          try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed: SavedTogetherState = JSON.parse(raw);
              parsed.items = next;
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
          } catch (e) {}
        }
        return next;
      });
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 350);
  };

  // Separação em O Santo Graal (#1) + Trilhos Temáticos
  const leadItem = items.length > 0 ? items[0] : null;
  const restItems = items.slice(1);

  // Categorização dos trilhos temáticos
  const watchlistRail = restItems.filter((i) => i.in_both_watchlists);
  const bridgeRail = restItems.filter(
    (i) => !i.in_both_watchlists && (i.watched_by_user || i.watched_by_friend)
  );
  const consensusRail = restItems.filter(
    (i) => !i.in_both_watchlists && !i.watched_by_user && !i.watched_by_friend
  );

  const friendFirstName = friendName ? friendName.split(" ")[0] : "Amigo";

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
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2.5">
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
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
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
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
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
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
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
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
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
                  "py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
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
                className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
            className="w-full sm:w-auto font-semibold gap-2 shadow-md px-6 cursor-pointer"
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
          <div className="aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
      ) : leadItem ? (
        <div className="space-y-10">
          {/* Header da Seção de Resultados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 text-foreground">
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

          {/* =================================================================
              #1 SUPER CONSENSO (O SANTO GRAAL DA DUPLA - VITRINE 16:9 WIDESCREEN)
             ================================================================= */}
          {(() => {
            const leadTitle = leadItem.title || leadItem.name || "Obra Principal";
            const leadMediaType = (leadItem.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
            const leadRoute = `/${leadMediaType}/${leadItem.id}`;
            const isLeadHiding = hiddenIds.has(leadItem.id);

            return (
              <article
                className={cn(
                  "relative rounded-2xl md:rounded-3xl overflow-hidden border border-primary/40 bg-zinc-950 shadow-xl min-h-[380px] md:min-h-[420px] flex items-end group transition-all duration-300",
                  isLeadHiding && "opacity-0 scale-95 pointer-events-none"
                )}
              >
                {/* Backdrop 16:9 com Zoom Suave */}
                {leadItem.backdrop_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280${leadItem.backdrop_path}`}
                    alt={leadTitle}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-primary/20 to-zinc-950" />
                )}

                {/* Scrim e Vinheta Cinematográfica */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-1" />
                <div className="absolute inset-0 bg-radial-[at_top_right] from-primary/20 via-transparent to-transparent z-1" />

                {/* Conteúdo do Lead */}
                <div className="relative z-10 p-5 sm:p-8 max-w-3xl space-y-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black tracking-wide shadow-sm">
                      <Crown className="w-3.5 h-3.5 fill-amber-400" />
                      #1 MÁXIMO CONSENSO DA DUPLA
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-black shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      {Math.round(leadItem.match_score)}% Match
                    </span>
                    {leadItem.in_both_watchlists && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 text-[10px] font-black border border-amber-300">
                        <Bookmark className="w-3 h-3 fill-zinc-950" />
                        No Quero Ver de Ambos
                      </span>
                    )}
                    {leadItem.watched_by_user && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Você viu
                      </span>
                    )}
                    {leadItem.watched_by_friend && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-600/90 text-white text-[10px] font-bold">
                        <UserCheck className="w-3 h-3" />
                        {friendFirstName} viu
                      </span>
                    )}
                    {leadItem.vote_average > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30 text-xs font-extrabold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {(leadItem.vote_average / 2).toFixed(1)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                      {leadMediaType === "movie" ? "Filme" : "Série"}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                    <Link
                      href={leadRoute}
                      onClick={saveScrollPosition}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      {leadTitle}
                    </Link>
                  </h2>

                  {/* Comparativo Você vs Amigo */}
                  <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-zinc-200 flex-wrap">
                    <span className="text-sky-400 font-bold">
                      Você: <strong>{Math.round(leadItem.user_score ?? 0)}%</strong>
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-pink-400 font-bold">
                      {friendFirstName}: <strong>{Math.round(leadItem.friend_score ?? 0)}%</strong>
                    </span>
                    {leadItem.match_tags && leadItem.match_tags.length > 0 && (
                      <>
                        <span className="text-zinc-600">|</span>
                        <span className="text-amber-300 font-medium truncate max-w-xs">
                          💡 {leadItem.match_tags[0]}
                        </span>
                      </>
                    )}
                  </div>

                  {leadItem.overview && (
                    <p className="text-xs md:text-sm text-zinc-300 line-clamp-2 leading-relaxed max-w-2xl">
                      {leadItem.overview}
                    </p>
                  )}

                  {/* Botões de Ação */}
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    <AddToListButton
                      tmdb_id={leadItem.id}
                      media_type={leadMediaType}
                      title={leadTitle}
                      poster_path={leadItem.poster_path}
                      backdrop_path={leadItem.backdrop_path}
                      release_date={leadItem.release_date || leadItem.first_air_date}
                    />
                    <Link href={leadRoute} onClick={saveScrollPosition}>
                      <Button className="font-bold gap-2 text-xs md:text-sm shadow-md cursor-pointer">
                        <span>Ver Detalhes da Obra</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDismiss(leadItem)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-700/60 text-xs font-semibold transition-colors cursor-pointer"
                      title="Dispensar recomendação por 6 meses"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="hidden sm:inline">Dispensar</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })()}

          {/* =================================================================
              TRILHOS TEMÁTICOS DA DUPLA
             ================================================================= */}
          <div className="space-y-10">
            {/* Trilho 1: No Quero Ver dos Dois */}
            {watchlistRail.length > 0 && (
              <TogetherRail
                title="No Quero Ver dos Dois"
                subtitle="Obras que vocês dois já haviam adicionado à lista individualmente"
                badge="⭐ Quero Ver Mútuo"
                icon={Bookmark}
                items={watchlistRail}
                friendName={friendName}
                hiddenIds={hiddenIds}
                saveScrollPosition={saveScrollPosition}
                handleDismiss={handleDismiss}
              />
            )}

            {/* Trilho 2: Ponte de Descoberta (Um já viu, ótimo para indicar) */}
            {bridgeRail.length > 0 && (
              <TogetherRail
                title="Ponte de Descoberta"
                subtitle="Obras altamente recomendadas que um de vocês já amou e o outro ainda não viu"
                badge="🌉 Indicação Mútua"
                icon={CheckCircle2}
                items={bridgeRail}
                friendName={friendName}
                hiddenIds={hiddenIds}
                saveScrollPosition={saveScrollPosition}
                handleDismiss={handleDismiss}
              />
            )}

            {/* Trilho 3: Top Consenso & Afinidade Geral */}
            <TogetherRail
              title={
                watchlistRail.length > 0 || bridgeRail.length > 0
                  ? "Top Consenso & Afinidade"
                  : "Todas as Recomendações em Alta Sintonia"
              }
              subtitle="Ordenadas pelo maior alinhamento de gostos entre os dois perfis"
              badge="⚡ Alta Compatibilidade"
              icon={Sparkles}
              items={
                watchlistRail.length > 0 || bridgeRail.length > 0
                  ? consensusRail
                  : restItems
              }
              friendName={friendName}
              hiddenIds={hiddenIds}
              saveScrollPosition={saveScrollPosition}
              handleDismiss={handleDismiss}
            />
          </div>
        </div>
      ) : (
        /* Callout Inicial antes de Gerar */
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
            className="font-semibold gap-2 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Gerar Recomendações
          </Button>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENTE: TRILHO PANORÂMICO COM SCROLL SUAVE E SNAP TOUCH
   ========================================================================== */
function TogetherRail({
  title,
  subtitle,
  badge,
  icon: Icon,
  items,
  friendName,
  hiddenIds,
  saveScrollPosition,
  handleDismiss,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  icon: any;
  items: TogetherRecommendationItem[];
  friendName: string;
  hiddenIds: Set<number>;
  saveScrollPosition: () => void;
  handleDismiss: (item: TogetherRecommendationItem) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollTrack = (direction: -1 | 1) => {
    if (!trackRef.current) return;
    const step = Math.max(260, Math.round(trackRef.current.clientWidth * 0.72));
    trackRef.current.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header do Trilho com Controles Direcionais */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-primary/15 text-primary border border-primary/25">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-bold text-foreground">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {badge}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-normal">
                ({items.length})
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack(-1)}
            className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack(1)}
            className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trilho Horizontal */}
      <div
        ref={trackRef}
        className="flex items-stretch overflow-x-auto scroll-smooth snap-x snap-mandatory gap-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 hide-scrollbar cursor-grab active:cursor-grabbing"
      >
        {items.map((item) => {
          const displayTitle = item.title || item.name || "Obra";
          const mediaType = (item.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
          const route = `/${mediaType}/${item.id}`;
          const isHiding = hiddenIds.has(item.id);
          const rawDate = item.release_date || item.first_air_date || "";
          const year = rawDate.length >= 4 ? rawDate.slice(0, 4) : "";

          return (
            <article
              key={`${mediaType}-${item.id}`}
              className={cn(
                "flex-[0_0_52%] sm:flex-[0_0_190px] md:flex-[0_0_210px] snap-start rounded-xl border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group",
                item.in_both_watchlists
                  ? "border-amber-500/70 shadow-amber-500/10 ring-1 ring-amber-500/40"
                  : "border-border/80",
                isHiding && "opacity-0 scale-90 pointer-events-none"
              )}
            >
              <Link
                href={route}
                prefetch={false}
                onClick={saveScrollPosition}
                className="block aspect-[2/3] relative w-full overflow-hidden bg-muted cursor-pointer"
              >
                <PosterImage
                  src={item.poster_path}
                  fallbackSrc={item.backdrop_path}
                  alt={displayTitle}
                  title={displayTitle}
                  type={mediaType}
                  fill
                  className="transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 52vw, 210px"
                />

                {/* Badges no Topo */}
                <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 items-start">
                  <div className="bg-primary/95 text-primary-foreground text-[10.5px] font-black px-1.5 py-0.5 rounded-md flex items-center shadow-md">
                    <Activity className="w-2.5 h-2.5 mr-1" />
                    {Math.round(item.match_score)}%
                  </div>

                  {item.in_both_watchlists && (
                    <div className="bg-amber-400 text-zinc-950 text-[8.5px] font-black px-1 py-0.5 rounded shadow flex items-center gap-0.5 border border-amber-300">
                      <Bookmark className="w-2 h-2 fill-zinc-950" />
                      <span>Quero Ver</span>
                    </div>
                  )}

                  {item.watched_by_user && (
                    <div className="bg-emerald-600/90 text-white text-[8.5px] font-bold px-1 py-0.5 rounded shadow flex items-center gap-0.5">
                      <CheckCircle2 className="w-2 h-2" />
                      <span>Você viu</span>
                    </div>
                  )}
                  {item.watched_by_friend && (
                    <div className="bg-sky-600/90 text-white text-[8.5px] font-bold px-1 py-0.5 rounded shadow flex items-center gap-0.5">
                      <UserCheck className="w-2 h-2" />
                      <span>{friendName.split(" ")[0]} viu</span>
                    </div>
                  )}
                </div>

                {/* Badges na Base: Tipo e Nota 5 Estrelas */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between pointer-events-none">
                  <span className="px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold rounded uppercase">
                    {mediaType === "movie" ? "Filme" : "Série"}
                  </span>
                  {item.vote_average > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-amber-300 border border-amber-300/30 text-[10px] font-bold rounded">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {(item.vote_average / 2).toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>

              {/* Informações e Breakdown */}
              <div className="p-2.5 flex flex-col justify-between flex-1 gap-2 bg-card">
                <div>
                  <Link
                    href={route}
                    prefetch={false}
                    onClick={saveScrollPosition}
                    className="font-extrabold text-xs sm:text-sm line-clamp-1 hover:text-primary transition-colors text-foreground cursor-pointer"
                    title={displayTitle}
                  >
                    {displayTitle}
                  </Link>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {year && <span>{year}</span>}
                  </div>

                  {/* Comparativo Você vs Amigo */}
                  <div className="flex items-center justify-between text-[9.5px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                    <span>
                      Você: <strong className="text-foreground">{Math.round(item.user_score ?? 0)}%</strong>
                    </span>
                    <span>
                      {friendName.split(" ")[0]}: <strong className="text-foreground">{Math.round(item.friend_score ?? 0)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Ações: Adicionar à Lista + Dispensar */}
                <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleDismiss(item)}
                    className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-secondary transition-colors cursor-pointer"
                    title="Não tenho interesse"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                  <AddToListButton
                    tmdb_id={item.id}
                    media_type={mediaType}
                    title={displayTitle}
                    poster_path={item.poster_path}
                    backdrop_path={item.backdrop_path}
                    release_date={item.release_date || item.first_air_date}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
