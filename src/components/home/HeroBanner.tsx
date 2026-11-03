"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Info, Star, Sparkles, Tv, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyListStore } from "@/store/useMyListStore";
import { cn } from "@/lib/utils";

export interface HeroFeatureItem {
  id: string;
  title: string;
  type: string;
  coverHorizontal: string;
  coverVertical?: string;
  description?: string;
  currentEpisode?: string | null;
  nextEpisodeToWatch?: { season: number; episode: number };
  release_date?: string | null;
  heroReason?: string;
}

interface HeroBannerProps {
  data: HeroFeatureItem;
  spotlights?: HeroFeatureItem[];
}

export function HeroBanner({ data, spotlights = [] }: HeroBannerProps) {
  const [selectedId, setSelectedId] = useState<string>(data.id);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [isMarking, setIsMarking] = useState(false);

  const toggleEpisode = useMyListStore((state) => state.toggleEpisode);
  const updateStatus = useMyListStore((state) => state.updateStatus);

  // Combina o item principal e os spotlights sem duplicatas
  const allSpotlights = [data, ...spotlights.filter((item) => item.id !== data.id)].slice(0, 4);
  const activeItem = allSpotlights.find((item) => item.id === selectedId) || data;

  const hasImage = Boolean(activeItem.coverHorizontal && activeItem.coverHorizontal.trim() !== "");
  const isMarked = markedIds.has(activeItem.id);

  const handleMarkWatched = async () => {
    if (isMarking || isMarked) return;
    setIsMarking(true);

    try {
      const tmdbId = parseInt(activeItem.id, 10);
      if (isNaN(tmdbId)) return;

      if (activeItem.type === "tv" && activeItem.nextEpisodeToWatch) {
        await toggleEpisode(
          tmdbId,
          activeItem.nextEpisodeToWatch.season,
          activeItem.nextEpisodeToWatch.episode,
          true
        );
      } else {
        await updateStatus(tmdbId, "completed");
      }
      setMarkedIds((prev) => new Set(prev).add(activeItem.id));
    } catch (error) {
      console.error("Erro ao marcar como visto no HeroBanner:", error);
    } finally {
      setIsMarking(false);
    }
  };

  const getReasonBadge = () => {
    if (activeItem.heroReason === "new_episode") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Episódio Novo
        </span>
      );
    }
    if (activeItem.heroReason === "trending_plan_to_watch") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/25 text-primary border border-primary/30 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          Em Alta no seu Radar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold backdrop-blur-md">
        <Star className="w-3.5 h-3.5 fill-current" />
        Em Destaque
      </span>
    );
  };

  const releaseYear = activeItem.release_date
    ? new Date(activeItem.release_date).getFullYear()
    : null;

  return (
    <div className="relative w-full h-[60vh] sm:h-[65vh] lg:h-[72vh] flex items-end overflow-hidden bg-background">
      {/* Background Image with Cinematic Ambience */}
      <div className="absolute inset-0 z-0">
        {hasImage ? (
          <div className="relative w-full h-full">
            <Image
              src={activeItem.coverHorizontal}
              alt={activeItem.title}
              fill
              className="object-cover object-[center_20%] scale-[1.02] transition-all duration-700 ease-out filter brightness-[0.80]"
              priority
            />
            {/* Layered cinematic gradients to blend into app background */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-background via-muted/30 to-background" />
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pb-10 sm:pb-14 w-full flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="max-w-2xl space-y-4">
          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
            {getReasonBadge()}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/80 text-foreground border border-border backdrop-blur-md text-[11px]">
              {activeItem.type === "movie" ? (
                <>
                  <Film className="w-3 h-3 text-muted-foreground" /> Filme
                </>
              ) : (
                <>
                  <Tv className="w-3 h-3 text-muted-foreground" /> Série
                </>
              )}
            </span>

            {releaseYear && !isNaN(releaseYear) && (
              <span className="text-zinc-400 font-semibold">• {releaseYear}</span>
            )}

            {activeItem.currentEpisode && (
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold text-[11px] backdrop-blur-md">
                Próximo: {activeItem.currentEpisode}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight drop-shadow-md">
            {activeItem.title}
          </h1>

          {/* Description */}
          {activeItem.description && (
            <p className="text-sm sm:text-base text-zinc-300 max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
              {activeItem.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <Button
              onClick={handleMarkWatched}
              disabled={isMarking || isMarked}
              size="lg"
              className={cn(
                "gap-2.5 rounded-full font-bold px-7 shadow-xl shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                isMarked
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              <CheckCircle className="w-5 h-5" />
              {isMarked
                ? "✓ Marcado como Visto!"
                : activeItem.currentEpisode
                ? `Marcar ${activeItem.currentEpisode} como Visto`
                : "Marcar como Visto"}
            </Button>

            <Link href={`/${activeItem.type === "movie" ? "movie" : "tv"}/${activeItem.id}`}>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 bg-secondary/85 hover:bg-secondary text-secondary-foreground rounded-full font-semibold px-6 backdrop-blur-md border border-border"
              >
                <Info className="w-5 h-5 text-muted-foreground" />
                Detalhes & Temporadas
              </Button>
            </Link>
          </div>
        </div>

        {/* Multi-spotlight switcher (Desktop right rail) */}
        {allSpotlights.length > 1 && (
          <div className="hidden lg:flex flex-col gap-2 p-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 max-w-xs shrink-0 shadow-2xl">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              Destaques na sua Lista
            </p>
            <div className="flex flex-col gap-1.5">
              {allSpotlights.map((spotlight) => {
                const isSelected = spotlight.id === activeItem.id;
                return (
                  <button
                    key={spotlight.id}
                    onClick={() => setSelectedId(spotlight.id)}
                    className={cn(
                      "p-2 rounded-xl flex items-center gap-3 transition-all text-left",
                      isSelected
                        ? "bg-secondary/90 border border-primary/50 shadow-sm"
                        : "hover:bg-secondary/40 opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      <Image
                        src={spotlight.coverHorizontal || spotlight.coverVertical || ""}
                        alt={spotlight.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {spotlight.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {spotlight.currentEpisode || (spotlight.type === "movie" ? "Filme" : "Série")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
