"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  EyeOff,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { RecommendationItem } from "@/types/recommendation";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { PosterImage } from "@/components/shared/PosterImage";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useExploreStore } from "@/store/useExploreStore";
import { useDragScroll } from "@/hooks/useDragScroll";
import { MovieDetailsResponse } from "@/types/details";
import {
  MobileRecoCarousel,
  MobileSectionHeader,
  MobileIconAction,
  type MobileCardItem,
} from "./mobile/mobile-kit";

interface MoviesBentoRecommendationsProps {
  items: RecommendationItem[];
}

interface EnrichedBentoMeta {
  overview: string | null;
  runtimeText: string | null;
  genres: string[];
}

/** Prateleira desktop continua: rolagem horizontal com snap e setas (sem troca de lote). */
function DesktopShelf({ children }: { children: React.ReactNode }) {
  const ref = useDragScroll<HTMLDivElement>("x");
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  return (
    <div className="relative group/shelf">
      <div
        ref={ref}
        className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Rolar para a esquerda"
        className="absolute left-0 top-[35%] -translate-x-1/2 z-30 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md inline-flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity hover:border-primary/60"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Rolar para a direita"
        className="absolute right-0 top-[35%] translate-x-1/2 z-30 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md inline-flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity hover:border-primary/60"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const BATCH_SIZE = 8;

// Cache O(1) em memória + deduplicação de requests para enriquecer apenas os filmes necessários
const bentoMetaCache = new Map<number, EnrichedBentoMeta>();
const inFlightMetaRequests = new Map<number, Promise<EnrichedBentoMeta | null>>();

function formatMinutes(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function extractGenres(item: RecommendationItem, cached?: EnrichedBentoMeta): string[] {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres
      .map((g) => (typeof g === "string" ? g : g?.name))
      .filter((n): n is string => Boolean(n))
      .slice(0, 3);
  }
  return cached?.genres || [];
}

function extractYear(item: RecommendationItem): string {
  const raw = item.release_date || item.first_air_date || "";
  return raw.length >= 4 ? raw.slice(0, 4) : "";
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

async function fetchBentoMovieMeta(tmdbId: number): Promise<EnrichedBentoMeta | null> {
  if (bentoMetaCache.has(tmdbId)) {
    return bentoMetaCache.get(tmdbId)!;
  }
  const inflight = inFlightMetaRequests.get(tmdbId);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await api.get<MovieDetailsResponse>(`/api/movies/${tmdbId}`);
      const d = res.data;
      if (!d) return null;
      const meta: EnrichedBentoMeta = {
        overview: d.overview?.trim() || null,
        runtimeText: formatMinutes(d.runtime),
        genres: Array.isArray(d.genres) ? d.genres.slice(0, 3).map((g) => g.name) : [],
      };
      bentoMetaCache.set(tmdbId, meta);
      return meta;
    } catch {
      return null;
    } finally {
      inFlightMetaRequests.delete(tmdbId);
    }
  })();

  inFlightMetaRequests.set(tmdbId, promise);
  return promise;
}

function CompatibilityRing({ score }: { score: number }) {
  const rounded = Math.round(score);
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, rounded));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 pl-2 text-white border border-primary/50 backdrop-blur-md shadow-lg"
      title={`Compatibilidade com seu perfil: ${rounded}%`}
    >
      <svg className="w-7 h-7 -rotate-90 shrink-0" viewBox="0 0 28 28">
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
          className="stroke-primary transition-all duration-500"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={strokeDashoffset.toFixed(1)}
        />
      </svg>
      <span className="text-xs md:text-sm font-extrabold tracking-tight">
        {rounded}% <span className="font-medium text-[11px] text-zinc-300">Match</span>
      </span>
    </div>
  );
}

export function MoviesBentoRecommendations({ items }: MoviesBentoRecommendationsProps) {
  const [moviesList, setMoviesList] = useState<RecommendationItem[]>(items);
  const [batchIndex, setBatchIndex] = useState(0);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasCompletedCycle, setHasCompletedCycle] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [, setMetaVersion] = useState(0);

  const isRefreshingMovies = useExploreStore((s) => s.isRefreshingMovies);
  const refreshExploreBatch = useExploreStore((s) => s.refreshExploreBatch);

  // Conjunto O(1) de IDs já visualizados neste ciclo para alimentar a renovação sem repetição
  const seenInCycleRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setMoviesList(items);
  }, [items]);

  const totalBatches = Math.max(1, Math.ceil(moviesList.length / BATCH_SIZE));
  const safeBatchIndex = batchIndex % totalBatches;
  const isOnLastBatch = safeBatchIndex === totalBatches - 1;

  // Fatia em O(1) os 8 filmes do lote ativo (preenchendo a cauda sem duplicar caso o último lote tenha < 8)
  const currentBatch = useMemo(() => {
    if (moviesList.length === 0) return [];
    if (moviesList.length <= BATCH_SIZE) return moviesList;

    const start = safeBatchIndex * BATCH_SIZE;
    const primarySlice = moviesList.slice(start, start + BATCH_SIZE);
    if (primarySlice.length === BATCH_SIZE) return primarySlice;

    const needed = BATCH_SIZE - primarySlice.length;
    const primaryIds = new Set(primarySlice.map((m) => m.id));
    const wrapFill: RecommendationItem[] = [];
    for (const m of moviesList) {
      if (!primaryIds.has(m.id)) {
        wrapFill.push(m);
        if (wrapFill.length >= needed) break;
      }
    }
    return [...primarySlice, ...wrapFill];
  }, [moviesList, safeBatchIndex]);

  const safeActiveIdx =
    currentBatch.length > 0 ? Math.min(activeSlideIdx, currentBatch.length - 1) : 0;

  // Registra os IDs exibidos no lote atual em O(B) (B <= 8) e enriquece os Top 3
  useEffect(() => {
    currentBatch.forEach((m) => seenInCycleRef.current.add(m.id));

    const topThree = currentBatch.slice(0, 3);
    let active = true;
    topThree.forEach((m) => {
      const needsOverview = !m.overview || m.overview.trim() === "";
      const needsRuntime = !m.runtime || m.runtime <= 0;
      if ((needsOverview || needsRuntime) && !bentoMetaCache.has(m.id)) {
        fetchBentoMovieMeta(m.id).then((meta) => {
          if (active && meta) {
            setMetaVersion((v) => v + 1);
          }
        });
      }
    });

    return () => {
      active = false;
    };
  }, [currentBatch]);

  // Enriquece sob demanda o filme em foco no palco mobile se necessário
  useEffect(() => {
    const activeMovie = currentBatch[safeActiveIdx];
    if (!activeMovie) return;
    const needsOverview = !activeMovie.overview || activeMovie.overview.trim() === "";
    const needsRuntime = !activeMovie.runtime || activeMovie.runtime <= 0;
    if ((needsOverview || needsRuntime) && !bentoMetaCache.has(activeMovie.id)) {
      let cancelled = false;
      fetchBentoMovieMeta(activeMovie.id).then((meta) => {
        if (!cancelled && meta) {
          setMetaVersion((v) => v + 1);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [currentBatch, safeActiveIdx]);

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
      setIsTransitioning(false);
    }, 150);
  }, [safeBatchIndex, totalBatches]);

  const handlePrevBatch = useCallback(() => {
    if (totalBatches <= 1) return;
    const prevIdx = (safeBatchIndex - 1 + totalBatches) % totalBatches;

    setIsTransitioning(true);
    setTimeout(() => {
      setBatchIndex(prevIdx);
      setActiveSlideIdx(0);
      setIsTransitioning(false);
    }, 150);
  }, [safeBatchIndex, totalBatches]);

  const handleGenerateFreshSuggestions = useCallback(async () => {
    const excludeIds = Array.from(seenInCycleRef.current);
    moviesList.forEach((m) => {
      if (!excludeIds.includes(m.id)) excludeIds.push(m.id);
    });

    setIsTransitioning(true);
    const result = await refreshExploreBatch("movie", excludeIds);
    seenInCycleRef.current.clear();
    setBatchIndex(0);
    setActiveSlideIdx(0);
    setHasCompletedCycle(false);
    setIsTransitioning(false);

    if (result.count > 0) {
      toast.add({
        title: "Novas sugestões carregadas",
        description: result.refreshed
          ? `${result.count} filmes selecionados com base no seu perfil.`
          : "Sugestões reordenadas com prioridade para títulos menos exibidos.",
        type: "success",
      });
    }
  }, [moviesList, refreshExploreBatch]);

  const handleDismiss = useCallback(async (item: RecommendationItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const displayTitle = item.title || item.name || "Filme";
    setHiddenIds((prev) => new Set(prev).add(item.id));

    try {
      await api.post("/api/recommendations/dismiss", {
        tmdb_id: item.id,
        media_type: "movie",
        title: displayTitle,
        poster_path: item.poster_path,
        days_snooze: 180,
      });

      toast.add({
        title: "Recomendação dispensada",
        description: `"${displayTitle}" foi ocultado das suas recomendações por 6 meses.`,
        type: "info",
      });
    } catch (err) {
      console.error("Erro ao dispensar recomendação:", err);
    }

    setTimeout(() => {
      useExploreStore.getState().dismissItem(item.id);
      setMoviesList((prev) => prev.filter((i) => i.id !== item.id));
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 300);
  }, []);

  const mobileItems: MobileCardItem[] = currentBatch.map((m) => {
    const cached = bentoMetaCache.get(m.id);
    const meta = [
      extractYear(m),
      formatMinutes(m.runtime) || cached?.runtimeText,
      extractGenres(m, cached).slice(0, 2).join(", "),
    ]
      .filter(Boolean)
      .join(" • ");
    const tag = m.match_tags?.[0];
    return {
      id: m.id,
      title: m.title || m.name || "Filme",
      mediaType: "movie",
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_date: m.release_date,
      matchScore: m.match_score,
      meta,
      tag,
      tagHighlight: tag ? isHighlightedTag(tag) : false,
    };
  });

  if (!moviesList || moviesList.length === 0 || currentBatch.length === 0) {
    return null;
  }

  // Desktop: lista continua (sem lotes) - destaque #1, podio #2/#3 e prateleira rolavel com o restante
  const hero = moviesList[0];
  const duo = moviesList.slice(1, 3);
  const shelf = moviesList.slice(3);

  const heroCached = bentoMetaCache.get(hero.id);
  const heroTitle = hero.title || hero.name || "Filme";
  const heroYear = extractYear(hero);
  const heroRuntime = formatMinutes(hero.runtime) || heroCached?.runtimeText;
  const heroGenres = extractGenres(hero, heroCached);
  const heroOverview = hero.overview?.trim() || heroCached?.overview || "";
  const showFreshPoolAction = isOnLastBatch || hasCompletedCycle || totalBatches <= 1;

  return (
    <section aria-label="Filmes Recomendados">
      {/* Cabeçalho Mobile: título + 1 única ação (44px) */}
      <div className="lg:hidden">
        <MobileSectionHeader
          emoji="✨"
          title="Filmes Recomendados"
          subtitle="Escolhidos a dedo para o seu perfil."
          action={
            showFreshPoolAction ? (
              <MobileIconAction
                label={isRefreshingMovies ? "Gerando..." : "Novas sugestões"}
                onClick={handleGenerateFreshSuggestions}
                disabled={isRefreshingMovies}
                spinning={isRefreshingMovies}
              />
            ) : (
              <MobileIconAction
                label="Próximo lote"
                onClick={handleCycleBatch}
                disabled={isRefreshingMovies}
                icon={<RefreshCw className="w-5 h-5" />}
              />
            )
          }
        />
      </div>

      {/* Cabeçalho Desktop + Controles de Lote */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5 flex-wrap">
            <span>✨ Filmes Recomendados</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Filmes escolhidos a dedo com base no seu perfil de compatibilidade.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(
            <button
              type="button"
              onClick={handleGenerateFreshSuggestions}
              disabled={isRefreshingMovies}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/35 transition-all active:scale-[0.98] disabled:opacity-60"
              title="Buscar um novo conjunto de filmes compatíveis no catálogo"
            >
              <Sparkles className={cn("w-3.5 h-3.5", isRefreshingMovies && "animate-spin")} />
              <span>{isRefreshingMovies ? "Gerando..." : "Novas Sugestões"}</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-4 transition-all duration-200",
          isTransitioning || isRefreshingMovies
            ? "opacity-40 translate-y-1 pointer-events-none"
            : "opacity-100 translate-y-0"
        )}
      >
        {/* ====================================================================
            LAYOUT DESKTOP EXCLUSIVO (hidden lg:flex flex-col gap-4)
            Mantém 100% o Bento Grid consagrado com Hero (7 cols) + Duo (5 cols) + Shelf (5 cols)
            ==================================================================== */}
        <div className="hidden lg:flex flex-col gap-4">
          {/* Linha Superior: Spotlight #1 (7 colunas) + Pódio #2 e #3 (5 colunas) */}
          <div className="grid grid-cols-12 gap-4">
            {/* Card #1 — Escolha Principal */}
            <article
              className={cn(
                "col-span-7 relative min-h-[430px] rounded-2xl overflow-hidden border border-primary/35 hover:border-primary/70 bg-zinc-950 flex flex-col justify-end p-7 isolate group shadow-xl transition-all duration-300",
                hiddenIds.has(hero.id) && "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {/* Widescreen Backdrop */}
              <div className="absolute inset-0 -z-20">
                <PosterImage
                  src={hero.backdrop_path}
                  fallbackSrc={hero.poster_path}
                  alt={heroTitle}
                  title={heroTitle}
                  type="movie"
                  tmdbSize="w1280"
                  priority
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>

              {/* Scrim Cinematográfico */}
              <div
                className="absolute inset-0 -z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(4,8,18,0.22) 0%, rgba(4,8,18,0.65) 46%, rgba(4,8,18,0.96) 100%)",
                }}
              />

              {/* Topo do Spotlight */}
              <div className="absolute top-5 left-6 right-6 flex items-center justify-between gap-3 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 border border-white/15 backdrop-blur-md text-xs font-bold text-zinc-100">
                  <span className="text-amber-400 font-extrabold">
                    #{safeBatchIndex * BATCH_SIZE + 1} ESCOLHA PRINCIPAL
                  </span>
                  <span className="opacity-40">|</span>
                  <span className="text-zinc-300 font-medium">Alta Sintonia</span>
                </div>

                <CompatibilityRing score={hero.match_score} />
              </div>

              {/* Conteúdo Principal do Spotlight */}
              <div className="relative z-10 flex items-end gap-5 pt-14">
                <Link
                  href={`/movie/${hero.id}`}
                  prefetch={false}
                  className="w-28 aspect-[2/3] rounded-xl overflow-hidden border border-white/25 shadow-2xl shrink-0 hover:scale-[1.03] transition-transform"
                >
                  <PosterImage
                    src={hero.poster_path}
                    fallbackSrc={hero.backdrop_path}
                    alt={heroTitle}
                    title={heroTitle}
                    type="movie"
                    tmdbSize="w342"
                  />
                </Link>

                <div className="flex-1 min-w-0 text-white">
                  {/* Metadados Inline */}
                  <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-300 font-medium mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider">
                      Filme
                    </span>
                    {heroYear && <span>{heroYear}</span>}
                    {heroRuntime && (
                      <>
                        <span className="opacity-50">•</span>
                        <span>{heroRuntime}</span>
                      </>
                    )}
                    {heroGenres.length > 0 && (
                      <>
                        <span className="opacity-50">•</span>
                        <span className="truncate">{heroGenres.join(", ")}</span>
                      </>
                    )}
                  </div>

                  <Link href={`/movie/${hero.id}`} prefetch={false} className="block group/title">
                    <h3 className="text-2xl md:text-[28px] font-extrabold leading-tight tracking-tight mb-2 drop-shadow-md group-hover/title:text-primary transition-colors line-clamp-2">
                      {heroTitle}
                    </h3>
                  </Link>

                  {heroOverview && (
                    <p className="text-sm text-zinc-300 line-clamp-2 mb-3.5 max-w-2xl leading-relaxed">
                      {heroOverview}
                    </p>
                  )}

                  {/* Bloco de Explicabilidade */}
                  {hero.match_tags && hero.match_tags.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/[0.07] border border-white/15 backdrop-blur-md mb-4">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Por que foi escolhido para você
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {hero.match_tags.map((tag, idx) => (
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

                  {/* Ações do Spotlight */}
                  <div className="flex items-center flex-wrap gap-2.5">
                    <AddToListButton
                      tmdb_id={hero.id}
                      media_type="movie"
                      title={heroTitle}
                      poster_path={hero.poster_path}
                      backdrop_path={hero.backdrop_path}
                      release_date={hero.release_date}
                      showLabel
                      addLabel="Quero Assistir"
                    />

                    <Link
                      href={`/movie/${hero.id}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-white/12 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
                    >
                      <span>Ver Detalhes</span>
                      <ArrowUpRight className="w-4 h-4 opacity-80" />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => handleDismiss(hero, e)}
                      className="w-10 h-10 rounded-full bg-black/60 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/20 hover:border-red-400/40 backdrop-blur-md inline-flex items-center justify-center transition-all"
                      title="Não tenho interesse (ocultar por 6 meses)"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Coluna Lateral Direita: Pódio #2 e #3 */}
            {duo.length > 0 && (
              <div className="col-span-5 flex flex-col gap-4">
                {duo.map((item, idx) => {
                  const cached = bentoMetaCache.get(item.id);
                  const title = item.title || item.name || "Filme";
                  const year = extractYear(item);
                  const runtime = formatMinutes(item.runtime) || cached?.runtimeText;
                  const genres = extractGenres(item, cached);
                  const overview = item.overview?.trim() || cached?.overview || "";
                  const rankNumber = idx + 2;
                  const primaryTag = item.match_tags?.[0];
                  const secondaryTag = item.match_tags?.[1];

                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "flex-1 relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/60 p-3.5 flex gap-3.5 isolate group transition-all duration-300 hover:-translate-y-0.5 shadow-md",
                        hiddenIds.has(item.id) && "opacity-0 scale-95 pointer-events-none"
                      )}
                    >
                      {/* Fundo Ambiente Sutil com Backdrop */}
                      {item.backdrop_path && (
                        <div className="absolute inset-0 -z-20 opacity-15 dark:opacity-20 pointer-events-none">
                          <PosterImage
                            src={item.backdrop_path}
                            alt=""
                            tmdbSize="w780"
                            className="blur-[2px] group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-card via-card/90 to-card/75 pointer-events-none" />

                      {/* Pôster Vertical 2:3 */}
                      <Link
                        href={`/movie/${item.id}`}
                        prefetch={false}
                        className="relative w-[104px] aspect-[2/3] rounded-xl overflow-hidden border border-border shrink-0"
                      >
                        <PosterImage
                          src={item.poster_path}
                          fallbackSrc={item.backdrop_path}
                          alt={title}
                          title={title}
                          type="movie"
                          tmdbSize="w342"
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-extrabold backdrop-blur-sm">
                          #{rankNumber}
                        </span>
                      </Link>

                      {/* Corpo Editorial */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-extrabold shadow-sm">
                              <Zap className="w-3 h-3 fill-current" />
                              {Math.round(item.match_score)}% Match
                            </span>
                            <span className="text-[11px] text-muted-foreground font-semibold truncate">
                              {[year, runtime].filter(Boolean).join(" • ")}
                            </span>
                          </div>

                          <Link href={`/movie/${item.id}`} prefetch={false}>
                            <h3 className="text-base font-extrabold leading-snug tracking-tight text-foreground hover:text-primary transition-colors line-clamp-1">
                              {title}
                            </h3>
                          </Link>

                          {genres.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate mb-1.5">
                              {genres.join(" • ")}
                            </p>
                          )}

                          {overview && (
                            <p className="line-clamp-2 text-xs text-muted-foreground mb-2 leading-relaxed">
                              {overview}
                            </p>
                          )}
                        </div>

                        {/* Rodapé: Motivos + Ações Rápidas */}
                        <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
                          <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
                            {primaryTag && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-md text-[11px] font-semibold border truncate max-w-full",
                                  isHighlightedTag(primaryTag)
                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300"
                                    : "bg-secondary border-border text-foreground"
                                )}
                                title={primaryTag}
                              >
                                {primaryTag}
                              </span>
                            )}
                            {secondaryTag && (
                              <span
                                className="hidden xl:inline-block px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-secondary border border-border text-muted-foreground truncate"
                                title={secondaryTag}
                              >
                                {secondaryTag}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <AddToListButton
                              tmdb_id={item.id}
                              media_type="movie"
                              title={title}
                              poster_path={item.poster_path}
                              backdrop_path={item.backdrop_path}
                              release_date={item.release_date}
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
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prateleira Inferior: #4 a #8 (grade 5 colunas no desktop) */}
          {shelf.length > 0 && (
            <DesktopShelf>
              {shelf.map((item, idx) => {
                const title = item.title || item.name || "Filme";
                const year = extractYear(item);
                const genres = extractGenres(item);
                const rankNumber = idx + 4;
                const leadReason = item.match_tags?.[0] || "✨ Compatível com você";

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "shrink-0 snap-start w-[calc((100%-3.5rem)/5)] rounded-2xl bg-card border border-border hover:border-primary/60 overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg",
                      hiddenIds.has(item.id) && "opacity-0 scale-90 pointer-events-none"
                    )}
                  >
                    <Link
                      href={`/movie/${item.id}`}
                      prefetch={false}
                      className="relative aspect-[16/10] overflow-hidden bg-zinc-900 block"
                    >
                      <PosterImage
                        src={item.backdrop_path || item.poster_path}
                        fallbackSrc={item.poster_path}
                        alt={title}
                        title={title}
                        type="movie"
                        tmdbSize="w780"
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75 z-10 pointer-events-none" />

                      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary/95 text-primary-foreground text-[11px] font-extrabold shadow">
                          #{rankNumber} • {Math.round(item.match_score)}%
                        </span>

                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <AddToListButton
                            tmdb_id={item.id}
                            media_type="movie"
                            title={title}
                            poster_path={item.poster_path}
                            backdrop_path={item.backdrop_path}
                            release_date={item.release_date}
                            className="w-7 h-7 [&>svg]:w-3.5 [&>svg]:h-3.5"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleDismiss(item, e)}
                            className="w-7 h-7 rounded-full bg-black/65 hover:bg-red-500/25 text-zinc-200 hover:text-red-400 border border-white/20 backdrop-blur-md inline-flex items-center justify-center transition-colors"
                            title="Não tenho interesse"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Link>

                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <Link href={`/movie/${item.id}`} prefetch={false}>
                        <h4 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {title}
                        </h4>
                      </Link>

                      {(year || genres.length > 0) && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {[year, genres.slice(0, 2).join(", ")].filter(Boolean).join(" • ")}
                        </p>
                      )}

                      <div
                        className={cn(
                          "mt-auto px-2 py-1 rounded-md text-[10.5px] font-semibold border truncate",
                          isHighlightedTag(leadReason)
                            ? "bg-amber-500/12 border-amber-500/25 text-amber-600 dark:text-amber-300"
                            : "bg-secondary border-border text-foreground"
                        )}
                        title={leadReason}
                      >
                        {leadReason}
                      </div>
                    </div>
                  </article>
                );
              })}
            </DesktopShelf>
          )}
        </div>

        {/* ====================================================================
            LAYOUT MOBILE (< lg): carrossel de cards com peek + bottom sheet de ações
            ==================================================================== */}
        <MobileRecoCarousel
          items={mobileItems}
          rankOffset={safeBatchIndex * BATCH_SIZE}
          resetKey={`${safeBatchIndex}-${currentBatch[0]?.id ?? 0}`}
          topLabel={(i) => (i === 0 ? "ESCOLHA PRINCIPAL" : "")}
          onActiveChange={setActiveSlideIdx}
          onDismiss={(mi) => {
            const src = moviesList.find((m) => m.id === mi.id);
            if (src) handleDismiss(src, { preventDefault() {}, stopPropagation() {} } as React.MouseEvent);
          }}
          hiddenIds={hiddenIds}
        />
      </div>
    </section>
  );
}
