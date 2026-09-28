"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RecommendationItem } from "@/types/recommendation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, MoreVertical, EyeOff } from "lucide-react";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { PosterImage } from "@/components/shared/PosterImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";

interface RecommendationsCarouselProps {
  items: RecommendationItem[];
  showReleaseDate?: boolean;
}

function formatReleaseDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function RecommendationsCarousel({ items, showReleaseDate = false }: RecommendationsCarouselProps) {
  const [itemsList, setItemsList] = useState<RecommendationItem[]>(items);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setItemsList(items);
  }, [items]);

  const handleDismiss = async (item: RecommendationItem) => {
    const displayTitle = item.title || item.name || "Obra";

    // 1. Aplica efeito visual de fade-out e escala
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

    // 2. Remove do carrossel após a transição
    setTimeout(() => {
      setItemsList((prev) => prev.filter((i) => i.id !== item.id));
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 350);
  };

  if (!itemsList || itemsList.length === 0) {
    return null;
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: itemsList.length > 5,
      }}
      className="w-full relative"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {itemsList.map((item) => {
          const displayTitle = item.title || item.name || "Unknown";
          const isHiding = hiddenIds.has(item.id);

          return (
            <CarouselItem
              key={item.id}
              className={cn(
                "pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 transition-all duration-300",
                isHiding ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
              )}
            >
              <Link href={`/${item.media_type === "movie" ? "movie" : "tv"}/${item.id}`} className="block p-1">
                <Card className="overflow-hidden border-2 border-primary/50 bg-transparent group relative cursor-pointer aspect-[2/3]">
                  <CardContent className="p-0 h-full w-full relative">
                    <PosterImage
                      src={item.poster_path}
                      fallbackSrc={item.backdrop_path}
                      alt={displayTitle}
                      title={displayTitle}
                      type={item.media_type}
                      fill
                      className="transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    />

                    {/* Always visible Match Score Badge and Release Date at top left */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                      <div className="bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center shadow-md">
                        <Activity className="w-3 h-3 mr-1" />
                        {Math.round(item.match_score)}%
                      </div>
                      {showReleaseDate && (item.release_date || item.first_air_date) && (
                        <div className="bg-amber-500 text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatReleaseDate(item.release_date || item.first_air_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Always visible Primary Reason or Release Date and Title at bottom (Mobile Friendly) */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 pt-8 md:pt-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end group-hover:opacity-0 transition-opacity duration-300 z-10">
                      <h3 className="text-white font-bold text-[11px] md:hidden line-clamp-2 leading-tight mb-0.5 drop-shadow-md">
                        {displayTitle}
                      </h3>
                      {showReleaseDate && (item.release_date || item.first_air_date) ? (
                        <span className="text-[10px] md:text-xs font-semibold text-amber-300 flex items-center gap-1 drop-shadow-md">
                          <Calendar className="w-3 h-3 shrink-0" />
                          Estreia: {formatReleaseDate(item.release_date || item.first_air_date)}
                        </span>
                      ) : (
                        item.match_tags && item.match_tags.length > 0 && (
                          <span
                            className={`text-[9px] md:text-xs font-medium line-clamp-1 drop-shadow-md ${
                              item.match_tags[0].startsWith("🍿")
                                ? "text-amber-300 font-semibold"
                                : item.match_tags[0].startsWith("🎬") || item.match_tags[0].startsWith("🌟") || item.match_tags[0].startsWith("🚀")
                                ? "text-amber-200/90 font-medium"
                                : "text-zinc-300"
                            }`}
                          >
                            {item.match_tags[0]}
                          </span>
                        )
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 active:opacity-100 sm:focus:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 md:p-4 z-20">
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="inline-block px-1.5 py-0.5 md:px-2 md:py-1 bg-white/20 text-white text-[9px] md:text-[10px] font-semibold rounded-md uppercase tracking-wider">
                            {item.media_type === "movie" ? "Filme" : item.media_type === "tv" ? "Série" : "Mídia"}
                          </span>
                          {showReleaseDate && (item.release_date || item.first_air_date) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] md:text-[10px] font-semibold rounded-md">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatReleaseDate(item.release_date || item.first_air_date)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-xs md:text-sm lg:text-base line-clamp-2 leading-tight mb-1 md:mb-2 drop-shadow-md">
                          {displayTitle}
                        </h3>
                      </div>

                      {/* Top Tags (Por que foi selecionado) */}
                      {item.match_tags && item.match_tags.length > 0 && (() => {
                        const isHighlighted =
                          item.match_tags[0].startsWith("🍿") ||
                          item.match_tags[0].startsWith("🎬") ||
                          item.match_tags[0].startsWith("🌟") ||
                          item.match_tags[0].startsWith("🚀");
                        const primaryTag = isHighlighted ? item.match_tags[0] : null;
                        const otherTags = isHighlighted ? item.match_tags.slice(1) : item.match_tags;

                        return (
                          <div className="mt-auto pt-1.5 md:pt-2 border-t border-white/20">
                            <span className="text-[8px] md:text-[9px] text-zinc-400 block mb-1 uppercase tracking-wider font-semibold">
                              Por que foi selecionado:
                            </span>
                            {primaryTag && (
                              <div className="mb-1.5 px-2 py-1 rounded bg-amber-500/15 border border-amber-500/25 text-amber-200 text-[10px] md:text-[11px] font-medium leading-snug line-clamp-2">
                                {primaryTag}
                              </div>
                            )}
                            {otherTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {otherTags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-white/15 text-zinc-200 text-[9px] md:text-[10px] font-medium leading-none"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Top Right Action Buttons (Add to List + Menu de Opções) */}
                    <div
                      className="absolute top-2 right-2 z-30 flex items-center gap-1.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <AddToListButton
                        tmdb_id={item.id}
                        media_type={item.media_type as 'movie' | 'tv'}
                        title={displayTitle}
                        poster_path={item.poster_path}
                        backdrop_path={item.backdrop_path}
                        className="w-7 h-7 md:w-8 md:h-8 [&>svg]:w-3 [&>svg]:h-3 md:[&>svg]:w-4 md:[&>svg]:h-4"
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition-colors shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          title="Mais opções"
                        >
                          <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-300 hover:text-white" />
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
                            className="cursor-pointer text-xs md:text-sm text-zinc-200 hover:text-red-400 focus:text-red-400 flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition-colors"
                          >
                            <EyeOff className="w-4 h-4 text-zinc-400" />
                            <span>Não tenho interesse</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <div className="hidden md:block">
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </div>
    </Carousel>
  );
}
