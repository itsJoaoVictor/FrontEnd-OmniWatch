"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, EyeOff, Flame, Zap } from "lucide-react";
import { RecommendationItem } from "@/types/recommendation";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { PosterImage } from "@/components/shared/PosterImage";
import { TrendingSkeleton } from "./trending-skeleton";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useExploreStore } from "@/store/useExploreStore";
import { useDragScroll } from "@/hooks/useDragScroll";
import {
  MobilePosterRail,
  MobileSectionHeader,
  type MobileCardItem,
} from "./mobile/mobile-kit";

function extractYear(item: RecommendationItem): string {
  const raw = item.release_date || item.first_air_date || "";
  return raw.length >= 4 ? raw.slice(0, 4) : "";
}

function extractGenres(item: RecommendationItem): string[] {
  if (!Array.isArray(item.genres)) return [];
  return item.genres
    .map((g) => (typeof g === "string" ? g : g?.name))
    .filter((n): n is string => Boolean(n))
    .slice(0, 2);
}

export function RecentVibeSection() {
  const items = useExploreStore((state) => state.recentVibeItems);
  const isLoading = useExploreStore((state) => state.isLoadingRecentVibe);
  const fetchFeed = useExploreStore((state) => state.fetchFeed);

  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const shelfRef = useDragScroll<HTMLDivElement>("x");

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const scrollShelf = useCallback(
    (dir: 1 | -1) => {
      const el = shelfRef.current;
      if (!el) return;
      el.scrollBy({ left: dir * el.clientWidth * 0.88, behavior: "smooth" });
    },
    [shelfRef]
  );

  const handleDismiss = useCallback(async (item: RecommendationItem, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const displayTitle = item.title || item.name || "Obra";
    const mediaType = item.media_type === "tv" ? "tv" : "movie";
    setHiddenIds((prev) => new Set(prev).add(item.id));

    try {
      await api.post("/api/recommendations/dismiss", {
        tmdb_id: item.id,
        media_type: mediaType,
        title: displayTitle,
        poster_path: item.poster_path,
        days_snooze: 180,
      });

      toast.add({
        title: "Sugestão ocultada",
        description: `"${displayTitle}" não aparecerá nas suas recomendações pelos próximos 6 meses.`,
        type: "info",
      });
    } catch (err) {
      console.error("Erro ao dispensar obra da vibe recente:", err);
    }

    setTimeout(() => {
      useExploreStore.getState().dismissItem(item.id);
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 280);
  }, []);

  const mobileItems = useMemo<MobileCardItem[]>(() => {
    return (items || []).map((item) => {
      const mediaType: "movie" | "tv" = item.media_type === "tv" ? "tv" : "movie";
      const year = extractYear(item);
      const formatLabel = mediaType === "tv" ? "Série" : "Filme";
      const tag =
        item.match_tags?.find((t) => t !== "✨ Na Sua Vibe") ||
        item.match_tags?.[0] ||
        "✨ Na Sua Vibe";
      return {
        id: item.id,
        title: item.title || item.name || "Obra",
        mediaType,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date || item.first_air_date,
        matchScore: item.match_score,
        meta: [formatLabel, year].filter(Boolean).join(" • "),
        tag,
        tagHighlight: true,
      };
    });
  }, [items]);

  if (isLoading && (!items || items.length === 0)) {
    return <TrendingSkeleton />;
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section aria-label="Na Sua Vibe Recente" className="w-full">
      {/* Cabeçalho Mobile */}
      <div className="lg:hidden">
        <MobileSectionHeader
          emoji="⚡"
          title="Na Sua Vibe Recente"
          badge="Últimos 30 dias"
          subtitle="Baseado no que você assistiu ou está assistindo nos últimos 30 dias."
        />
        <MobilePosterRail
          items={mobileItems}
          featureFirst
          hiddenIds={hiddenIds}
          onDismiss={(mi) => {
            const src = items.find((x) => x.id === mi.id);
            if (src) handleDismiss(src);
          }}
        />
      </div>

      {/* Layout Desktop */}
      <div className="hidden lg:flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/12 border border-amber-500/25 text-amber-500 text-[11px] font-bold tracking-wider uppercase mb-2">
              <Flame className="w-3.5 h-3.5" />
              Últimos 30 Dias
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>⚡ Na Sua Vibe Recente</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Descobertas guiadas apenas pelo que você concluiu ou está assistindo nos últimos 30 dias.
            </p>
          </div>
        </div>

        <div className="relative group/vibeshelf">
          <div
            ref={shelfRef}
            className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, idx) => {
              const mediaType: "movie" | "tv" = item.media_type === "tv" ? "tv" : "movie";
              const href = mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;
              const title = item.title || item.name || "Obra";
              const year = extractYear(item);
              const genres = extractGenres(item);
              const specificTag =
                item.match_tags?.find((t) => t !== "✨ Na Sua Vibe") ||
                item.match_tags?.[0] ||
                "✨ Na Sua Vibe";

              return (
                <article
                  key={`${mediaType}-${item.id}`}
                  className={cn(
                    "shrink-0 snap-start w-[calc((100%-3.5rem)/5)] rounded-2xl bg-card border border-border hover:border-primary/60 overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg",
                    hiddenIds.has(item.id) && "opacity-0 scale-90 pointer-events-none"
                  )}
                >
                  <Link
                    href={href}
                    prefetch={false}
                    className="relative aspect-[16/10] overflow-hidden bg-zinc-900 block"
                  >
                    <PosterImage
                      src={item.backdrop_path || item.poster_path}
                      fallbackSrc={item.poster_path}
                      alt={title}
                      title={title}
                      type={mediaType}
                      tmdbSize="w780"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 z-10 pointer-events-none" />

                    <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/95 text-primary-foreground text-[11px] font-extrabold shadow">
                        <Zap className="w-3 h-3 fill-current" />
                        #{idx + 1} • {Math.round(item.match_score)}%
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
                          media_type={mediaType}
                          title={title}
                          poster_path={item.poster_path}
                          backdrop_path={item.backdrop_path}
                          release_date={item.release_date || item.first_air_date}
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

                    <span className="absolute bottom-2 left-2 z-20 px-1.5 py-0.5 rounded bg-black/70 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                      {mediaType === "tv" ? "Série" : "Filme"}
                    </span>
                  </Link>

                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <Link href={href} prefetch={false}>
                      <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {title}
                      </h3>
                    </Link>

                    {(year || genres.length > 0) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[year, genres.join(", ")].filter(Boolean).join(" • ")}
                      </p>
                    )}

                    <div
                      className="mt-auto px-2 py-1 rounded-md text-[10.5px] font-semibold border truncate bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-300"
                      title={specificTag}
                    >
                      {specificTag}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollShelf(-1)}
            aria-label="Rolar para a esquerda"
            className="absolute left-0 top-[35%] -translate-x-1/2 z-30 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md inline-flex items-center justify-center opacity-0 group-hover/vibeshelf:opacity-100 transition-opacity hover:border-primary/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollShelf(1)}
            aria-label="Rolar para a direita"
            className="absolute right-0 top-[35%] translate-x-1/2 z-30 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md inline-flex items-center justify-center opacity-0 group-hover/vibeshelf:opacity-100 transition-opacity hover:border-primary/60"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
