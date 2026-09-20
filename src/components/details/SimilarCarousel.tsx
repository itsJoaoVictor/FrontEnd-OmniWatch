import Image from "next/image";
import Link from "next/link";
import { SimilarItem } from "@/types/details";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { AddToListButton } from "@/components/shared/AddToListButton";

interface SimilarCarouselProps {
  items: SimilarItem[];
  type: "movie" | "tv";
}

export function SimilarCarousel({ items, type }: SimilarCarouselProps) {
  if (!items || items.length === 0) return null;
  const imageUrl = "https://image.tmdb.org/t/p/w342";

  return (
    <div className="my-8">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Títulos Semelhantes</h3>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="relative inset-auto translate-y-0 translate-x-0 h-8 w-8 bg-background hover:bg-accent border" />
            <CarouselNext className="relative inset-auto translate-y-0 translate-x-0 h-8 w-8 bg-background hover:bg-accent border" />
          </div>
        </div>
        <CarouselContent className="-ml-2 md:-ml-4">
          {items.map((item) => (
            <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-[140px] md:basis-[180px] lg:basis-[220px]">
              <Link href={`/${type}/${item.id}`}>
                <Card className="border-0 bg-transparent shadow-none hover:opacity-80 transition-opacity">
                  <CardContent className="p-0">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted mb-2 group">
                      {item.poster_path ? (
                        <Image
                          src={`${imageUrl}${item.poster_path}`}
                          alt={item.title}
                          fill
                          priority={items.indexOf(item) < 4}
                          loading={items.indexOf(item) < 4 ? "eager" : "lazy"}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem Poster
                        </div>
                      )}
                      {/* Botão de Adicionar à Lista */}
                      <div className="absolute top-2 right-2 z-10">
                        <AddToListButton tmdb_id={item.id} media_type={type} className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4" />
                      </div>
                    </div>
                    <p className="font-bold text-sm truncate">{item.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                      {(item.vote_average / 2).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
