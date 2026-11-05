"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { RecommendationItem, RecommendationGenre } from "@/types/recommendation";
import { TvSeriesDetailsResponse } from "@/types/details";
import { PosterImage } from "@/components/shared/PosterImage";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useExploreStore } from "@/store/useExploreStore";
import {
  RefreshCw,
  Sparkles,
  EyeOff,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Tv,
  Eye,
} from "lucide-react";

interface SeriesShowrunnerRecommendationsProps {
  items: RecommendationItem[];
}

interface SeriesStageMeta {
  overview: string;
  paceText: string;
  bingeLabel: string;
  genres: string[];
  yearText: string;
}

const BATCH_SIZE = 5;

// Cache em memória O(1) para enriquecer apenas a série ativa no Palco (1 requisição sob demanda com debounce)
const seriesStageMetaCache = new Map<number, SeriesStageMeta>();
const inflightSeriesMeta = new Map<number, Promise<SeriesStageMeta | null>>();

function extractSeriesYear(item: RecommendationItem): string {
  const raw = item.first_air_date || item.release_date;
  if (!raw) return "";
  return raw.split("-")[0] || "";
}

function extractSeriesGenres(item: RecommendationItem, cached?: SeriesStageMeta | null): string[] {
  if (item.genres && item.genres.length > 0) {
    return item.genres
      .map((g: RecommendationGenre | string) => (typeof g === "string" ? g : g.name))
      .filter(Boolean)
      .slice(0, 3);
  }
  if (cached?.genres && cached.genres.length > 0) {
    return cached.genres.slice(0, 3);
  }
  return [];
}

function buildFallbackPace(item: RecommendationItem): { paceText: string; bingeLabel: string } {
  if (item.runtime && item.runtime > 0) {
    return {
      paceText: `Episódios de ~${item.runtime}m`,
      bingeLabel: item.runtime <= 30 ? "⚡ Ritmo Ágil" : "📺 Série Recomendada",
    };
  }
  return {
    paceText: "Série Compatível",
    bingeLabel: "✨ Alta Sintonia",
  };
}

function deriveTvPaceMeta(tv: TvSeriesDetailsResponse): SeriesStageMeta {
  const seasons = tv.number_of_seasons || 0;
  const episodes = tv.number_of_episodes || 0;
  const status = tv.status || "";

  let bingeLabel = "📺 Série em Destaque";
  let paceParts: string[] = [];

  if (seasons === 1 && episodes > 0 && episodes <= 12) {
    bingeLabel = "⚡ Maratona Curta";
    paceParts = ["1 Temporada", `${episodes} Episódios`];
  } else if (status === "Miniseries") {
    bingeLabel = "🎬 Minissérie Fechada";
    paceParts = episodes > 0 ? [`${episodes} Episódios`, "História Fechada"] : ["Minissérie"];
  } else if (status === "Ended" || status === "Canceled") {
    bingeLabel = "✓ Saga Completa";
    if (seasons > 0) paceParts.push(`${seasons} Temporada${seasons > 1 ? "s" : ""}`);
    if (episodes > 0) paceParts.push(`${episodes} ep.`);
    paceParts.push("Finalizada");
  } else {
    bingeLabel = episodes > 0 && episodes <= 26 ? "🔥 Ritmo Envolvente" : "📺 Em Exibição";
    if (seasons > 0) paceParts.push(`${seasons} Temporada${seasons > 1 ? "s" : ""}`);
    if (episodes > 0) paceParts.push(`${episodes} Episódios`);
  }

  const startYear = tv.first_air_date ? tv.first_air_date.split("-")[0] : "";

  return {
    overview: tv.overview || "",
    paceText: paceParts.join(" • ") || "Série",
    bingeLabel,
    genres: (tv.genres || []).map((g) => g.name).filter(Boolean).slice(0, 3),
    yearText: startYear,
  };
}

async function fetchSeriesStageMeta(seriesId: number): Promise<SeriesStageMeta | null> {
  if (seriesStageMetaCache.has(seriesId)) {
    return seriesStageMetaCache.get(seriesId)!;
  }
  if (inflightSeriesMeta.has(seriesId)) {
    return inflightSeriesMeta.get(seriesId)!;
  }

  const req = (async () => {
    try {
      const res = await api.get<TvSeriesDetailsResponse>(`/api/tv/${seriesId}`);
      if (!res.data) return null;
      const meta = deriveTvPaceMeta(res.data);
      seriesStageMetaCache.set(seriesId, meta);
      return meta;
    } catch {
      return null;
    } finally {
      inflightSeriesMeta.delete(seriesId);
    }
  })();

  inflightSeriesMeta.set(seriesId, req);
  return req;
}

function isHighlightedTag(tag: string): boolean {
  return (
    tag.startsWith("❤️") ||
    tag.startsWith("🎬") ||
    tag.startsWith("🌟") ||
    tag.startsWith("🍿") ||
    tag.startsWith("🔄")
  );
}

function CompatibilityRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-md border border-primary/55 pl-2 pr-3 py-1 text-white shadow-lg shrink-0">
      <svg className="w-6 h-6 sm:w-7 sm:h-7 -rotate-90" viewBox="0 0 28 28" aria-hidden="true">
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="3.2"
        />
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={dashOffset.toFixed(1)}
        />
      </svg>
      <span className="text-xs sm:text-sm font-extrabold tracking-tight">
        {safeScore}% <span className="text-[11px] font-medium text-zinc-300">Match</span>
      </span>
    </div>
  );
}

export function SeriesShowrunnerRecommendations({
  items,
}: SeriesShowrunnerRecommendationsProps) {
  const [seriesList, setSeriesList] = useState<RecommendationItem[]>(items);
  const [batchIndex, setBatchIndex] = useState(0);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [hasCompletedCycle, setHasCompletedCycle] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [, setMetaVersion] = useState(0);

  const seenInCycleRef = useRef<Set<number>>(new Set());
  const mobileStageRailRef = useRef<HTMLDivElement | null>(null);
  const mobileDockRailRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const isRefreshingSeries = useExploreStore((state) => state.isRefreshingSeries);
  const refreshExploreBatch = useExploreStore((state) => state.refreshExploreBatch);

  useEffect(() => {
    setSeriesList(items);
  }, [items]);

  const totalBatches = useMemo(() => {
    if (seriesList.length === 0) return 0;
    return Math.max(1, Math.ceil(seriesList.length / BATCH_SIZE));
  }, [seriesList.length]);

  const safeBatchIndex = totalBatches > 0 ? batchIndex % totalBatches : 0;
  const isOnLastBatch = totalBatches > 1 && safeBatchIndex === totalBatches - 1;

  // Fatiamento O(1) do lote atual de 5 séries
  const currentBatch = useMemo(() => {
    if (seriesList.length === 0) return [];
    const start = safeBatchIndex * BATCH_SIZE;
    const primarySlice = seriesList.slice(start, start + BATCH_SIZE);

    if (primarySlice.length >= BATCH_SIZE || seriesList.length <= BATCH_SIZE) {
      return primarySlice;
    }

    const needed = BATCH_SIZE - primarySlice.length;
    const primaryIds = new Set(primarySlice.map((s) => s.id));
    const wrapFill: RecommendationItem[] = [];
    for (const s of seriesList) {
      if (!primaryIds.has(s.id)) {
        wrapFill.push(s);
        if (wrapFill.length >= needed) break;
      }
    }
    return [...primarySlice, ...wrapFill];
  }, [seriesList, safeBatchIndex]);

  const safeActiveIdx =
    currentBatch.length > 0 ? Math.min(activeSlideIdx, currentBatch.length - 1) : 0;
  const activeSeries = currentBatch[safeActiveIdx] || currentBatch[0];

  // Registra IDs vistos no lote atual em O(B) (B <= 5)
  useEffect(() => {
    currentBatch.forEach((s) => seenInCycleRef.current.add(s.id));
  }, [currentBatch]);

  // Enriquecimento preguiçoso APENAS para a única série em foco no Palco (com debounce de 160ms)
  useEffect(() => {
    if (!activeSeries) return;
    if (seriesStageMetaCache.has(activeSeries.id)) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchSeriesStageMeta(activeSeries.id).then((meta) => {
        if (!cancelled && meta) {
          setMetaVersion((v) => v + 1);
        }
      });
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeSeries]);

  // Sincroniza o scroll do Dock inferior quando o slide ativo muda no mobile
  useEffect(() => {
    const dock = mobileDockRailRef.current;
    if (!dock) return;
    const activeChip = dock.children[safeActiveIdx] as HTMLElement | undefined;
    if (!activeChip) return;

    const targetLeft =
      activeChip.offsetLeft - dock.clientWidth / 2 + activeChip.clientWidth / 2;
    dock.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [safeActiveIdx]);

  // Navega programaticamente para um slide do Palco Mobile em O(1)
  const scrollToMobileStageSlide = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (currentBatch.length === 0) return;
      const clamped = ((index % currentBatch.length) + currentBatch.length) % currentBatch.length;
      setActiveSlideIdx(clamped);

      const rail = mobileStageRailRef.current;
      if (rail && rail.clientWidth > 0) {
        rail.scrollTo({
          left: clamped * rail.clientWidth,
          behavior,
        });
      }
    },
    [currentBatch.length]
  );

  // Listener passivo O(1) de swipe no Palco Mobile: calcula o índice pelo scrollLeft sem reflow caro
  const handleMobileStageScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const rail = mobileStageRailRef.current;
      if (!rail || rail.clientWidth <= 0) return;
      const nextIdx = Math.round(rail.scrollLeft / rail.clientWidth);
      setActiveSlideIdx((prev) => (prev !== nextIdx ? nextIdx : prev));
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const handleCycleBatch = useCallback(() => {
    if (totalBatches <= 1) return;
    const nextIdx = (safeBatchIndex + 1) % totalBatches;
    if (nextIdx === totalBatches - 1 || nextIdx === 0) {
      setHasCompletedCycle(true);
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setBatchIndex(nextIdx);
      setActiveSlideIdx(0);
      if (mobileStageRailRef.current) {
        mobileStageRailRef.current.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
      }
      setIsTransitioning(false);
    }, 150);
  }, [safeBatchIndex, totalBatches]);

  const handleGenerateFreshSuggestions = useCallback(async () => {
    const excludeIds = Array.from(seenInCycleRef.current);
    seriesList.forEach((s) => {
      if (!excludeIds.includes(s.id)) excludeIds.push(s.id);
    });

    setIsTransitioning(true);
    const result = await refreshExploreBatch("tv", excludeIds);
    seenInCycleRef.current.clear();
    setBatchIndex(0);
    setActiveSlideIdx(0);
    setHasCompletedCycle(false);
    if (mobileStageRailRef.current) {
      mobileStageRailRef.current.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
    }
    setIsTransitioning(false);

    if (result.count > 0) {
      toast.add({
        title: "Novas séries carregadas",
        description: result.refreshed
          ? `${result.count} séries selecionadas com base no seu perfil.`
          : "Séries reordenadas priorizando sugestões menos exibidas.",
        type: "success",
      });
    }
  }, [seriesList, refreshExploreBatch]);

  const handleDismiss = useCallback(async (item: RecommendationItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const displayTitle = item.name || item.title || "Série";
    setHiddenIds((prev) => new Set(prev).add(item.id));

    try {
      await api.post("/api/recommendations/dismiss", {
        tmdb_id: item.id,
        media_type: "tv",
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
      console.error("Erro ao dispensar série:", err);
    }

    setTimeout(() => {
      useExploreStore.getState().dismissItem(item.id);
      setSeriesList((prev) => prev.filter((i) => i.id !== item.id));
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 300);
  }, []);

  if (!seriesList || seriesList.length === 0 || currentBatch.length === 0 || !activeSeries) {
    return null;
  }

  const showFreshPoolAction = isOnLastBatch || hasCompletedCycle || totalBatches <= 1;

  // Dados resolvidos da série em foco para o Palco Desktop
  const activeCached = seriesStageMetaCache.get(activeSeries.id);
  const activeFallbackPace = buildFallbackPace(activeSeries);
  const activeTitle = activeSeries.name || activeSeries.title || "Série";
  const activeYear = extractSeriesYear(activeSeries) || activeCached?.yearText || "";
  const activePace = activeCached?.paceText || activeFallbackPace.paceText;
  const activeBingeLabel = activeCached?.bingeLabel || activeFallbackPace.bingeLabel;
  const activeGenres = extractSeriesGenres(activeSeries, activeCached);
  const activeOverview = activeSeries.overview?.trim() || activeCached?.overview || "";
  const activeRankNumber = safeBatchIndex * BATCH_SIZE + safeActiveIdx + 1;

  return (
    <section aria-label="Séries Recomendadas">
      {/* Cabeçalho da Seção + Controles de Lote */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5 flex-wrap">
            <span>✨ Séries Recomendadas</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Séries escolhidas a dedo com base no seu perfil de compatibilidade.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {totalBatches > 1 && (
            <span className="font-mono text-xs text-muted-foreground px-2.5 py-1.5 rounded-lg bg-secondary/80 border border-border">
              Lote {safeBatchIndex + 1}/{totalBatches} • {seriesList.length} sugestões
            </span>
          )}

          {totalBatches > 1 && (
            <button
              type="button"
              onClick={handleCycleBatch}
              disabled={isRefreshingSeries}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-secondary hover:bg-accent text-foreground border border-border hover:border-primary/40 transition-all active:scale-[0.98] disabled:opacity-50"
              title="Ver próximo lote de séries já calculadas"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>Alternar Lote</span>
            </button>
          )}

          {showFreshPoolAction && (
            <button
              type="button"
              onClick={handleGenerateFreshSuggestions}
              disabled={isRefreshingSeries}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/35 transition-all active:scale-[0.98] disabled:opacity-60"
              title="Buscar um novo conjunto de séries compatíveis no catálogo"
            >
              <Sparkles className={cn("w-3.5 h-3.5", isRefreshingSeries && "animate-spin")} />
              <span>{isRefreshingSeries ? "Gerando..." : "Novas Sugestões"}</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-200",
          isTransitioning || isRefreshingSeries
            ? "opacity-40 translate-y-1 pointer-events-none"
            : "opacity-100 translate-y-0"
        )}
      >
        {/* ====================================================================
            VERSÃO DESKTOP (lg+): Tracklist Esquerda (5 col) + Palco Direita (7 col)
            Hover/Focus troca o palco em O(1); Clique navega direto para /tv/[id]
            ==================================================================== */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 min-h-[430px]">
          {/* Coluna Esquerda: Tracklist #1 a #5 */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {currentBatch.map((item, idx) => {
              const isCurrent = idx === safeActiveIdx;
              const cached = seriesStageMetaCache.get(item.id);
              const fallbackPace = buildFallbackPace(item);
              const title = item.name || item.title || "Série";
              const year = extractSeriesYear(item) || cached?.yearText;
              const pace = cached?.paceText || fallbackPace.paceText;
              const rankNumber = safeBatchIndex * BATCH_SIZE + idx + 1;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveSlideIdx(idx)}
                  className={cn(
                    "group relative flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200",
                    isCurrent
                      ? "bg-primary/12 border-primary shadow-md"
                      : "bg-card border-border hover:border-primary/45 hover:bg-accent/40",
                    hiddenIds.has(item.id) && "opacity-0 scale-95 pointer-events-none"
                  )}
                >
                  <Link
                    href={`/tv/${item.id}`}
                    prefetch={false}
                    onFocus={() => setActiveSlideIdx(idx)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span
                      className={cn(
                        "font-mono text-xs font-extrabold w-6 text-center shrink-0",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      #{rankNumber}
                    </span>

                    <div className="relative w-11 aspect-[2/3] rounded-lg overflow-hidden border border-border shrink-0">
                      <PosterImage
                        src={item.poster_path}
                        fallbackSrc={item.backdrop_path}
                        alt={title}
                        title={title}
                        type="tv"
                        tmdbSize="w185"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "text-sm font-extrabold truncate transition-colors",
                          isCurrent ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}
                      >
                        {title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {[year, pace].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold shadow-sm">
                      {Math.round(item.match_score)}%
                    </span>

                    <AddToListButton
                      tmdb_id={item.id}
                      media_type="tv"
                      title={title}
                      poster_path={item.poster_path}
                      backdrop_path={item.backdrop_path}
                      release_date={item.first_air_date || item.release_date}
                      className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4"
                    />

                    <button
                      type="button"
                      onClick={(e) => handleDismiss(item, e)}
                      className="w-8 h-8 rounded-full bg-secondary hover:bg-red-500/15 text-muted-foreground hover:text-red-400 border border-border hover:border-red-400/40 inline-flex items-center justify-center transition-colors"
                      title="Não tenho interesse"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna Direita: Palco Showrunner Widescreen */}
          <article
            className={cn(
              "lg:col-span-7 relative rounded-2xl overflow-hidden border border-primary/40 hover:border-primary/70 bg-zinc-950 p-7 flex flex-col justify-end isolate group shadow-xl transition-all duration-300",
              hiddenIds.has(activeSeries.id) && "opacity-0 scale-95 pointer-events-none"
            )}
          >
            {/* Widescreen Backdrop */}
            <div className="absolute inset-0 -z-20">
              <PosterImage
                key={activeSeries.id}
                src={activeSeries.backdrop_path}
                fallbackSrc={activeSeries.poster_path}
                alt={activeTitle}
                title={activeTitle}
                type="tv"
                tmdbSize="w1280"
                className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>

            {/* Scrim Cinematográfico */}
            <div
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(4,8,18,0.22) 0%, rgba(4,8,18,0.62) 45%, rgba(4,8,18,0.96) 100%)",
              }}
            />

            {/* Topo do Palco */}
            <div className="absolute top-5 left-6 right-6 flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-white/15 backdrop-blur-md text-xs font-extrabold text-amber-400">
                  #{activeRankNumber} NO PALCO
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 backdrop-blur-md text-xs font-bold text-emerald-200">
                  {activeBingeLabel}
                </span>
              </div>

              <CompatibilityRing score={activeSeries.match_score} />
            </div>

            {/* Conteúdo Editorial do Palco */}
            <div className="relative z-10 max-w-2xl text-white pt-14">
              <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-300 font-medium mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider">
                  <Tv className="w-3 h-3" />
                  Série
                </span>
                {activeYear && <span>{activeYear}</span>}
                {activePace && (
                  <>
                    <span className="opacity-50">•</span>
                    <span>{activePace}</span>
                  </>
                )}
                {activeGenres.length > 0 && (
                  <>
                    <span className="opacity-50">•</span>
                    <span className="truncate">{activeGenres.join(", ")}</span>
                  </>
                )}
              </div>

              <Link href={`/tv/${activeSeries.id}`} prefetch={false} className="block group/stitle">
                <h3 className="text-2xl xl:text-[28px] font-extrabold leading-tight tracking-tight mb-2.5 drop-shadow-md group-hover/stitle:text-primary transition-colors line-clamp-2">
                  {activeTitle}
                </h3>
              </Link>

              {activeOverview && (
                <p className="text-sm text-zinc-200 line-clamp-3 mb-4 leading-relaxed">
                  {activeOverview}
                </p>
              )}

              {activeSeries.match_tags && activeSeries.match_tags.length > 0 && (
                <div className="p-3 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-md mb-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Por que combina com você
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSeries.match_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border",
                          isHighlightedTag(tag)
                            ? "bg-amber-500/15 border-amber-400/35 text-amber-200"
                            : "bg-white/10 border-white/15 text-zinc-100"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center flex-wrap gap-2.5">
                <AddToListButton
                  tmdb_id={activeSeries.id}
                  media_type="tv"
                  title={activeTitle}
                  poster_path={activeSeries.poster_path}
                  backdrop_path={activeSeries.backdrop_path}
                  release_date={activeSeries.first_air_date || activeSeries.release_date}
                  showLabel
                  addLabel="Quero Assistir"
                />

                <Link
                  href={`/tv/${activeSeries.id}`}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-white/12 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
                >
                  <span>Abrir Série</span>
                  <ArrowUpRight className="w-4 h-4 opacity-80" />
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleDismiss(activeSeries, e)}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/20 hover:border-red-400/40 backdrop-blur-md inline-flex items-center justify-center transition-all"
                  title="Não tenho interesse (ocultar por 6 meses)"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* ====================================================================
            VERSÃO MOBILE (< lg):
            1. Palco Widescreen Deslizável (snap-x) no Topo + Setas ‹ / ›:
               - Arrastar o palco pro lado (ou tocar ‹ / ›) troca a série a 60fps
               - Tocar no título/card do palco leva direto para /tv/[id]
            2. Dock de Mini-Pôsteres (#1–#5) Logo Abaixo:
               - Tocar no PÔSTER abre /tv/[id] (respeitando o padrão do app)
               - Tocar na cápsula separada "Palco" abaixo do pôster desliza o palco
                 direto para aquela série em O(1) sem sair da tela!
            ==================================================================== */}
        <div className="flex flex-col gap-3 lg:hidden">
          {/* Topo Mobile: Carrossel do Palco Widescreen com Swipe Nativo */}
          <div className="relative">
            <div
              ref={mobileStageRailRef}
              onScroll={handleMobileStageScroll}
              className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl border border-primary/40 shadow-xl scrollbar-none"
            >
              {currentBatch.map((item, idx) => {
                const cached = seriesStageMetaCache.get(item.id);
                const fallbackPace = buildFallbackPace(item);
                const title = item.name || item.title || "Série";
                const year = extractSeriesYear(item) || cached?.yearText || "";
                const pace = cached?.paceText || fallbackPace.paceText;
                const bingeLabel = cached?.bingeLabel || fallbackPace.bingeLabel;
                const overview = item.overview?.trim() || cached?.overview || "";
                const rankNumber = safeBatchIndex * BATCH_SIZE + idx + 1;

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "w-full shrink-0 snap-center relative min-h-[255px] sm:min-h-[320px] bg-zinc-950 p-4 sm:p-6 flex flex-col justify-end isolate",
                      hiddenIds.has(item.id) && "opacity-0 scale-95 pointer-events-none"
                    )}
                  >
                    {/* Backdrop */}
                    <div className="absolute inset-0 -z-20">
                      <PosterImage
                        src={item.backdrop_path}
                        fallbackSrc={item.poster_path}
                        alt={title}
                        title={title}
                        type="tv"
                        tmdbSize="w780"
                      />
                    </div>

                    {/* Scrim */}
                    <div
                      className="absolute inset-0 -z-10 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(4,8,18,0.22) 0%, rgba(4,8,18,0.65) 45%, rgba(4,8,18,0.97) 100%)",
                      }}
                    />

                    {/* Topo do Slide */}
                    <div className="absolute top-3 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/15 backdrop-blur-md text-[11px] font-extrabold text-amber-400">
                          #{rankNumber}/{safeBatchIndex * BATCH_SIZE + currentBatch.length}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 backdrop-blur-md text-[11px] font-bold text-emerald-200">
                          {bingeLabel}
                        </span>
                      </div>

                      <CompatibilityRing score={item.match_score} />
                    </div>

                    {/* Corpo do Slide */}
                    <div className="relative z-10 text-white pt-11">
                      <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-zinc-300 font-medium mb-1">
                        <span>Série</span>
                        {year && (
                          <>
                            <span className="opacity-50">•</span>
                            <span>{year}</span>
                          </>
                        )}
                        {pace && (
                          <>
                            <span className="opacity-50">•</span>
                            <span className="truncate">{pace}</span>
                          </>
                        )}
                      </div>

                      <Link href={`/tv/${item.id}`} prefetch={false} className="block">
                        <h3 className="text-lg sm:text-2xl font-extrabold leading-tight tracking-tight mb-1.5 line-clamp-1 drop-shadow-md">
                          {title}
                        </h3>
                      </Link>

                      {overview && (
                        <p className="text-xs text-zinc-300 line-clamp-2 mb-2.5 leading-relaxed">
                          {overview}
                        </p>
                      )}

                      {item.match_tags && item.match_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.match_tags.slice(0, 2).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border max-w-full truncate",
                                isHighlightedTag(tag)
                                  ? "bg-amber-500/15 border-amber-400/35 text-amber-200"
                                  : "bg-white/10 border-white/15 text-zinc-100"
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Barra de Ações + Setas de Troca Rápida do Palco */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AddToListButton
                            tmdb_id={item.id}
                            media_type="tv"
                            title={title}
                            poster_path={item.poster_path}
                            backdrop_path={item.backdrop_path}
                            release_date={item.first_air_date || item.release_date}
                            showLabel
                            addLabel="Quero Ver"
                          />

                          <Link
                            href={`/tv/${item.id}`}
                            prefetch={false}
                            className="inline-flex items-center gap-1 h-10 px-3 rounded-xl text-xs font-semibold bg-white/12 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                          >
                            <span>Abrir</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => handleDismiss(item, e)}
                            className="w-9 h-9 rounded-full bg-black/60 text-zinc-300 hover:text-red-400 border border-white/20 inline-flex items-center justify-center"
                            title="Não tenho interesse"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {currentBatch.length > 1 && (
                          <div className="inline-flex items-center gap-1 bg-black/65 border border-white/15 rounded-xl p-1 backdrop-blur-md">
                            <button
                              type="button"
                              onClick={() => scrollToMobileStageSlide(safeActiveIdx - 1)}
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all"
                              aria-label="Série anterior no palco"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollToMobileStageSlide(safeActiveIdx + 1)}
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all"
                              aria-label="Próxima série no palco"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Base Mobile: Dock Horizontal de Mini-Pôsteres (#1–#5) Sincronizado
              - Tocar na IMAGEM do pôster -> Abre a página da série (/tv/[id])
              - Tocar no botão cápsula "Palco" -> Foca essa série no palco acima sem sair da tela */}
          <div
            ref={mobileDockRailRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
          >
            {currentBatch.map((item, idx) => {
              const isCurrent = idx === safeActiveIdx;
              const title = item.name || item.title || "Série";
              const rankNumber = safeBatchIndex * BATCH_SIZE + idx + 1;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "w-[82px] sm:w-[104px] shrink-0 snap-start rounded-xl p-1.5 border transition-all duration-200 flex flex-col gap-1.5",
                    isCurrent
                      ? "bg-primary/15 border-primary shadow-md"
                      : "bg-card border-border/80 opacity-80 hover:opacity-100"
                  )}
                >
                  {/* Zona 1: Link direto para a página da série (comportamento padrão de pôster) */}
                  <Link
                    href={`/tv/${item.id}`}
                    prefetch={false}
                    className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-border/60 block group"
                    title={`Abrir página de ${title}`}
                  >
                    <PosterImage
                      src={item.poster_path}
                      fallbackSrc={item.backdrop_path}
                      alt={title}
                      title={title}
                      type="tv"
                      tmdbSize="w185"
                    />
                    <span className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9.5px] font-extrabold backdrop-blur-sm">
                      #{rankNumber}
                    </span>
                    <span className="absolute bottom-1 right-1 z-20 px-1 py-0.5 rounded bg-primary text-primary-foreground text-[9.5px] font-extrabold shadow">
                      {Math.round(item.match_score)}%
                    </span>
                  </Link>

                  {/* Zona 2: Cápsula exclusiva de troca do Palco em O(1) (não navega para outra rota) */}
                  <button
                    type="button"
                    onClick={() => scrollToMobileStageSlide(idx)}
                    className={cn(
                      "w-full py-1 px-1.5 rounded-lg text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={isCurrent}
                    title={`Exibir ${title} no palco acima`}
                  >
                    <Eye className="w-3 h-3 shrink-0" />
                    <span className="truncate">{isCurrent ? "No Palco" : "Palco"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
