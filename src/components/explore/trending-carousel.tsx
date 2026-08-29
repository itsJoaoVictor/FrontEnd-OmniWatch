"use client";

import Image from "next/image";
import { TrendingItem } from "@/types/trending";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface TrendingCarouselProps {
  items: TrendingItem[];
}

export function TrendingCarousel({ items }: TrendingCarouselProps) {
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
          const imageUrl = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : "https://picsum.photos/500/750?grayscale";

          return (
            <CarouselItem
              key={item.id}
              className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
            >
              <div className="p-1">
                <Card className="overflow-hidden border-0 bg-transparent group relative cursor-pointer aspect-[2/3]">
                  <CardContent className="p-0 h-full w-full">
                    <Image
                      src={imageUrl}
                      alt={displayTitle}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-primary/80 text-primary-foreground text-xs font-semibold rounded-md mb-1">
                          {item.media_type === "movie" ? "Filme" : item.media_type === "tv" ? "Série" : "Mídia"}
                        </span>
                        <h3 className="text-white font-bold text-lg line-clamp-2">
                          {displayTitle}
                        </h3>
                      </div>
                      
                      <div className="flex items-center text-yellow-400">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        <span className="text-sm font-medium text-white">
                          {item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
