"use client";

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
import { Star, Activity, Calendar } from "lucide-react";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { PosterImage } from "@/components/shared/PosterImage";

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
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full relative"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {items.map((item) => {
          const displayTitle = item.title || item.name || "Unknown";

          return (
            <CarouselItem
              key={item.id}
              className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
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
                          <span className="text-[9px] md:text-xs font-medium text-zinc-300 line-clamp-1 drop-shadow-md">
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
                      {item.match_tags && item.match_tags.length > 0 && (
                        <div className="mt-auto pt-1 md:pt-2 border-t border-white/20">
                          <span className="text-[8px] md:text-[9px] lg:text-[10px] text-zinc-400 block mb-1 uppercase tracking-wider font-semibold">
                            Por que foi selecionado:
                          </span>
                          <div className="flex flex-col gap-0.5 md:gap-1">
                            {item.match_tags.map((tag, idx) => (
                              <span key={idx} className="text-[9px] md:text-xs text-zinc-100 line-clamp-1 drop-shadow-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to List Button */}
                    <div className="absolute top-2 right-2 z-30">
                      <AddToListButton
                        tmdb_id={item.id}
                        media_type={item.media_type as 'movie' | 'tv'}
                        title={displayTitle}
                        poster_path={item.poster_path}
                        backdrop_path={item.backdrop_path}
                        className="w-7 h-7 md:w-8 md:h-8 [&>svg]:w-3 [&>svg]:h-3 md:[&>svg]:w-4 md:[&>svg]:h-4"
                      />
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
