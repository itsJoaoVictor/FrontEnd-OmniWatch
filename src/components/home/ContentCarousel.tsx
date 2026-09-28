"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MediaCard, MediaItem } from "./MediaCard";
import { ChevronRight } from "lucide-react";

interface ContentCarouselProps {
  title: string;
  items: MediaItem[];
  layout?: "tracking" | "poster";
}

export function ContentCarousel({ title, items, layout = "poster" }: ContentCarouselProps) {
  const isTracking = layout === "tracking";
  // Ajuste do tamanho dos itens baseado no layout
  const basisClass = isTracking 
    ? "basis-[90%] md:basis-[45%] lg:basis-[30%] xl:basis-[25%]" 
    : "basis-[40%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6";

  return (
    <div className="w-full relative py-2 group/carousel">
      <div className="px-4 lg:px-8 mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
          {title}
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </h2>
      </div>
      
      <div className="px-4 lg:px-8">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {items.map((item) => (
              <CarouselItem key={item.id} className={`pl-4 ${basisClass}`}>
                <div className="py-2">
                  <MediaCard item={item} layout={layout} priority={items.indexOf(item) < 4} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <CarouselPrevious className="left-0 -ml-4 bg-background/80 hover:bg-background text-foreground border-border h-12 w-12 rounded-full shadow-xl" />
            <CarouselNext className="right-0 -mr-4 bg-background/80 hover:bg-background text-foreground border-border h-12 w-12 rounded-full shadow-xl" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
