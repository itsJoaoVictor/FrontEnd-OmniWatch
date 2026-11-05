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
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { PosterImage, buildTmdbUrl } from "@/components/shared/PosterImage";
import { useMyListStore } from "@/store/useMyListStore";
import { removeUpToDateShowFromCache } from "@/lib/seriesCache";
import { TvSeriesDetailsResponse, WatchProviderItem } from "@/types/details";
import { MediaItem } from "./MediaCard";
import { ContentCarousel } from "./ContentCarousel";

interface TvQueueAccordionProps {
  items: MediaItem[];
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
}

interface CachedTvMeta {
  seasonsCount: number | null;
  episodesCount: number | null;
  voteAverage: number | null;
  genres: string[];
  overview: string | null;
  networkName: string | null;
  providers: WatchProviderItem[];
  backdropUrl: string | null;
}

// Cache em memória + deduplicação de requests para a fatia ativa (zero N+1)
const tvMetaCache = new Map<number, CachedTvMeta>();
const inFlightTvMeta = new Map<number, Promise<CachedTvMeta | null>>();

async function fetchTvAccordionMeta(tmdbId: number): Promise<CachedTvMeta | null> {
  if (tvMetaCache.has(tmdbId)) {
    return tvMetaCache.get(tmdbId)!;
  }
  const existing = inFlightTvMeta.get(tmdbId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await api.get<TvSeriesDetailsResponse>(`/api/tv/${tmdbId}`);
      const data = res.data;
      if (!data) return null;

      const meta: CachedTvMeta = {
        seasonsCount:
          typeof data.number_of_seasons === "number" && data.number_of_seasons > 0
            ? data.number_of_seasons
            : null,
        episodesCount:
          typeof data.number_of_episodes === "number" && data.number_of_episodes > 0
            ? data.number_of_episodes
            : null,
        voteAverage:
          typeof data.vote_average === "number" && data.vote_average > 0
            ? Number((data.vote_average / 2).toFixed(1))
            : null,
        genres: Array.isArray(data.genres)
          ? data.genres.slice(0, 2).map((g) => g.name)
          : [],
        overview: data.overview?.trim() || data.tagline?.trim() || null,
        networkName:
          Array.isArray(data.networks) && data.networks.length > 0
            ? data.networks[0].name
            : null,
        providers: Array.isArray(data.watch_providers)
          ? data.watch_providers.slice(0, 2)
          : [],
        backdropUrl: data.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
          : null,
      };
      tvMetaCache.set(tmdbId, meta);
      return meta;
    } catch {
      return null;
    } finally {
      inFlightTvMeta.delete(tmdbId);
    }
  })();

  inFlightTvMeta.set(tmdbId, promise);
  return promise;
}

const SLICE_PAGE_SIZE = 5;

export const TvQueueAccordion = memo(function TvQueueAccordion({
  items,
  title = "Séries na Fila",
  subtitle = "Passe o mouse ou toque para expandir em 16:9 e iniciar sua próxima maratona",
  actionHref = "/my-list",
  actionText = "Ver séries",
}: TvQueueAccordionProps) {
  const storeItems = useMyListStore((state) => state.items);
  const updateStatus = useMyListStore((state) => state.updateStatus);
  const toggleEpisode = useMyListStore((state) => state.toggleEpisode);

  const [viewMode, setViewMode] = useState<"accordion" | "carousel">("accordion");
  const [page, setPage] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(false);
  const [metaTick, setMetaTick] = useState(0);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [exitingStartedId, setExitingStartedId] = useState<number | null>(null);
  const [lastStartedUndo, setLastStartedUndo] = useState<{
    tmdbId: number;
    title: string;
    markedEp1: boolean;
  } | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enrichedSeries = useMemo(() => {
    return items
      .map((item) => {
        const tmdbId = parseInt(item.id, 10);
        const saved = !isNaN(tmdbId) ? storeItems[tmdbId] : undefined;
        const releaseYear = (saved?.release_date ?? item.release_date)?.slice(0, 4) || "";
        return {
          ...item,
          tmdbId,
          status: saved?.status ?? "plan_to_watch",
          releaseYear,
        };
      })
      .filter((s) => s.status === "plan_to_watch" || s.tmdbId === exitingStartedId);
  }, [items, storeItems, exitingStartedId]);

  const totalPages = Math.max(1, Math.ceil(enrichedSeries.length / SLICE_PAGE_SIZE));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const pageSlices = useMemo(() => {
    const start = page * SLICE_PAGE_SIZE;
    return enrichedSeries.slice(start, start + SLICE_PAGE_SIZE);
  }, [enrichedSeries, page]);

  // Garante fatia ativa válida dentro da página atual
  const activeSlice = useMemo(() => {
    if (pageSlices.length === 0) return null;
    if (activeId) {
      const found = pageSlices.find((s) => s.id === activeId);
      if (found) return found;
    }
    return pageSlices[0];
  }, [pageSlices, activeId]);

  // IntersectionObserver para só disparar o fetch da fatia ativa quando próximo da tela
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

  // Lazy-fetch apenas da série expandida no acordeão
  useEffect(() => {
    if (!isVisibleInViewport || !activeSlice || isNaN(activeSlice.tmdbId)) return;

    const tmdbId = activeSlice.tmdbId;
    if (tvMetaCache.has(tmdbId)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      await fetchTvAccordionMeta(tmdbId);
      if (!cancelled) {
        setMetaTick((t) => t + 1);
      }
    }, 130);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isVisibleInViewport, activeSlice]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const handleHoverSlice = useCallback((id: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsVisibleInViewport(true);
      setActiveId(id);
    }, 85);
  }, []);

  const handleCancelHover = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  const handleStartSeries = async (
    e: React.MouseEvent,
    series: (typeof enrichedSeries)[number],
    markEp1Watched: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNaN(series.tmdbId) || startingId !== null) return;

    const targetId = series.tmdbId;
    setStartingId(targetId);
    setExitingStartedId(targetId);
    removeUpToDateShowFromCache(targetId);

    try {
      if (markEp1Watched) {
        // Marca S1 E1 como visto (já muda status automaticamente para 'watching' e aponta para S1 E2)
        await toggleEpisode(targetId, 1, 1, true);
      } else {
        // Move para 'watching' pronto para assistir o S1 E1 nos Ticket Strips
        await updateStatus(targetId, "watching");
      }

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setLastStartedUndo({
        tmdbId: targetId,
        title: series.title,
        markedEp1: markEp1Watched,
      });
      undoTimerRef.current = setTimeout(() => {
        setLastStartedUndo(null);
      }, 10000);

      setTimeout(() => {
        setExitingStartedId((curr) => (curr === targetId ? null : curr));
        setStartingId(null);
      }, 650);
    } catch {
      setExitingStartedId(null);
      setStartingId(null);
    }
  };

  const handleUndoStart = async () => {
    if (!lastStartedUndo) return;
    const { tmdbId, markedEp1 } = lastStartedUndo;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastStartedUndo(null);

    if (markedEp1) {
      await toggleEpisode(tmdbId, 1, 1, false);
    }
    await updateStatus(tmdbId, "plan_to_watch");
    setActiveId(String(tmdbId));
  };

  const activeCount = enrichedSeries.filter((s) => s.tmdbId !== exitingStartedId).length;

  if (enrichedSeries.length === 0 && !lastStartedUndo) {
    return null;
  }

  // URL de baixa resolução da arte ativa usada para projetar o Ambient Backlight Sync real a 60fps
  const activeAmbientSrc = activeSlice
    ? buildTmdbUrl(activeSlice.coverHorizontal || activeSlice.coverVertical, "w342")
    : null;

  void metaTick;

  return (
    <section ref={sectionRef} className="w-full relative py-2 space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="px-4 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                {activeCount}
              </span>
            </h2>

            {/* Alternador Acordeão vs Carrossel */}
            {enrichedSeries.length > 0 && (
              <div className="hidden sm:flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/80 text-[11px] font-semibold ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode("accordion")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                    viewMode === "accordion"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Modo Acordeão 16:9 + Ambient Sync"
                >
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>Acordeão</span>
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

            {/* Pill de Desfazer caso acabe de iniciar uma série */}
            {lastStartedUndo && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-xs animate-in fade-in slide-in-from-left-2 duration-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-medium truncate max-w-[210px] sm:max-w-xs">
                  <strong>{lastStartedUndo.title}</strong> foi para Continuar Assistindo!
                </span>
                <button
                  type="button"
                  onClick={handleUndoStart}
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

        {/* Controles de Paginação do Acordeão + Link Ver Todas */}
        {enrichedSeries.length > 0 && (
          <div className="flex items-center gap-3">
            {viewMode === "accordion" && totalPages > 1 && (
              <div className="flex items-center gap-2.5 bg-secondary/45 border border-border/80 px-3 py-1.5 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-semibold text-[11px] whitespace-nowrap">
                    Pág. {page + 1} de {totalPages}
                  </span>
                  <div className="hidden sm:flex items-center gap-1 ml-1">
                    {Array.from({ length: Math.min(totalPages, 6) }).map((_, dotIdx) => {
                      const isActiveDot =
                        totalPages <= 6
                          ? dotIdx === page
                          : dotIdx === Math.min(5, Math.floor((page / totalPages) * 6));
                      return (
                        <span
                          key={dotIdx}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            isActiveDot ? "w-5 bg-purple-400" : "w-2 bg-border"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = (page - 1 + totalPages) % totalPages;
                      setPage(prev);
                      const firstOnPage = enrichedSeries[prev * SLICE_PAGE_SIZE];
                      if (firstOnPage) setActiveId(firstOnPage.id);
                    }}
                    aria-label="Página anterior de séries"
                    className="p-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (page + 1) % totalPages;
                      setPage(next);
                      const firstOnPage = enrichedSeries[next * SLICE_PAGE_SIZE];
                      if (firstOnPage) setActiveId(firstOnPage.id);
                    }}
                    aria-label="Próxima página de séries"
                    className="p-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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

      {/* Corpo: Carrossel Clássico vs Acordeão Cinematográfico 16:9 + Ambient Sync */}
      {enrichedSeries.length > 0 &&
        (viewMode === "carousel" ? (
          <ContentCarousel
            title=""
            items={enrichedSeries.filter((s) => s.tmdbId !== exitingStartedId)}
            layout="poster"
          />
        ) : (
          <div className="px-4 lg:px-8">
            {/* Container com Ambient Backlight Sync Dinâmico projetado a partir da arte ativa */}
            <div className="relative rounded-3xl bg-zinc-950 border border-purple-500/30 p-3.5 sm:p-5 shadow-2xl overflow-hidden">
              {/* Camada de Projeção Atmosférica (Ambient Backlight Sync em 60fps) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {activeAmbientSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={activeAmbientSrc}
                    src={activeAmbientSrc}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover scale-150 blur-3xl saturate-200 opacity-40 transition-all duration-700"
                  />
                )}
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-sky-500/15 blur-3xl" />
                <div className="absolute inset-0 bg-zinc-950/45" />
              </div>

              {/* DESKTOP: Acordeão Horizontal Expansível (Fluid Slice Strip) */}
              <div className="hidden md:flex flex-row gap-3 h-[350px] w-full relative z-10">
                {pageSlices.map((series, idx) => {
                  const isActive = activeSlice?.id === series.id;
                  const isExiting = series.tmdbId === exitingStartedId;
                  const meta = !isNaN(series.tmdbId)
                    ? tvMetaCache.get(series.tmdbId)
                    : undefined;
                  const backdropSrc =
                    meta?.backdropUrl || series.coverHorizontal || series.coverVertical;
                  const providerBadge =
                    meta?.providers?.[0]?.provider_name || meta?.networkName || null;

                  return (
                    <div
                      key={series.id}
                      onMouseEnter={() => handleHoverSlice(series.id)}
                      onMouseLeave={handleCancelHover}
                      onClick={() => {
                        if (!isActive) {
                          setIsVisibleInViewport(true);
                          setActiveId(series.id);
                        }
                      }}
                      style={{
                        flex: isActive ? "3.6 1 0%" : "0.85 1 0%",
                      }}
                      className={cn(
                        "relative rounded-2xl overflow-hidden border transition-[flex,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] bg-zinc-900 select-none",
                        isExiting
                          ? "border-emerald-400 ring-2 ring-emerald-400/35"
                          : isActive
                            ? "border-white/30 shadow-2xl"
                            : "border-white/10 hover:border-white/25 cursor-pointer"
                      )}
                    >
                      {/* Arte Widescreen 16:9 */}
                      <div className="absolute inset-0">
                        <PosterImage
                          src={backdropSrc}
                          fallbackSrc={series.coverVertical}
                          alt={series.title}
                          title={series.title}
                          type="tv"
                          fill
                          tmdbSize="w1280"
                          priority={idx === 0}
                          sizes={isActive ? "55vw" : "18vw"}
                          showTitleInFallback={false}
                          className={cn(
                            "object-cover object-center transition-all duration-700",
                            isActive
                              ? "scale-100 brightness-95"
                              : "scale-105 brightness-[0.55] hover:brightness-75"
                          )}
                        />
                        <div
                          className={cn(
                            "absolute inset-0 transition-opacity duration-500",
                            isActive
                              ? "bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/15"
                              : "bg-gradient-to-t from-zinc-950/95 via-zinc-950/35 to-transparent"
                          )}
                        />
                      </div>

                      {/* Estado Colapsado: Título compacto na base */}
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 p-3.5 transition-all duration-300 pointer-events-none",
                          isActive ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
                        )}
                      >
                        {series.releaseYear && (
                          <span className="inline-block text-[10px] font-bold text-zinc-400 mb-1">
                            {series.releaseYear}
                          </span>
                        )}
                        <h3 className="text-xs font-bold text-zinc-100 line-clamp-2 leading-snug">
                          {series.title}
                        </h3>
                      </div>

                      {/* Estado Expandido (16:9): Metadados ricos + Ações rápidas */}
                      <div
                        className={cn(
                          "relative z-10 h-full flex flex-col justify-between p-6 transition-all duration-500",
                          isActive
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-4 pointer-events-none"
                        )}
                      >
                        {/* Topo da Fatia Expandida */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isExiting ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/45 text-emerald-300 text-xs font-extrabold">
                                🎉 Enviada para Continuar Assistindo!
                              </span>
                            ) : (
                              <>
                                {providerBadge && (
                                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/25 border border-purple-400/40 backdrop-blur-md text-purple-200 text-[11px] font-extrabold">
                                    {providerBadge}
                                  </span>
                                )}
                                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-zinc-200 text-[11px] font-semibold flex items-center gap-1">
                                  <Tv className="w-3 h-3 text-purple-400" />
                                  <span>Na sua Fila</span>
                                </span>
                              </>
                            )}
                          </div>

                          <Link
                            href={`/tv/${series.id}`}
                            prefetch={false}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Detalhes</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* Base da Fatia Expandida */}
                        <div className="space-y-2.5 max-w-xl">
                          {/* Metadados */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                            {meta?.voteAverage && (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-extrabold">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{meta.voteAverage.toFixed(1)}</span>
                              </span>
                            )}
                            {series.releaseYear && (
                              <span className="font-semibold text-zinc-200">
                                {series.releaseYear}
                              </span>
                            )}
                            {meta?.seasonsCount && (
                              <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-100 font-semibold text-[11px]">
                                {meta.seasonsCount}{" "}
                                {meta.seasonsCount === 1 ? "Temporada" : "Temporadas"}
                                {meta.episodesCount ? ` • ${meta.episodesCount} Eps` : ""}
                              </span>
                            )}
                            {meta?.genres && meta.genres.length > 0 && (
                              <span className="text-zinc-400">
                                • {meta.genres.join(", ")}
                              </span>
                            )}
                          </div>

                          <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight line-clamp-1">
                            {series.title}
                          </h3>

                          {meta?.overview && (
                            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                              {meta.overview}
                            </p>
                          )}

                          {/* Botões de Ação Principais */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={(e) => handleStartSeries(e, series, false)}
                              disabled={startingId !== null}
                              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Começar S1 E1</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleStartSeries(e, series, true)}
                              disabled={startingId !== null}
                              className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Marca o S1 E1 como visto e avança para o S1 E2 em Continuar Assistindo"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Já vi o S1 E1</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MOBILE (< md): Palco 16:9 Ativo + Seletor Tátil de Fatias */}
              {activeSlice && (
                <div className="md:hidden relative z-10 space-y-3">
                  {(() => {
                    const meta = !isNaN(activeSlice.tmdbId)
                      ? tvMetaCache.get(activeSlice.tmdbId)
                      : undefined;
                    const backdropSrc =
                      meta?.backdropUrl ||
                      activeSlice.coverHorizontal ||
                      activeSlice.coverVertical;
                    const providerBadge =
                      meta?.providers?.[0]?.provider_name || meta?.networkName || null;

                    return (
                      <div className="relative rounded-2xl overflow-hidden border border-white/20 min-h-[260px] flex flex-col justify-between p-4 bg-zinc-900">
                        <div className="absolute inset-0">
                          <PosterImage
                            src={backdropSrc}
                            fallbackSrc={activeSlice.coverVertical}
                            alt={activeSlice.title}
                            title={activeSlice.title}
                            type="tv"
                            fill
                            tmdbSize="w780"
                            sizes="95vw"
                            showTitleInFallback={false}
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/20" />
                        </div>

                        <div className="relative z-10 flex items-center justify-between gap-2">
                          {providerBadge ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/25 border border-purple-400/40 text-purple-200 text-[11px] font-bold">
                              {providerBadge}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-zinc-200 text-[11px] font-semibold">
                              Série na Fila
                            </span>
                          )}

                          <Link
                            href={`/tv/${activeSlice.id}`}
                            prefetch={false}
                            className="px-2.5 py-1 rounded-lg bg-black/65 border border-white/15 text-zinc-200 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <span>Detalhes</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>

                        <div className="relative z-10 space-y-2 pt-10">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
                            {meta?.voteAverage && (
                              <span className="text-amber-400 font-bold">
                                ★ {meta.voteAverage.toFixed(1)}
                              </span>
                            )}
                            {activeSlice.releaseYear && <span>{activeSlice.releaseYear}</span>}
                            {meta?.seasonsCount && (
                              <span>
                                • {meta.seasonsCount}{" "}
                                {meta.seasonsCount === 1 ? "Temp." : "Temps."}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-extrabold text-white line-clamp-1">
                            {activeSlice.title}
                          </h3>

                          {meta?.overview && (
                            <p className="text-xs text-zinc-300 line-clamp-2">
                              {meta.overview}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => handleStartSeries(e, activeSlice, false)}
                              disabled={startingId !== null}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold flex items-center gap-1.5"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Começar S1 E1</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleStartSeries(e, activeSlice, true)}
                              disabled={startingId !== null}
                              className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Já vi S1 E1</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mini Fatias Táteis no Mobile */}
                  {pageSlices.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {pageSlices.map((s) => {
                        const selected = activeSlice.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setIsVisibleInViewport(true);
                              setActiveId(s.id);
                            }}
                            className={cn(
                              "relative aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all",
                              selected
                                ? "border-purple-400 scale-[1.03] shadow-md"
                                : "border-white/10 opacity-65"
                            )}
                          >
                            <PosterImage
                              src={s.coverVertical || s.coverHorizontal}
                              fallbackSrc={s.coverHorizontal}
                              alt={s.title}
                              title={s.title}
                              type="tv"
                              fill
                              sizes="18vw"
                              showTitleInFallback={false}
                              className="object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
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
