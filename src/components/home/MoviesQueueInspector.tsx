"use client";

import {
  memo,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dices,
  Film,
  Heart,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Star,
  Tv2,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { PosterImage, buildTmdbUrl } from "@/components/shared/PosterImage";
import { useMyListStore } from "@/store/useMyListStore";
import { MovieDetailsResponse, WatchProviderItem } from "@/types/details";
import { MediaItem } from "./MediaCard";
import { ContentCarousel } from "./ContentCarousel";

interface MoviesQueueInspectorProps {
  items: MediaItem[];
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
}

interface CachedMovieMeta {
  runtimeText: string | null;
  voteAverage: number | null;
  genres: string[];
  overview: string | null;
  tagline: string | null;
  providers: WatchProviderItem[];
  backdropUrl: string | null;
}

// Cache em memória + deduplicação de requests para inspeção instantânea sem N+1
const movieMetaCache = new Map<number, CachedMovieMeta>();
const inFlightMovieMeta = new Map<number, Promise<CachedMovieMeta | null>>();

function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

async function fetchMovieInspectorMeta(tmdbId: number): Promise<CachedMovieMeta | null> {
  if (movieMetaCache.has(tmdbId)) {
    return movieMetaCache.get(tmdbId)!;
  }
  const existing = inFlightMovieMeta.get(tmdbId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await api.get<MovieDetailsResponse>(`/api/movies/${tmdbId}`);
      const data = res.data;
      if (!data) return null;

      const meta: CachedMovieMeta = {
        runtimeText: formatRuntime(data.runtime),
        voteAverage:
          typeof data.vote_average === "number" && data.vote_average > 0
            ? Number(data.vote_average.toFixed(1))
            : null,
        genres: Array.isArray(data.genres)
          ? data.genres.slice(0, 3).map((g) => g.name)
          : [],
        overview: data.overview?.trim() || null,
        tagline: data.tagline?.trim() || null,
        providers: Array.isArray(data.watch_providers)
          ? data.watch_providers.slice(0, 3)
          : [],
        backdropUrl: data.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
          : null,
      };
      movieMetaCache.set(tmdbId, meta);
      return meta;
    } catch {
      return null;
    } finally {
      inFlightMovieMeta.delete(tmdbId);
    }
  })();

  inFlightMovieMeta.set(tmdbId, promise);
  return promise;
}

const PAGE_SIZE = 8; // 2 fileiras de 4 pôsteres no seletor lateral

export const MoviesQueueInspector = memo(function MoviesQueueInspector({
  items,
  title = "Filmes na Fila",
  subtitle = "Inspecione detalhes rápidos ou sorteie sua sessão de hoje em 1 clique",
  actionHref = "/my-list",
  actionText = "Ver filmes",
}: MoviesQueueInspectorProps) {
  const storeItems = useMyListStore((state) => state.items);
  const updateStatus = useMyListStore((state) => state.updateStatus);
  const toggleFavorite = useMyListStore((state) => state.toggleFavorite);

  const [viewMode, setViewMode] = useState<"inspector" | "carousel">("inspector");
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [wasShuffled, setWasShuffled] = useState(false);
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(false);
  const [metaTick, setMetaTick] = useState(0);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [markingWatchedId, setMarkingWatchedId] = useState<number | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<number | null>(null);
  const [lastCompletedUndo, setLastCompletedUndo] = useState<{
    tmdbId: number;
    title: string;
  } | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtra filmes que ainda estão em plan_to_watch (ou em animação breve de conclusão)
  const enrichedMovies = useMemo(() => {
    return items
      .map((item) => {
        const tmdbId = parseInt(item.id, 10);
        const saved = !isNaN(tmdbId) ? storeItems[tmdbId] : undefined;
        const releaseYear = (saved?.release_date ?? item.release_date)?.slice(0, 4) || "";
        return {
          ...item,
          tmdbId,
          isFavorite: Boolean(saved?.is_favorite),
          status: saved?.status ?? "plan_to_watch",
          releaseYear,
        };
      })
      .filter(
        (m) => m.status === "plan_to_watch" || m.tmdbId === justCompletedId
      );
  }, [items, storeItems, justCompletedId]);

  const favoritesCount = useMemo(
    () => enrichedMovies.filter((m) => m.isFavorite && m.tmdbId !== justCompletedId).length,
    [enrichedMovies, justCompletedId]
  );

  // Volta filtro "favorites" para "all" se esvaziar
  useEffect(() => {
    if (filterMode === "favorites" && favoritesCount === 0) {
      setFilterMode("all");
    }
  }, [filterMode, favoritesCount]);

  const filteredMovies = useMemo(() => {
    if (filterMode === "favorites") {
      return enrichedMovies.filter((m) => m.isFavorite || m.tmdbId === justCompletedId);
    }
    return enrichedMovies;
  }, [enrichedMovies, filterMode, justCompletedId]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));

  // Garante página válida quando lista encolhe ou filtro muda
  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  // Garante que sempre exista um filme selecionado válido
  const selectedMovie = useMemo(() => {
    if (filteredMovies.length === 0) return null;
    if (selectedId) {
      const found = filteredMovies.find((m) => m.id === selectedId);
      if (found) return found;
    }
    return filteredMovies[page * PAGE_SIZE] || filteredMovies[0];
  }, [filteredMovies, selectedId, page]);

  // Observa entrada na tela para só buscar detalhes do filme em foco quando o usuário se aproximar da seção
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || isVisibleInViewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisibleInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisibleInViewport]);

  // Lazy-fetch apenas do filme atualmente selecionado (com debounce leve)
  useEffect(() => {
    if (!isVisibleInViewport || !selectedMovie || isNaN(selectedMovie.tmdbId)) return;

    const tmdbId = selectedMovie.tmdbId;
    if (movieMetaCache.has(tmdbId)) {
      setIsLoadingMeta(false);
      return;
    }

    let cancelled = false;
    setIsLoadingMeta(true);

    const timer = setTimeout(async () => {
      await fetchMovieInspectorMeta(tmdbId);
      if (!cancelled) {
        setIsLoadingMeta(false);
        setMetaTick((t) => t + 1);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isVisibleInViewport, selectedMovie]);

  // Limpeza de timers ao desmontar
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const currentMeta = useMemo(() => {
    void metaTick;
    if (!selectedMovie || isNaN(selectedMovie.tmdbId)) return null;
    return movieMetaCache.get(selectedMovie.tmdbId) || null;
  }, [selectedMovie, metaTick]);

  const pageMovies = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredMovies.slice(start, start + PAGE_SIZE);
  }, [filteredMovies, page]);

  const handleSelectMovie = useCallback((id: string, fromShuffle = false) => {
    setIsVisibleInViewport(true);
    setSelectedId(id);
    setWasShuffled(fromShuffle);
  }, []);

  const handleHoverMovie = useCallback((id: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsVisibleInViewport(true);
      setSelectedId(id);
      setWasShuffled(false);
    }, 140);
  }, []);

  const handleCancelHover = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  // Roleta "Sortear pra Mim" em toda a fila filtrada
  const handleShuffle = useCallback(() => {
    const candidates = filteredMovies.filter((m) => m.tmdbId !== justCompletedId);
    if (candidates.length === 0) return;

    setIsShuffling(true);
    setIsVisibleInViewport(true);

    let nextPool = candidates;
    if (candidates.length > 1 && selectedMovie) {
      nextPool = candidates.filter((m) => m.id !== selectedMovie.id);
    }

    const picked = nextPool[Math.floor(Math.random() * nextPool.length)];
    const pickedIndex = filteredMovies.findIndex((m) => m.id === picked.id);
    if (pickedIndex >= 0) {
      setPage(Math.floor(pickedIndex / PAGE_SIZE));
    }

    setSelectedId(picked.id);
    setWasShuffled(true);

    setTimeout(() => {
      setIsShuffling(false);
    }, 360);
  }, [filteredMovies, justCompletedId, selectedMovie]);

  // Ação principal: Marcar Filme como Assistido com confirmação breve + Desfazer no cabeçalho
  const handleMarkWatched = async () => {
    if (!selectedMovie || isNaN(selectedMovie.tmdbId) || markingWatchedId !== null) return;

    const targetId = selectedMovie.tmdbId;
    const targetTitle = selectedMovie.title;

    setMarkingWatchedId(targetId);
    setJustCompletedId(targetId);

    try {
      await updateStatus(targetId, "completed");

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setLastCompletedUndo({ tmdbId: targetId, title: targetTitle });
      undoTimerRef.current = setTimeout(() => {
        setLastCompletedUndo(null);
      }, 10000);

      setTimeout(() => {
        setJustCompletedId((curr) => (curr === targetId ? null : curr));
        setMarkingWatchedId(null);
        setWasShuffled(false);
      }, 650);
    } catch {
      setJustCompletedId(null);
      setMarkingWatchedId(null);
    }
  };

  const handleUndoCompleted = async () => {
    if (!lastCompletedUndo) return;
    const { tmdbId } = lastCompletedUndo;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastCompletedUndo(null);
    await updateStatus(tmdbId, "plan_to_watch");
    setSelectedId(String(tmdbId));
  };

  const handleToggleFavorite = async () => {
    if (!selectedMovie || isNaN(selectedMovie.tmdbId)) return;
    await toggleFavorite(selectedMovie.tmdbId);
  };

  const activeCount = enrichedMovies.filter((m) => m.tmdbId !== justCompletedId).length;

  if (enrichedMovies.length === 0 && !lastCompletedUndo) {
    return null;
  }

  const spotlightBackdrop =
    currentMeta?.backdropUrl ||
    selectedMovie?.coverHorizontal ||
    selectedMovie?.coverVertical ||
    "";

  const isSelectedExiting =
    selectedMovie !== null && selectedMovie.tmdbId === justCompletedId;

  return (
    <section ref={sectionRef} className="w-full relative py-2 space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="px-4 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                {activeCount}
              </span>
            </h2>

            {/* Alternador Inspector vs Carrossel */}
            {enrichedMovies.length > 0 && (
              <div className="hidden sm:flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/80 text-[11px] font-semibold ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode("inspector")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                    viewMode === "inspector"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Modo Cinema Tonight Inspector"
                >
                  <Film className="w-3 h-3 text-amber-400" />
                  <span>Cinema Tonight</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("carousel")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                    viewMode === "carousel"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Modo Carrossel de Pôsteres"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Carrossel</span>
                </button>
              </div>
            )}

            {/* Pill de Desfazer caso tenha acabado de marcar um filme como assistido */}
            {lastCompletedUndo && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-xs animate-in fade-in slide-in-from-left-2 duration-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                  <strong>{lastCompletedUndo.title}</strong> marcado como visto!
                </span>
                <button
                  type="button"
                  onClick={handleUndoCompleted}
                  className="text-amber-300 hover:text-amber-200 font-extrabold flex items-center gap-1 cursor-pointer shrink-0 underline underline-offset-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Desfazer</span>
                </button>
              </div>
            )}
          </div>

          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* Filtro Favoritos + Link Ver Todos */}
        {enrichedMovies.length > 0 && (
          <div className="flex items-center gap-3">
            {viewMode === "inspector" && favoritesCount > 0 && (
              <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("all");
                    setPage(0);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                    filterMode === "all"
                      ? "bg-amber-500 text-zinc-950 shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todos ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("favorites");
                    setPage(0);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                    filterMode === "favorites"
                      ? "bg-rose-500 text-white shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className="w-3 h-3 fill-current" />
                  <span>Favoritos ({favoritesCount})</span>
                </button>
              </div>
            )}

            {actionHref && (
              <Link
                href={actionHref}
                prefetch={false}
                className="hidden md:flex text-xs font-semibold text-primary hover:text-primary/80 items-center gap-1 transition-colors shrink-0"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Corpo: Carrossel Clássico vs Cinema Tonight Inspector */}
      {enrichedMovies.length > 0 &&
        (viewMode === "carousel" ? (
          <ContentCarousel
            title=""
            items={enrichedMovies.filter((m) => m.tmdbId !== justCompletedId)}
            layout="poster"
          />
        ) : (
          <div className="px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-3xl bg-card/60 border border-border/80 p-4 sm:p-5 shadow-xl">
              {/* COLUNA ESQUERDA (5 cols): Seletor de Capas Paginado + Botão 🎲 Sortear pra Mim */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    Escolha um pôster ou deixe a sorte decidir:
                  </span>

                  <button
                    type="button"
                    onClick={handleShuffle}
                    disabled={filteredMovies.length <= 1 && !wasShuffled}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Dices
                      className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        isShuffling && "rotate-180 scale-110"
                      )}
                    />
                    <span>Sortear pra Mim</span>
                  </button>
                </div>

                {/* Grade 4x2 de Capas da Fila */}
                <div className="grid grid-cols-4 gap-2.5">
                  {pageMovies.map((movie) => {
                    const isSelected = selectedMovie?.id === movie.id;
                    const isDone = movie.tmdbId === justCompletedId;

                    return (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => handleSelectMovie(movie.id, false)}
                        onMouseEnter={() => handleHoverMovie(movie.id)}
                        onMouseLeave={handleCancelHover}
                        title={movie.title}
                        className={cn(
                          "group/poster relative aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer text-left bg-muted",
                          isDone
                            ? "border-emerald-400 scale-95 opacity-60"
                            : isSelected
                              ? "border-amber-400 scale-[1.03] shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/25 z-10"
                              : "border-border/70 opacity-75 hover:opacity-100 hover:border-amber-500/40"
                        )}
                      >
                        <PosterImage
                          src={movie.coverVertical || movie.coverHorizontal}
                          fallbackSrc={movie.coverHorizontal}
                          alt={movie.title}
                          title={movie.title}
                          type="movie"
                          fill
                          sizes="(max-width: 1024px) 22vw, 10vw"
                          showTitleInFallback={true}
                          className="object-cover"
                        />

                        {movie.isFavorite && (
                          <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/75 backdrop-blur-xs flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                          </span>
                        )}

                        {movie.releaseYear && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-bold text-zinc-200 leading-none">
                            {movie.releaseYear}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Rodapé de Paginação da Fila */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs text-muted-foreground">
                  <span>
                    Mostrando{" "}
                    <strong className="text-foreground">
                      {Math.min(page * PAGE_SIZE + 1, filteredMovies.length)}–
                      {Math.min((page + 1) * PAGE_SIZE, filteredMovies.length)}
                    </strong>{" "}
                    de <strong className="text-foreground">{filteredMovies.length}</strong>
                  </span>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const prevPage = Math.max(0, page - 1);
                          setPage(prevPage);
                          const firstOnPage = filteredMovies[prevPage * PAGE_SIZE];
                          if (firstOnPage) handleSelectMovie(firstOnPage.id, false);
                        }}
                        disabled={page === 0}
                        aria-label="Página anterior de filmes"
                        className="h-7 w-7 rounded-lg bg-secondary/70 hover:bg-secondary disabled:opacity-35 flex items-center justify-center text-foreground transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-semibold px-1.5">
                        {page + 1} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextPage = Math.min(totalPages - 1, page + 1);
                          setPage(nextPage);
                          const firstOnPage = filteredMovies[nextPage * PAGE_SIZE];
                          if (firstOnPage) handleSelectMovie(firstOnPage.id, false);
                        }}
                        disabled={page >= totalPages - 1}
                        aria-label="Próxima página de filmes"
                        className="h-7 w-7 rounded-lg bg-secondary/70 hover:bg-secondary disabled:opacity-35 flex items-center justify-center text-foreground transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA DIREITA (7 cols): Palco Cinematográfico do Filme Selecionado */}
              {selectedMovie && (
                <div
                  className={cn(
                    "lg:col-span-7 relative rounded-2xl overflow-hidden border min-h-[290px] sm:min-h-[330px] flex flex-col justify-between p-5 sm:p-7 transition-all duration-300 bg-zinc-950",
                    isSelectedExiting
                      ? "border-emerald-400/70 ring-2 ring-emerald-400/30"
                      : wasShuffled
                        ? "border-amber-400/60 shadow-lg shadow-amber-500/10"
                        : "border-border/80"
                  )}
                >
                  {/* Arte Widescreen de Fundo */}
                  <div className="absolute inset-0 pointer-events-none">
                    <PosterImage
                      key={spotlightBackdrop || selectedMovie.id}
                      src={spotlightBackdrop}
                      fallbackSrc={selectedMovie.coverVertical}
                      alt={selectedMovie.title}
                      title={selectedMovie.title}
                      type="movie"
                      fill
                      tmdbSize="w1280"
                      sizes="(max-width: 1024px) 95vw, 55vw"
                      showTitleInFallback={false}
                      className="object-cover object-[center_25%] opacity-45 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/25" />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
                  </div>

                  {/* Topo do Palco: Selo Sorteado + Botão Favoritar */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div>
                      {isSelectedExiting ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold">
                          <Check className="w-3.5 h-3.5" />
                          <span>🎉 Sessão concluída! Movendo para Assistidos...</span>
                        </span>
                      ) : wasShuffled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/45 text-amber-300 text-xs font-extrabold animate-in fade-in zoom-in-95 duration-200">
                          <Dices className="w-3.5 h-3.5" />
                          <span>Sugestão sorteada para hoje!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-zinc-300 text-[11px] font-semibold">
                          <Film className="w-3 h-3 text-amber-400" />
                          <span>Em foco na sua fila</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      aria-label={
                        selectedMovie.isFavorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      className={cn(
                        "h-9 w-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer",
                        selectedMovie.isFavorite
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                          : "bg-black/55 border-white/15 text-zinc-300 hover:text-white hover:border-white/30"
                      )}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          selectedMovie.isFavorite && "fill-current"
                        )}
                      />
                    </button>
                  </div>

                  {/* Base do Palco: Metadados, Título, Sinopse e Ações */}
                  <div className="relative z-10 space-y-3 pt-8">
                    {/* Linha de Badges: Streaming, Duração, Nota, Ano e Gêneros */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {currentMeta?.providers && currentMeta.providers.length > 0 ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/35 text-amber-200 font-bold">
                          {currentMeta.providers[0].logo_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                buildTmdbUrl(currentMeta.providers[0].logo_path, "w92") ||
                                ""
                              }
                              alt={currentMeta.providers[0].provider_name}
                              className="w-4 h-4 rounded-xs object-cover"
                            />
                          ) : (
                            <Tv2 className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>{currentMeta.providers[0].provider_name}</span>
                        </div>
                      ) : !isLoadingMeta && currentMeta ? (
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900/85 border border-white/10 text-zinc-300 font-semibold">
                          Catálogo / Aluguel
                        </span>
                      ) : null}

                      {currentMeta?.runtimeText && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/15 text-zinc-100 font-semibold">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{currentMeta.runtimeText}</span>
                        </span>
                      )}

                      {currentMeta?.voteAverage && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-extrabold px-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{currentMeta.voteAverage}</span>
                        </span>
                      )}

                      {selectedMovie.releaseYear && (
                        <span className="text-zinc-300 font-semibold">
                          {selectedMovie.releaseYear}
                        </span>
                      )}

                      {currentMeta?.genres && currentMeta.genres.length > 0 && (
                        <span className="text-zinc-400 truncate max-w-xs">
                          • {currentMeta.genres.join(", ")}
                        </span>
                      )}

                      {isLoadingMeta && !currentMeta && (
                        <span className="h-5 w-36 rounded-md bg-white/10 animate-pulse inline-block" />
                      )}
                    </div>

                    {/* Título do Filme */}
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                      {selectedMovie.title}
                    </h3>

                    {/* Sinopse Curta ou Tagline */}
                    {currentMeta?.overview ? (
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2 max-w-2xl">
                        {currentMeta.overview}
                      </p>
                    ) : currentMeta?.tagline ? (
                      <p className="text-xs sm:text-sm text-zinc-300 italic line-clamp-2 max-w-2xl">
                        &ldquo;{currentMeta.tagline}&rdquo;
                      </p>
                    ) : isLoadingMeta ? (
                      <div className="space-y-1.5 max-w-lg">
                        <div className="h-3.5 w-full rounded bg-white/10 animate-pulse" />
                        <div className="h-3.5 w-3/4 rounded bg-white/10 animate-pulse" />
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-zinc-400">
                        Salvo na sua lista para a próxima sessão de cinema.
                      </p>
                    )}

                    {/* Botões de Ação Principais */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={handleMarkWatched}
                        disabled={markingWatchedId !== null}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg",
                          isSelectedExiting
                            ? "bg-emerald-500 text-zinc-950"
                            : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-95"
                        )}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          {isSelectedExiting
                            ? "Marcado como Assistido!"
                            : "Marcar como Assistido"}
                        </span>
                      </button>

                      <Link
                        href={`/movie/${selectedMovie.id}`}
                        prefetch={false}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>Ver Detalhes</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Link Mobile */}
            {actionHref && (
              <div className="mt-2 flex md:hidden justify-end">
                <Link
                  href={actionHref}
                  prefetch={false}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <span>{actionText}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ))}
    </section>
  );
});
