"use client";

import Link from "next/link";
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
  subtitle?: string;
  items: MediaItem[];
  layout?: "tracking" | "poster";
  actionHref?: string;
  actionText?: string;
}

export function ContentCarousel({
  title,
  subtitle,
  items,
  layout = "poster",
  actionHref,
  actionText,
}: ContentCarouselProps) {
  const isTracking = layout === "tracking";
  // Widescreen 16:9 cinematic basis for tracking, classic poster aspect for others
  const basisClass = isTracking
    ? "basis-[88%] sm:basis-[48%] md:basis-[45%] lg:basis-[30%] xl:basis-[24%]"
    : "basis-[42%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6";

  return (
    <div className="w-full relative py-2 group/carousel">
      {/* Header com Título, Subtítulo e Link de Ação */}
      <div className="px-4 lg:px-8 mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              {items.length}
            </span>
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {actionHref && (
          <Link
            href={actionHref}
            prefetch={false}
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors shrink-0 pb-1"
          >
            <span>{actionText || "Ver todos"}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Carousel Track */}
      <div className="px-4 lg:px-8">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3.5">
            {items.map((item, index) => (
              <CarouselItem key={item.id} className={`pl-3.5 ${basisClass}`}>
                <div className="py-1">
                  <MediaCard item={item} layout={layout} priority={index < 4} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <CarouselPrevious className="left-0 -ml-3 bg-background/90 hover:bg-background text-foreground border-border h-11 w-11 rounded-full shadow-2xl backdrop-blur-md" />
            <CarouselNext className="right-0 -mr-3 bg-background/90 hover:bg-background text-foreground border-border h-11 w-11 rounded-full shadow-2xl backdrop-blur-md" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
